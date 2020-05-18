# Zipkin Tracing

Zero dependency Zipkin Tracing Module. Works out of the box, just install 
and import module to Angular application.

Based on packages:
- `zipkin` -> Git: [Zipkin JS](https://github.com/openzipkin/zipkin-js)

## Usage

Import `ZipkinTracingModule` into your Module. E.g:
```ts
[
    ...,
    ZipkinTracingModule.forRoot(),
    ...
]
```

Your app should already have RouterModule and HttpClientModule.

With this configuration you're all set. 
By default, it tries to reach Zipkin on address: `http://localhost:9411` with service name : `browser`.

If you need change configuration of tracer, just use `ZipkinConfig` argument of forRoot method . E.g:
```ts
ZipkinTracingModule.forRoot({logToConsole: true, localServiceName: 'angular'})
```
Options of `ZipkinProvider` E.g:
```ts
interface ZipkinConfig {
  localServiceName?: string;
  remoteServiceMapping?: { [remoteServiceName: string]: string | RegExp; };
  debug?: boolean;
  sample?: (traceId: TraceId) => boolean;
  defaultTags?: { [name: string]: string; };
  zipkinBaseUrl?: string;
  zipkinConfig?: HttpConfigOptions;
}
```
