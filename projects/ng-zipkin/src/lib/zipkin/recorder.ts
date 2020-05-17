import {Endpoint} from './endpoint';
import {Record} from './record';
import {Logger, Span} from './logger';
import {now} from './utils';
import {TraceId} from './trace-id';

const defaultTimeout = 60 * 1000000;
const defaultTagsSymbol = Symbol('defaultTags');

export interface Recorder {
  record(rec: Record): void;

  setDefaultTags(tags): void;

  getDefaultTags()
}

export class PartialSpan {
  traceId;
  timeoutTimestamp: number;
  delegate: Span;
  localEndpoint: Endpoint;
  shouldFlush: boolean;

  constructor(traceId: TraceId, timeoutTimestamp: number) {
    this.traceId = traceId;
    this.timeoutTimestamp = timeoutTimestamp;
    this.delegate = new Span(traceId);
    this.localEndpoint = new Endpoint();
    this.shouldFlush = false;
  }

  setDuration(finishTimestamp: number) {
    if (this.shouldFlush) {
      return;
    }

    this.shouldFlush = true; // even if we can't derive duration, we should report on finish

    const startTimestamp = this.delegate.timestamp;
    if (typeof startTimestamp === 'undefined') {
      // We can't calculate duration without a start timestamp,
      // but an annotation is better than nothing
      this.delegate.addAnnotation(finishTimestamp, 'finish');
    } else {
      this.delegate.setDuration(finishTimestamp - startTimestamp);
    }
  }
}

export class ConsoleRecorder implements Recorder {
  logger: (message?: any, ...optionalParams: any[]) => void;

  constructor(logger: (message?: any, ...optionalParams: any[]) => void = console.log) {
    this.logger = logger;
  }

  record(rec: Record) {
    const {spanId, parentId, traceId} = rec.traceId;
    this.logger(
      `Record at (timestamp=${rec.timestamp}, spanId=${spanId}, parentId=${parentId}, `
      + `traceId=${traceId}): ${rec.annotation.toString()}`
    );
  }

  setDefaultTags(tags): void {
  }

  getDefaultTags() {
  }

  toString() {
    return 'ConsoleRecorder()';
  }
}

// tslint:disable-next-line:variable-name
export const _timedOut = (span) => {
  return span.timeoutTimestamp < now();
};

export class BatchRecorder implements Recorder {
  readonly logger: Logger;
  readonly timeout: number;
  readonly partialSpans: Map<string, PartialSpan>;

  constructor(logger: Logger, timeout: number = defaultTimeout, defaultTags: { [name: string]: string; } = {}) {
    this.logger = logger;
    this.timeout = timeout;
    this.partialSpans = new Map();
    this[defaultTagsSymbol] = defaultTags;

    // read through the partials spans regularly and collect any timed-out ones
    const timer = setInterval(() => {
      this.partialSpans.forEach((span, id) => {
        if (_timedOut(span)) {
          // the zipkin-js.flush annotation makes it explicit that
          // the span has been reported because of a timeout, even
          // when it is not finished yet (and thus enqueued for reporting)
          span.delegate.addAnnotation(now(), 'zipkin-js.flush');
          this._writeSpan(id, span);
        }
      });
    }, 1000); // every second, this will flush to zipkin any spans that have timed out
    if (timer.unref) { // unref might not be available in browsers
      timer.unref(); // Allows Node to terminate instead of blocking on timer
    }
  }

  _addDefaultTagsAndLocalEndpoint(span) {
    const defaultTags = this[defaultTagsSymbol];
    for (const tag in defaultTags) {
      if (Object.prototype.hasOwnProperty.call(defaultTags, tag)) {
        span.delegate.putTag(tag, defaultTags[tag]);
      }
    }
    span.delegate.setLocalEndpoint(span.localEndpoint);
  }

  _writeSpan(id, span: PartialSpan, isNew = false) {
    if (!isNew && typeof this.partialSpans.get(id) === 'undefined') {
      // Span not found. Could have been expired.
      return;
    }
    // ready for garbage collection
    this.partialSpans.delete(id);

    const spanToWrite = span.delegate;
    // Only add default tags and local endpoint on the first report of a span
    if (span.delegate.timestamp) {
      this._addDefaultTagsAndLocalEndpoint(span);
    }
    this.logger.logSpan(spanToWrite);
  }

  _updateSpanMap(id, timestamp, updater) {
    let span;
    let isNew = false; // we need to special case late finish annotations
    if (this.partialSpans.has(id)) {
      span = this.partialSpans.get(id);
    } else {
      isNew = true;
      span = new PartialSpan(id, timestamp + this.timeout);
    }
    updater(span);
    if (span.shouldFlush) {
      this._writeSpan(id, span, isNew);
    } else {
      this.partialSpans.set(id, span);
    }
  }

  record(rec: Record): void {
    const id = rec.traceId;

    this._updateSpanMap(id, rec.timestamp, (span: PartialSpan) => {
      switch (rec.annotation.annotationType) {
        case 'ClientAddr':
          span.delegate.setKind('SERVER');
          span.delegate.setRemoteEndpoint(new Endpoint(
            rec.annotation.serviceName,
            rec.annotation.host && rec.annotation.host.ipv4(),
            rec.annotation.port
          ));
          break;
        case 'ClientSend':
          span.delegate.setKind('CLIENT');
          span.delegate.setTimestamp(rec.timestamp);
          break;
        case 'ClientRecv':
          span.delegate.setKind('CLIENT');
          span.setDuration(rec.timestamp);
          break;
        case 'ServerSend':
          span.delegate.setKind('SERVER');
          span.setDuration(rec.timestamp);
          break;
        case 'ServerRecv':
          span.delegate.setShared(id.isShared());
          span.delegate.setKind('SERVER');
          span.delegate.setTimestamp(rec.timestamp);
          break;
        case 'ProducerStart':
          span.delegate.setKind('PRODUCER');
          span.delegate.setTimestamp(rec.timestamp);
          break;
        case 'ProducerStop':
          span.delegate.setKind('PRODUCER');
          span.setDuration(rec.timestamp);
          break;
        case 'ConsumerStart':
          span.delegate.setKind('CONSUMER');
          span.delegate.setTimestamp(rec.timestamp);
          break;
        case 'ConsumerStop':
          span.delegate.setKind('CONSUMER');
          span.setDuration(rec.timestamp);
          break;
        case 'MessageAddr':
          span.delegate.setRemoteEndpoint(new Endpoint(
            rec.annotation.serviceName,
            rec.annotation.host && rec.annotation.host.ipv4(),
            rec.annotation.port
          ));
          break;
        case 'LocalOperationStart':
          span.delegate.setName(rec.annotation.name);
          span.delegate.setTimestamp(rec.timestamp);
          break;
        case 'LocalOperationStop':
          span.setDuration(rec.timestamp);
          break;
        case 'Message':
          span.delegate.addAnnotation(rec.timestamp, rec.annotation.message);
          break;
        case 'Rpc':
          span.delegate.setName(rec.annotation.name);
          break;
        case 'ServiceName':
          span.localEndpoint.setServiceName(rec.annotation.serviceName);
          break;
        case 'BinaryAnnotation':
          span.delegate.putTag(rec.annotation.key, rec.annotation.value as string);
          break;
        case 'LocalAddr':
          span.localEndpoint.setIpv4(
            rec.annotation.host && rec.annotation.host.ipv4()
          );
          span.localEndpoint.setPort(rec.annotation.port);
          break;
        case 'ServerAddr':
          span.delegate.setKind('CLIENT');
          span.delegate.setRemoteEndpoint(new Endpoint(
            rec.annotation.serviceName,
            rec.annotation.host && rec.annotation.host.ipv4(),
            rec.annotation.port
          ));
          break;
        default:
          break;
      }
    });
  }

  flush(): void {
    this.partialSpans.forEach((span, id) => {
      this._writeSpan(id, span);
    });
  }

  setDefaultTags(tags) {
    this[defaultTagsSymbol] = tags;
  }

  getDefaultTags() {
    return this[defaultTagsSymbol];
  }

  toString() {
    return 'BatchRecorder()';
  }
}
