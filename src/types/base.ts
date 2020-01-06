export abstract class Type<I, S> {
  name: string;
  persistent: boolean;
  primitive: boolean;
  compound: boolean;
  abstract serialize(instance: I): S;
  abstract deserialize(snapshot: S, instance: I | undefined, context: any): I;
  d(this: Type<I, S>, getter?: getter<I, {}>): Property<Type<I, S>> {
    return property(this, getter);
  }
}

export type Snapshot<T> = T extends Property<any>
  ? ReturnType<T['type']['serialize']>
  : T extends Type<any, any>
  ? ReturnType<T['serialize']>
  : never;

export type Instance<T> = T extends Property<any>
  ? ReturnType<T['type']['deserialize']>
  : T extends Type<any, any>
  ? ReturnType<T['deserialize']>
  : never;

export type getter<T, M> = (this: M, key: string) => T;

export type setter<T, M> = (this: M, key: string, value: T) => void;

export class Property<T extends Type<any, any>, M = {}> {
  type: T;
  persistent: boolean;
  mutable: boolean;
  getter: getter<Instance<T>, M> | undefined;
  constructor(type: T, getter?: getter<Instance<T>, M>) {
    this.type = type;
    this.getter = getter;
  }
}

export type Properties<M = {}> = {
  [key: string]: Property<Type<any, any>, M>;
};

export function property<T extends Type<any, any>, M>(type: T, getter?: getter<Instance<T>, M>) {
  return new Property(type, getter);
}
