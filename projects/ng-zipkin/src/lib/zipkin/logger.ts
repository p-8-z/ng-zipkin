import {Endpoint} from './endpoint';
import {TraceId} from './trace-id';
import {BinaryAnnotation} from './annotation';

export interface Logger {
  logSpan(span: Span): void;
}

export class Span {
  traceId: string;
  parentId?: string;
  id: string;
  annotations: Annotation[];
  binaryAnnotations: BinaryAnnotation[];
  tags: { [key: string]: string };
  debug: boolean;
  shared: boolean;
  name?: string;
  kind?: string;
  timestamp?: number;
  duration?: number;
  localEndpoint?: Endpoint;
  remoteEndpoint?: Endpoint;

  constructor(traceId: TraceId) {
    this.traceId = traceId.traceId;
    this.parentId = traceId.parentSpanId.getOrElse(this.parentId);
    this.id = traceId.spanId;
    this.name = undefined;
    this.kind = undefined;
    this.timestamp = undefined;
    this.duration = undefined;
    this.localEndpoint = undefined;
    this.remoteEndpoint = undefined;
    this.annotations = [];
    this.binaryAnnotations = [];
    this.tags = {};
    this.debug = traceId.isDebug();
    this.shared = traceId.isShared();
  }

  setName(name: string): void {
    this.name = name ? name.toLocaleLowerCase() : undefined;
  }

  setKind(kind: string): void {
    this.kind = kind;
  }

  setTimestamp(timestamp: number): void {
    this.timestamp = timestamp;
  }

  setDuration(duration: number): void {
    if (typeof duration !== 'undefined') {
      this.duration = Math.max(duration, 1);
    }
  }

  setLocalEndpoint(endpoint: Endpoint): void {
    if (endpoint && !endpoint.isEmpty()) {
      this.localEndpoint = endpoint;
    } else {
      this.localEndpoint = undefined;
    }
  }

  setRemoteEndpoint(endpoint: Endpoint): void {
    if (endpoint && !endpoint.isEmpty()) {
      this.remoteEndpoint = endpoint;
    } else {
      this.remoteEndpoint = undefined;
    }
  }

  addAnnotation(timestamp: number, value: string): void {
    this.annotations.push(new Annotation(timestamp, value));
  }

  putTag(key: string, value: string): void {
    this.tags[key] = value.toString();
  }

  setDebug(debug: boolean): void {
    this.debug = debug;
  }

  setShared(shared: boolean): void {
    this.shared = shared;
  }

  toString() {
    const annotations = this.annotations.map(a => a.toString()).join(', ');
    return `Span(id=${this.traceId}, annotations=[${annotations}])`;
  }
}

export class Annotation {
  timestamp: any;
  value: string;

  constructor(timestamp, value) {
    this.timestamp = timestamp;
    this.value = value.toString();
  }
}

