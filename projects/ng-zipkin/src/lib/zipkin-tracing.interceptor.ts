import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from "@angular/common/http";
import {Observable, throwError} from "rxjs";
import {HttpClient, Tracer} from "./zipkin";
import {catchError, tap} from "rxjs/operators";
import {Inject, Injectable} from "@angular/core";
import {LOCAL_TRACER_NAME, TRACE_MODULE_CONFIGURATION} from "./zipkin-providers";
import {ZipkinModuleConfig} from "./zipkin-module-config";

@Injectable({
  providedIn: 'root'
})
export class ZipkinTracingInterceptor implements HttpInterceptor {
  private readonly remoteServiceMappings: { [remoteServiceName: string]: string | RegExp };

  constructor(
    @Inject(TRACE_MODULE_CONFIGURATION) config: ZipkinModuleConfig,
    @Inject(LOCAL_TRACER_NAME) private readonly tracer: Tracer
  ) {
    this.remoteServiceMappings = config.remoteServiceMapping;
    if (config.debug) console.log(config);
  }

  private static resolveUrl(url: string): URL {
    // defaults to localhost and angular port
    const normalizedUrl = !url.startsWith('http') ? `http://localhost:4200${url}` : url;
    // TODO: Maybe DNS Resolve [browser.dns.resolve]?? we need ipv6 or ipv4 address, Zipkin wont accept hostname
    return new URL(normalizedUrl);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const url = ZipkinTracingInterceptor.resolveUrl(req.url);
    const remoteService = this.getRemoteServiceName(url);
    if (!remoteService) {
      return next.handle(req);
    }
    const httpClient = new HttpClient(this.tracer, this.tracer.localEndpoint.serviceName, remoteService, url.hostname, Number(url.port));
    return httpClient.tracer.scoped(() => {
      const request = {
        url: req.url,
        headers: {}
      };
      const zipkinReq = httpClient.recordRequest(request, req.url, req.method);
      const zipkinHeaders = zipkinReq.headers as any;

      req = req.clone({
        setHeaders: zipkinHeaders
      });

      const traceId = httpClient.tracer.id;
      return next.handle(req).pipe(
        tap((event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
            httpClient.tracer.scoped(() => {
              httpClient.recordResponse(traceId, event.status.toString());
            })
          }
        }),
        catchError((err: any) => {
          httpClient.tracer.scoped(() => {
            httpClient.recordError(traceId, err);
          })
          return throwError(err);
        })
      );
    });
  }

  private getRemoteServiceName(url: URL): string | undefined {
    if (!url.hostname) return undefined;
    return Object.keys(this.remoteServiceMappings).find(remoteService => {
      const domain = this.remoteServiceMappings[remoteService];
      return ((domain !== undefined && typeof domain === 'string' && domain === url.hostname) ||
        (domain instanceof RegExp && url.hostname && domain.test(url.hostname))) as boolean;
    });
  }
}
