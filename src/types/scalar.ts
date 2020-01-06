import moment from 'moment';

import { Type } from './base';

export class ScalarType<I, S> extends Type<I, S> {
  name: string;
  persistent: true;
  primitive: false;
  compound: false;
  serialize: (instance: I) => S;
  deserialize: (snapshot: S, instance: I | undefined, context: any) => I;
  constructor(
    name: string,
    serialize: (instance: I) => S,
    deserialize: (snapshot: S, instance: I | undefined, context: any) => I
  ) {
    super();
    this.name = name;
    this.serialize = serialize;
    this.deserialize = deserialize;
  }
}

export const DateType = new ScalarType<moment.Moment | undefined, string | undefined>(
  'Date',
  inst => (inst === undefined ? undefined : inst.format('YYYY-MM-DD')),
  snap => (snap === undefined ? undefined : moment(snap, moment.ISO_8601))
);

export const DateTimeType = new ScalarType<moment.Moment | undefined, string | undefined>(
  'DateTime',
  inst => (inst === undefined ? undefined : inst.toISOString()),
  snap => (snap === undefined ? undefined : moment(snap, moment.ISO_8601))
);
