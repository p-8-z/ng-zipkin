import {ZipkinConfig} from "./zipkin-config";
import {alwaysSample, JSON_V2, JsonEncoder} from "./zipkin";
import * as defaults from "./module-constants";

/**
 * Helping class that holds Zipkin Module config state
 */
export class ZipkinModuleConfig {
  public readonly encoding: JsonEncoder;
  public readonly zipkinUrl: URL
  public readonly localServiceName: string;
  public readonly debug: boolean;
  public readonly sample: (TraceId) => boolean;
  public readonly defaultTags: { [name: string]: string; };
  public readonly headers: { [name: string]: string; };
  public readonly batchInterval: number;
  public readonly timeout: number;
  public readonly maxPayloadSize: number;
  public readonly remoteServiceMapping: { [remoteServiceName: string]: string | RegExp };
  public readonly recordTimeOut: number;

  constructor({localServiceName, remoteServiceMapping, debug, sample, defaultTags, zipkinBaseUrl, zipkinConfig}: ZipkinConfig) {
    this.debug = !!debug;
    this.encoding = !!zipkinConfig?.jsonEncoder ? zipkinConfig.jsonEncoder : JSON_V2;
    this.localServiceName = !!localServiceName ? localServiceName : defaults.DEFAULT_LOCAL_SERVICE_NAME;
    this.sample = !!sample ? sample : alwaysSample;
    this.defaultTags = !!defaultTags ? defaultTags : {};
    this.headers = !!zipkinConfig?.headers ? zipkinConfig.headers : defaults.DEFAULT_ZIPKIN_HEADERS;
    this.batchInterval = !!zipkinConfig?.batchInterval ? zipkinConfig.batchInterval : 1000;
    this.timeout = !!zipkinConfig?.timeout ? zipkinConfig.timeout : 0;
    this.maxPayloadSize = !!zipkinConfig?.maxPayloadSize ? zipkinConfig.maxPayloadSize : 0;
    this.remoteServiceMapping = !!remoteServiceMapping ? remoteServiceMapping : defaults.DEFAULT_REMOTE_SERVICE_MAPPINGS;
    this.recordTimeOut = defaults.DEFAULT_RECORD_TIMEOUT;
    this.zipkinUrl = this.resolveUrl(zipkinBaseUrl, zipkinConfig?.zipkinBaseUrl, zipkinConfig?.spanUrl);
  }

  private resolveUrl(zipkinBaseUrlGlobbal: string, zipkinBaseUrl: string, spanUrl: string): URL {
    let _url = !!zipkinBaseUrlGlobbal ? zipkinBaseUrlGlobbal : defaults.DEFAULT_ZIPKIN_BASE_URL;
    _url = !!zipkinBaseUrl ? zipkinBaseUrl : _url;
    let _endpoint = this.encoding === JSON_V2 ? defaults.DEFAULT_ZIPKIN_SPAN_V2_URL : defaults.DEFAULT_ZIPKIN_SPAN_V1_URL;
    _endpoint = !!spanUrl ? spanUrl : _endpoint;
    return new URL(_url + _endpoint);
  }
}
