import {JsonEncoder, TraceId} from "./zipkin";

export interface HttpConfigOptions {
  /**
   * The base URL of the Zipkin server. This will override [ZipkinConfig.zipkinBaseUrl]. Default: http://localhost:9411
   */
  zipkinBaseUrl?: string;
  /**
   * Encoding method. One of two {JSON_V1, JSON_V2}. Default JSON_V2.
   * Encoding defines spanUrl:
   * JSON_V1 -> /api/v2/spans
   * JSON_V2 -> /api/v1/spans
   */
  jsonEncoder?: JsonEncoder;
  /**
   * The Span Service Url. Overrides default encoding Span URL [HttpConfigOptions.jsonEncoder]
   * Default: /api/v2/spans
   */
  spanUrl?: string;
  /**
   * Extra headers that ships with spans
   */
  headers?: { [name: string]: string; };
  /**
   * Interval that Batch is shipped in millisecond. Default 1000ms.
   */
  batchInterval?: number;
  /**
   * Http timeout. Default 0 (unlimited).
   */
  timeout?: number;
  /**
   * Http Max Payload Size. Default 0 (unlimited).
   */
  maxPayloadSize?: number;
}

export interface ZipkinConfig {
  /**
   * The name of the local service. Defaults to 'browser' if not specified'
   */
  localServiceName?: string;
  /**
   * The mappings to use when tracing HTTP
   */
  remoteServiceMapping?: { [remoteServiceName: string]: string | RegExp; };
  /**
   * Log spans and http traffic to console
   */
  debug?: boolean;
  /**
   * The strategy to use. By default, AlwaysSample is used.
   */
  sample?: (traceId: TraceId) => boolean;
  /**
   * The default tags to add to every tracer.
   */
  defaultTags?: { [name: string]: string; };
  /**
   * String - The base URL of the Zipkin server.
   * Default: http://localhost:9411
   *
   * HttpConfigOptions - more detail declaration of Zipkin Http Client
   */
  zipkinBaseUrl?: string;
  /**
   * HttpConfigOptions - The base URL of the Zipkin server.
   * More granular control of Zipkin collector
   */
  zipkinConfig?: HttpConfigOptions;
}
