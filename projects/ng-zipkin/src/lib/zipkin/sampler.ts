import {IOption, Some} from './option';
import {TraceId} from './trace-id';

export class Sampler {
  readonly evaluator: (traceId: TraceId) => boolean;

  constructor(evaluator: (traceId: TraceId) => boolean) {
    this.evaluator = evaluator;
  }

  shouldSample(traceId: TraceId): IOption<boolean> {
    const result = traceId.sampled.getOrElse(() => this.evaluator(traceId));
    return new Some(result);
  }

  toString() {
    return `Sampler(${this.evaluator.toString()})`;
  }
}

export const neverSample = (traceId: TraceId): boolean => {
  return false;
};
export const alwaysSample = (traceId: TraceId): boolean => {
  return true;
};
