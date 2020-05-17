import {hrtime, isPromise, isUndefinedOrNull, now, randomTraceId} from './utils';
import {IOption, None, Some} from './option';
import {TraceId} from './trace-id';
import {Context} from './context';
import {Recorder} from './recorder';
import {alwaysSample, Sampler} from './sampler';
import {Endpoint} from './endpoint';
import {
  BinaryAnnotation,
  ClientAddr,
  IAnnotation,
  InetAddress,
  LocalAddr,
  LocalOperationStart,
  LocalOperationStop,
  Message,
  Rpc,
  ServerAddr,
  ServiceName
} from './annotation';
import {Record} from './record';

export class Tracer {
  _ctxImpl: Context<TraceId>;
  _sentinelTraceId: TraceId;
  _startTimestamp;
  _startTick;

  constructor(ctxImpl: Context<TraceId>,
              readonly recorder: Recorder,
              localServiceName?: string,
              readonly sampler: Sampler = new Sampler(alwaysSample),
              readonly traceId128Bit: boolean = false,
              readonly supportsJoin: boolean = true,
              localEndpoint?: Endpoint,
              readonly log: Console = console,
              defaultTags?: {}
  ) {
    if (localEndpoint) {
      this._localEndpoint = localEndpoint;
    } else {
      this._localEndpoint = new Endpoint(localServiceName || 'unknown');
    }
    this._ctxImpl = ctxImpl;
    // The sentinel is used until there's a trace ID in scope.
    // Technically, this ID should have been unsampled, but it can break code to change that now.
    this._sentinelTraceId = this.createRootId();
    this._startTimestamp = now();
    this._startTick = hrtime();
    this.recorder.setDefaultTags(defaultTags);
  }

  _localEndpoint: Endpoint;

  get localEndpoint() {
    return this._localEndpoint;
  }

  get context() {
    return this._ctxImpl;
  }

  get id(): TraceId {
    return this._ctxImpl.getContext() || this._sentinelTraceId;
  }

  setId(traceId: TraceId): void {
    this._ctxImpl.setContext(traceId);
  }

  letId<V>(traceId: TraceId, callback: () => V): V {
    return this._ctxImpl.letContext(traceId, callback);
  }

  scoped<V>(callback: () => V): V {
    return this._ctxImpl.scoped(callback);
  }

  createRootId(isSampled: IOption<boolean> = None, isDebug: boolean = false): TraceId {
    const rootSpanId = randomTraceId();
    const traceId = this.traceId128Bit
      ? randomTraceId() + rootSpanId
      : rootSpanId;
    const id = new TraceId(rootSpanId, traceId, None, isSampled, isDebug ? 1 : 0);
    if (isSampled === None) {
      id._sampled = this.sampler.shouldSample(id);
    }
    return id;
  }

  createChildId(parentId?: TraceId): TraceId {
    if (isUndefinedOrNull(parentId)) {
      parentId = this._ctxImpl.getContext();
    }

    if (parentId === this._sentinelTraceId || isUndefinedOrNull(parentId)) {
      return this.createRootId();
    }

    const childId = new TraceId(
      randomTraceId(),
      parentId.traceId,
      new Some(parentId.spanId),
      parentId.sampled,
      parentId.isDebug() ? 1 : 0);
    if (childId.sampled.present === false) {
      childId._sampled = this.sampler.shouldSample(childId);
    }
    return childId;
  }


  local<V>(operationName: string, callable: () => V): V {
    if (typeof callable !== 'function') {
      throw new Error('you must pass a function');
    }
    return this.scoped(() => {
      const traceId = this.createChildId();
      this.setId(traceId);
      this.recordServiceName(this._localEndpoint.serviceName);
      this.recordAnnotation(new LocalOperationStart(operationName));

      let result;
      try {
        result = callable();
      } catch (err) {
        this.recordBinary('error', err.message ? err.message : err.toString());
        this.recordAnnotation(new LocalOperationStop());
        throw err;
      }

      // Finish the span on a synchronous success
      if (!isPromise(result)) {
        this.recordAnnotation(new LocalOperationStop());
        return result;
      }

      if (!traceId.sampled.getOrElse(false)) {
        return result; // no need to stop as it was never started
      }

      // At this point we know we are sampled. Explicitly record against the ID

      // Ensure the span representing the promise completes
      return result
        .then((output) => {
          this._explicitRecord(traceId, new LocalOperationStop());
          return output;
        })
        .catch((err) => {
          const message = err.message ? err.message : err.toString();
          this._explicitRecord(traceId, new BinaryAnnotation('error', message));
          this._explicitRecord(traceId, new LocalOperationStop());
          throw err;
        });
    });
  }

  recordAnnotation(annotation: IAnnotation, timestamp?: number): void {
    if (this.id.sampled.getOrElse(false)) {
      this._explicitRecord(this.id, annotation, timestamp);
    }
  }

  recordMessage(message: string): void {
    this.recordAnnotation(
      new Message(message)
    );
  }

  recordServiceName(serviceName: string): void {
    this.recordAnnotation(
      new ServiceName(serviceName)
    );
  }

  recordRpc(name: string): void {
    this.recordAnnotation(
      new Rpc(name)
    );
  }

  recordClientAddr(args: { host: InetAddress, port?: number }): void {
    this.recordAnnotation(
      new ClientAddr(args)
    );
  }

  recordServerAddr(args: { serviceName: string, host?: InetAddress, port?: number }): void {
    this.recordAnnotation(
      new ServerAddr(args)
    );
  }

  recordLocalAddr(args: { host?: InetAddress, port?: number }): void {
    this.recordAnnotation(
      new LocalAddr(args)
    );
  }

  recordBinary(key: string, value: boolean | string | number): void {
    this.recordAnnotation(
      new BinaryAnnotation(key, value)
    );
  }

  writeIdToConsole(message: any): void {
    this.log.info(`${message}: ${this.id.toString()}`);
  }

  // this allows you to avoid use of implicit trace ID and defer implicit timestamp derivation
  _explicitRecord(traceId, annotation, timestamp = now(this._startTimestamp, this._startTick)) {
    this.recorder.record(new Record({traceId, timestamp, annotation}));
  }

  setTags(tags = {}) {
    // eslint-disable-next-line no-restricted-syntax
    for (const tag in tags) {
      if (Object.prototype.hasOwnProperty.call(tags, tag)) {
        this.recordBinary(tag, tags[tag]);
      }
    }
  }

  join(traceId) {
    if (isUndefinedOrNull(traceId)) {
      throw new Error('traceId is a required arg');
    }

    // duck type check until we sort out a better way. We don't want to break
    // transpiled usage ex. `traceId instanceof TraceId_1: false` See #422
    if (isUndefinedOrNull(traceId._spanId)) {
      throw new Error('Must be valid TraceId instance');
    }

    if (!this.supportsJoin) {
      return this.createChildId(traceId);
    }

    if (traceId.sampled === None) {
      /* eslint-disable no-param-reassign */
      traceId._sampled = this.sampler.shouldSample(traceId);
    } else {
      /* eslint-disable no-param-reassign */
      traceId._shared = true;
    }
    return traceId;
  }
}
