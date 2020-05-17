import {InjectionToken} from "@angular/core";

export const TRACE_MODULE_CONFIGURATION = new InjectionToken<string>('TRACE_MODULE_CONFIGURATION');

export const LOCAL_TRACER_NAME = new InjectionToken<string>('LOCAL_TRACER_NAME');

export const TRACE_RECORDER_NAME = new InjectionToken<string>('TRACE_RECORDER_NAME');
