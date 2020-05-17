import {parseRequestUrl} from './utils';
import {Tracer} from './tracer';
import {TraceId} from './trace-id';
import {ClientRecv, ClientSend, InetAddress, Request, ServerAddr} from './annotation';

export class HttpClient {
  constructor(
    private _tracer: Tracer,
    private serviceName: string = _tracer.localEndpoint.serviceName,
    private remoteServiceName?: string,
    private remoteServiceIpv4?: string,
    private remoteServicePort?: number
  ) {
  }

  get tracer() {
    return this._tracer;
  }

  recordRequest<T>(request: T, url: string, method: string): T {
    this._tracer.setId(this._tracer.createChildId());
    const traceId = this._tracer.id;
    const {path} = parseRequestUrl(url);

    this._tracer.recordServiceName(this.serviceName);
    this._tracer.recordRpc(method.toUpperCase());
    this._tracer.recordBinary('http.path', path);

    this._tracer.recordAnnotation(new ClientSend());
    if (this.remoteServiceName) {
      this._tracer.recordAnnotation(new ServerAddr({
        serviceName: this.remoteServiceName,
        host: new InetAddress(this.remoteServiceIpv4),
        port: this.remoteServicePort
      }));
    }
    return Request.addZipkinHeaders(request, traceId);
  }

  recordResponse(traceId: TraceId, statusCode: string): void {
    this._tracer.setId(traceId);
    this._tracer.recordBinary('http.status_code', statusCode.toString());
    const code = Number(statusCode);
    if (code < 200 || code > 399) {
      this._tracer.recordBinary('error', statusCode.toString());
    }
    this._tracer.recordAnnotation(new ClientRecv());
  }

  recordError(traceId: TraceId, error: Error): void {
    this._tracer.setId(traceId);
    this._tracer.recordBinary('error', error.toString());
    this._tracer.recordAnnotation(new ClientRecv());
  }
}

