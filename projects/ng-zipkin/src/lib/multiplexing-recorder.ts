import {Record, Recorder} from "./zipkin";

/**
 * Allows the use of multiple Recorder's.
 */
export class MultiplexingRecorder implements Recorder {
  constructor(private recorders: Recorder[]) {
  }

  record(rec: Record): void {
    this.recorders.forEach(r => r.record(rec));
  }

  setDefaultTags(tags): void {
  }

  getDefaultTags() {
  }

  toString() {
    return 'MultiplexingRecorder()';
  }
}
