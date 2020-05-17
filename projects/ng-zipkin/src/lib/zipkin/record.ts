import {TraceId} from './trace-id';
import {IAnnotation} from './annotation';

export class Record {
  traceId: TraceId;
  timestamp: number;
  annotation: IAnnotation;

  constructor({traceId, timestamp, annotation}) {
    this.traceId = traceId;
    this.timestamp = timestamp;
    this.annotation = annotation;
  }

  toString() {
    return `Record(traceId=${this.traceId.toString()}, annotation=${this.annotation.toString()})`;
  }
}
