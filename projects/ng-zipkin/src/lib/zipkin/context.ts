import {TraceId} from './trace-id';

export class ExplicitContext implements Context<TraceId> {
  private currentCtx: TraceId | null;

  constructor() {
    this.currentCtx = null;
  }

  setContext(ctx: TraceId): void {
    this.currentCtx = ctx;
  }

  getContext(): TraceId {
    return this.currentCtx;
  }

  scoped<V>(callback: () => V): V {
    const prevCtx = this.getContext();
    try {
      return callback();
    } finally {
      this.setContext(prevCtx);
    }
  }

  letContext<V>(ctx: TraceId, callback: () => V): V {
    return this.scoped(() => {
      this.setContext(ctx);
      return callback();
    });
  }
}

export interface Context<T> {
  setContext(ctx: T): void;

  getContext(): T;

  scoped<V>(callback: () => V): V;

  letContext<V>(ctx: T, callback: () => V): V;
}
