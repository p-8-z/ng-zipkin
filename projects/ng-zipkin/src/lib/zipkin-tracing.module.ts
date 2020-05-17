import {ModuleWithProviders, NgModule, NgZone} from "@angular/core";
import {ZipkinConfig} from "./zipkin-config";
import {LOCAL_TRACER_NAME, TRACE_MODULE_CONFIGURATION, TRACE_RECORDER_NAME} from "./zipkin-providers";
import {HTTP_INTERCEPTORS} from "@angular/common/http";
import {ZipkinTracingInterceptor} from "./zipkin-tracing.interceptor";
import {BatchRecorder, ConsoleRecorder, ExplicitContext, Recorder, Tracer} from "./zipkin";
import {MultiplexingRecorder} from "./multiplexing-recorder";
import {HttpLogger} from "./zipkin-transport-http";
import {ZipkinModuleConfig} from "./zipkin-module-config";

export function getTracer(options: ZipkinModuleConfig, recorder: Recorder): Tracer {
  return new Tracer(new ExplicitContext(), recorder, options.localServiceName);
}

export function getRecorder(options: ZipkinModuleConfig, zone: NgZone): Recorder {
  let recorder: Recorder;
  const {zipkinUrl, encoding, debug, headers, batchInterval, timeout, maxPayloadSize, recordTimeOut, defaultTags} = options;
  zone.runOutsideAngular(() => {
    const httpLogger = new HttpLogger(zipkinUrl.href, encoding, debug, headers, batchInterval, timeout, maxPayloadSize);
    recorder = new BatchRecorder(httpLogger, recordTimeOut, defaultTags);
    if (options.debug) {
      recorder = new MultiplexingRecorder([new ConsoleRecorder(), recorder]);
    }
  });
  return recorder;
}

export const TRACE_PROVIDERS = [
  {
    provide: TRACE_RECORDER_NAME,
    useFactory: getRecorder,
    deps: [TRACE_MODULE_CONFIGURATION, NgZone]
  },
  {
    provide: LOCAL_TRACER_NAME,
    useFactory: getTracer,
    deps: [TRACE_MODULE_CONFIGURATION, TRACE_RECORDER_NAME]
  },
  {
    multi: true,
    provide: HTTP_INTERCEPTORS,
    useExisting: ZipkinTracingInterceptor,
    deps: [TRACE_MODULE_CONFIGURATION, LOCAL_TRACER_NAME]
  }
];


/**
 * Module for distributed tracing with Angular.
 */
@NgModule({})
export class ZipkinModule {
  static forRoot(options: ZipkinConfig = {}): ModuleWithProviders {
    return {
      ngModule: ZipkinModule,
      providers: [
        {
          provide: TRACE_MODULE_CONFIGURATION,
          useValue: new ZipkinModuleConfig(options)
        },
        ...TRACE_PROVIDERS
      ]
    };
  }
}
