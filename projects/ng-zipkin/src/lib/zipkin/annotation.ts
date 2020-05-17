import {Endpoint} from './endpoint';
import {Span} from './logger';
import {TraceId} from './trace-id';
import {DTO_V2_Span, KindEnum} from './dto-v2';
import {DTO_V1_BinaryAnnotation, DTO_V1_Span} from './dto-v1';

export interface IAnnotation {
  readonly annotationType: string;
  serviceName?: string;
  host?: InetAddress;
  port?: number;
  name?: string;
  message?: string;
  key?: string;
  value?: boolean | string | number;
}

export class SimpleAnnotation implements IAnnotation {
  readonly annotationType: string;

  toString() {
    return `${this.annotationType}()`;
  }
}

export class ClientSend extends SimpleAnnotation {
  annotationType = 'ClientSend';
}

export class ClientRecv extends SimpleAnnotation {
  annotationType = 'ClientRecv';
}

export class ServerSend extends SimpleAnnotation {
  annotationType = 'ServerSend';
}

export class ServerRecv extends SimpleAnnotation {
  annotationType = 'ServerRecv';
}

export class ProducerStart extends SimpleAnnotation {
  annotationType = 'ProducerStart';
}

export class ProducerStop extends SimpleAnnotation {
  annotationType = 'ProducerStop';
}

export class ConsumerStart extends SimpleAnnotation {
  annotationType = 'ConsumerStart';
}

export class ConsumerStop extends SimpleAnnotation {
  annotationType = 'ConsumerStop';
}

export class MessageAddr extends SimpleAnnotation {
  annotationType = 'MessageAddr';
  serviceName: string;
  host: InetAddress;
  port: number;

  constructor(args: { serviceName: string, host?: InetAddress, port?: number }) {
    super();
    const {serviceName, host, port} = args;
    this.serviceName = serviceName;
    this.host = host;
    this.port = port;
  }

  toString() {
    return `${this.annotationType}(serviceName="${this.serviceName}", host="${this.host}", port=${this.port})`;
  }
}

export class LocalOperationStart extends SimpleAnnotation {
  annotationType = 'LocalOperationStart';
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  toString() {
    return `${this.annotationType}("${this.name}")`;
  }
}

export class LocalOperationStop extends SimpleAnnotation {
  annotationType = 'LocalOperationStop';
}

export class Message extends SimpleAnnotation {
  annotationType = 'Message';
  message: string;

  constructor(message: string) {
    super();
    this.message = message;
  }

  toString() {
    return `${this.annotationType}("${this.message}")`;
  }
}

export class ServiceName extends SimpleAnnotation {
  annotationType = 'ServiceName';
  serviceName: string;

  constructor(serviceName: string) {
    super();
    this.serviceName = serviceName;
  }

  toString() {
    return `${this.annotationType}("${this.serviceName}")`;
  }
}

export class Rpc extends SimpleAnnotation {
  annotationType = 'Rpc';
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  toString() {
    return `${this.annotationType}("${this.name}")`;
  }
}

export class ClientAddr extends SimpleAnnotation {
  annotationType = 'ClientAddr';
  host: InetAddress;
  port: number;

  constructor(args: { host: InetAddress, port?: number }) {
    super();
    const {host, port} = args;
    this.host = host;
    this.port = port;
  }

  toString() {
    return `${this.annotationType}(host="${this.host}", port=${this.port})`;
  }
}

export class ServerAddr extends SimpleAnnotation {
  annotationType = 'ServerAddr';
  serviceName: string;
  host: InetAddress;
  port: number;

  constructor(args: { serviceName: string, host?: InetAddress, port?: number }) {
    super();
    const {serviceName, host, port} = args;
    this.serviceName = serviceName;
    this.host = host || undefined;
    this.port = port || 0;
  }

  toString() {
    return `${this.annotationType}(serviceName="${this.serviceName}", host="${this.host}", port=${this.port})`;
  }
}

export class LocalAddr extends SimpleAnnotation {
  annotationType = 'LocalAddr';
  host: InetAddress;
  port: number;

  constructor(args?: { host?: InetAddress, port?: number }) {
    super();
    const {host, port} = args;
    this.host = host || InetAddress.getLocalAddress();
    this.port = port || 0;
  }

  toString() {
    return `${this.annotationType}(host="${this.host.toString()}", port=${this.port})`;
  }
}

export class BinaryAnnotation extends SimpleAnnotation {
  annotationType = 'BinaryAnnotation';
  key: string;
  value: boolean | string | number;
  endpoint: Endpoint;

  constructor(key: string, value: boolean | string | number, endpoint?: Endpoint) {
    super();
    this.key = key;
    this.value = value;
    this.endpoint = endpoint;
  }

  toString() {
    return `${this.annotationType}(${this.key}="${this.value}")`;
  }
}

export const toV1Endpoint = (endpoint) => {
  if (endpoint === undefined) {
    return undefined;
  }
  const res = {
    serviceName: endpoint.serviceName || '', // undefined is not allowed in v1
  } as Endpoint;
  if (endpoint.ipv4) {
    res.ipv4 = endpoint.ipv4;
  }
  if (endpoint.port) {
    res.port = endpoint.port;
  }
  return res;
};

const toV1Annotation = (ann, endpoint) => {
  return {
    value: ann.value,
    timestamp: ann.timestamp,
    endpoint
  };
};

export const encodeV1 = (span: Span): string => {
  const res: DTO_V1_Span = {
    id: span.id,
    name: span.name || '',
    traceId: span.traceId,
  };
  if (span.parentId) { // instead of writing "parentId": NULL
    res.parentId = span.parentId;
  }

  // Log timestamp and duration if this tracer started and completed this span.
  if (!span.shared) {
    res.timestamp = span.timestamp;
    res.duration = span.duration;
  }

  let beginAnnotation;
  let endAnnotation;
  let addressKey;
  switch (span.kind) {
    case 'CLIENT':
      beginAnnotation = span.timestamp ? 'cs' : undefined;
      endAnnotation = 'cr';
      addressKey = 'sa';
      break;
    case 'SERVER':
      beginAnnotation = span.timestamp ? 'sr' : undefined;
      endAnnotation = 'ss';
      addressKey = 'ca';
      break;
    case 'PRODUCER':
      beginAnnotation = span.timestamp ? 'ms' : undefined;
      endAnnotation = 'ws';
      addressKey = 'ma';
      break;
    case 'CONSUMER':
      if (span.timestamp && span.duration) {
        beginAnnotation = 'wr';
        endAnnotation = 'mr';
      } else if (span.timestamp) {
        beginAnnotation = 'mr';
      }
      addressKey = 'ma';
      break;
    default:
  }

  const jsonEndpoint = toV1Endpoint(span.localEndpoint);

  if (span.annotations.length > 0 || beginAnnotation) { // don't write empty array
    res.annotations = span.annotations.map(ann => toV1Annotation(ann, jsonEndpoint));
  }

  if (beginAnnotation) {
    res.annotations.push({
      value: beginAnnotation,
      timestamp: span.timestamp,
      endpoint: jsonEndpoint
    });
    if (span.duration) {
      res.annotations.push({
        value: endAnnotation,
        timestamp: span.timestamp + span.duration,
        endpoint: jsonEndpoint
      });
    }
  }

  const keys = Object.keys(span.tags);
  if (keys.length > 0 || span.remoteEndpoint) { // don't write empty array
    res.binaryAnnotations = keys.map(key => {
      return {key, value: span.tags[key], endpoint: jsonEndpoint} as DTO_V1_BinaryAnnotation;
    });
  }

  if (span.remoteEndpoint) {
    res.binaryAnnotations.push({
      endpoint: toV1Endpoint(span.remoteEndpoint),
      key: addressKey,
      value: 'true'
    } as DTO_V1_BinaryAnnotation);
  }

  if (span.debug) { // instead of writing "debug": false
    res.debug = true;
  }
  return JSON.stringify(res);
};

export const encodeV2 = (span: Span): string => {
  const copy: DTO_V2_Span = {
    id: span.id,
    traceId: span.traceId,
  };

  if (span.parentId) {
    copy.parentId = span.parentId;
  }
  if (span.name) {
    copy.name = span.name;
  }
  if (span.kind) {
    switch (span.kind) {
      case 'SERVER': {
        copy.kind = KindEnum.SERVER;
        break;
      }
      case 'PRODUCER': {
        copy.kind = KindEnum.PRODUCER;
        break;
      }
      case 'CONSUMER': {
        copy.kind = KindEnum.CONSUMER;
        break;
      }
      case 'CLIENT': {
        copy.kind = KindEnum.CLIENT;
        break;
      }
      default: {
        break;
      }
    }
  }
  if (span.timestamp) {
    copy.timestamp = span.timestamp;
  }
  if (span.duration) {
    copy.duration = span.duration;
  }
  if (span.localEndpoint) {
    copy.localEndpoint = span.localEndpoint;
  }
  if (span.remoteEndpoint) {
    copy.remoteEndpoint = span.remoteEndpoint;
  }
  if (span.annotations.length > 0) {
    copy.annotations = span.annotations;
  }
  if (Object.keys(span.tags).length > 0) {
    copy.tags = span.tags;
  }
  if (span.debug) {
    copy.debug = true;
  }
  if (span.shared) {
    copy.shared = true;
  }
  return JSON.stringify(copy);
};

export class Request {
  static addZipkinHeaders<T>(request: T, traceId: TraceId): RequestZipkinHeaders<T> {
    const headers = appendZipkinHeaders(request, traceId);
    return Object.assign({}, request, {headers}) as RequestZipkinHeaders<T>;
  }
}

export interface JsonEncoder {
  encode(span: Span): string;
}

export const JSON_V1 = {
  encode(span: Span): string {
    return encodeV1(span);
  }
} as JsonEncoder;

export const JSON_V2 = {
  encode(span: Span): string {
    return encodeV2(span);
  }
} as JsonEncoder;

export const jsonEncoder = {
  JSON_V1,
  JSON_V2
};

const appendZipkinHeaders = (req, traceId) => {
  const headers = req.headers || {};
  headers[HttpHeaders.TraceId] = traceId.traceId;
  headers[HttpHeaders.SpanId] = traceId.spanId;

  traceId.parentSpanId.ifPresent((psid) => {
    headers[HttpHeaders.ParentSpanId] = psid;
  });
  traceId.sampled.ifPresent((sampled) => {
    headers[HttpHeaders.Sampled] = sampled ? '1' : '0';
  });

  if (traceId.isDebug()) {
    headers[HttpHeaders.Flags] = '1';
  }

  return headers;
};

export const HttpHeaders = {
  TraceId: 'X-B3-TraceId',
  SpanId: 'X-B3-SpanId',
  ParentSpanId: 'X-B3-ParentSpanId',
  Sampled: 'X-B3-Sampled',
  Flags: 'X-B3-Flags'
};

export type RequestZipkinHeaders<T = any> = T & {
  headers: T & {
    ['X-B3-TraceId']: string;
    ['X-B3-SpanId']: string;
    ['X-B3-ParentSpanId']?: string;
    ['X-B3-Sampled']?: '1' | '0';
    ['X-B3-Flags']?: '1' | '0';
  };
};

export class InetAddress {
  readonly addr: string;

  constructor(addr: string) {
    this.addr = addr;
  }

  static getLocalAddress(): InetAddress {
    return new InetAddress('127.0.0.1');
  }

  ipv4(): string {
    const ipv4Int = this.toInt();
    if (ipv4Int && ipv4Int !== 0) {
      return this.addr;
    }
    return undefined;
  }

  toInt(): number {
    // e.g. 10.57.50.83
    // should become
    // 171520595
    if (!this.addr.includes(".")) return 0;
    const parts = this.addr.split('.');

    // @ts-ignore
    // tslint:disable-next-line:no-bitwise
    return parts[0] << 24 | parts[1] << 16 | parts[2] << 8 | parts[3];
  }

  toString() {
    return `InetAddress(${this.addr})`;
  }
}

// In non-node environments we fallback to 127.0.0.1
function getLocalAddress() {
  return new InetAddress('127.0.0.1');
}

const cachedLocalAddress = getLocalAddress();
InetAddress.getLocalAddress = () => cachedLocalAddress;
