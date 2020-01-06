import { Type } from './base';

export class PrimitiveType<I extends string | number | boolean> extends Type<I, I> {
  name: string;
  persistent = true;
  primitive = true;
  compound = false;
  constructor(name: string) {
    super();
    this.name = name;
  }
  serialize(instance: I): I {
    return instance;
  }
  deserialize(snapshot: I, instance: I | undefined, context: any): I {
    return snapshot;
  }
}

export const StringType = new PrimitiveType<string>('StringType');

export const NumberType = new PrimitiveType<number>('NumberType');

export const BooleanType = new PrimitiveType<boolean>('BooleanType');
