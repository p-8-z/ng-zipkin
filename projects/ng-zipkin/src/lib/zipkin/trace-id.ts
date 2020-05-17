import {IOption, isOptional, None, Some, verifyIsNotOptional, verifyIsOptional} from './option';

export class TraceId {
  _debug: boolean;
  _shared: boolean;

  constructor(spanId: string, traceId: IOption<string> | string = spanId, parentId: IOption<string> = None,
              sampled: IOption<boolean> = None, flags: number = 0, debug: boolean = flags === 1, shared: boolean = false
  ) {
    verifyIsNotOptional(spanId);
    verifyIsOptional(parentId);
    verifyIsOptional(sampled);

    // support old signatures which allowed traceId to be optional
    if (isOptional(traceId)) {
      const OTraceId = traceId as IOption<string>;
      this._traceId = OTraceId.getOrElse(spanId);
    } else if (typeof traceId === 'undefined' || traceId === null) {
      this._traceId = spanId;
    } else {
      this._traceId = traceId as string;
    }

    this._parentId = parentId;
    this._spanId = spanId;
    this._sampled = debug ? new Some(true) : sampled;
    this._debug = debug;
    this._shared = shared;
  }

  _traceId: string;

  get traceId() {
    return this._traceId;
  }

  _parentId: IOption<string>;

  get parentId() {
    return this._parentId.getOrElse(this._spanId);
  }

  _spanId: string;

  get spanId() {
    return this._spanId;
  }

  _sampled: IOption<boolean>;

  get sampled() {
    return this._sampled;
  }

  get parentSpanId() {
    return this._parentId;
  }

  get flags() {
    return this._debug ? 1 : 0;
  }

  isDebug(): boolean {
    return this._debug;
  }

  isShared(): boolean {
    return this._shared;
  }

  toString(): string {
    return `TraceId(spanId=${this.spanId.toString()}`
      + `, parentSpanId=${this.parentSpanId.toString()}`
      + `, traceId=${this.traceId.toString()})`;
  }
}
