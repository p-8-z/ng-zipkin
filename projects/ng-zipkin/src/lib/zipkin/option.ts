export abstract class Option<T> {
  abstract map<V>(fn: (value: T) => V): IOption<V>;

  abstract ifPresent(fn: (value: T) => any): void;

  abstract flatMap<V>(fn: (value: T) => IOption<V>): IOption<V>;

  abstract getOrElse(fnOrValue: (() => T) | T): T;

  abstract equals(other: IOption<T>): boolean;

  abstract toString(): string;
}

export class Some<T> extends Option<T> {
  readonly type: 'Some';
  readonly present: true;
  readonly value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }

  map(f) {
    return new Some(f(this.value));
  }

  ifPresent(f) {
    f(this.value);
  }

  flatMap(f) {
    return f(this.value);
  }

  getOrElse() {
    return this.value;
  }

  equals(other) {
    return other instanceof Some && other.value === this.value;
  }

  toString() {
    return `Some(${this.value})`;
  }
}

export interface INone<T> extends Option<T> {
  readonly type: 'None';
  readonly present: false;
}

export type IOption<T> = Some<T> | INone<T>;

export const None: INone<never> = new class implements INone<never> {
  readonly present: false;
  readonly type: 'None';

  equals(other: IOption<never>): boolean {
    return other === this;
  }

  flatMap<V>(fn: (value: never) => IOption<V>): IOption<V> {
    return this;
  }

  getOrElse(fnOrValue: () => never): never {
    return fnOrValue instanceof Function ? fnOrValue() : fnOrValue;
  }

  ifPresent(fn: (value: never) => any): void {
  }

  map<V>(fn: (value: never) => V): IOption<V> {
    return this;
  }

  toString(): string {
    return 'None';
  }
};

export const isOptional = (data: any): boolean => {
  return data instanceof Some || None.equals(data);
};

export const verifyIsOptional = (data: any): void => {
  if (data == null) {
    throw new Error('Error: data is not Optional - it\'s null');
  }
  if (isOptional(data)) {
    if (isOptional(data.value)) {
      throw new Error(`Error: data (${data.value}) is wrapped in Option twice`);
    }
  } else {
    throw new Error(`Error: data (${data}) is not an Option!`);
  }
};

export const verifyIsNotOptional = (data) => {
  if (isOptional(data)) {
    throw new Error(`Error: data (${data}) is an Option!`);
  }
};

export const fromNullable = <V>(nullable: V): IOption<V> => {
  return nullable == null ? None : new Some(nullable);
};
