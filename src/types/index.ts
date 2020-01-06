import { StringType, NumberType, BooleanType } from './primitive';
import { DateType, DateTimeType } from './scalar';
import { modelType } from './model';

export const types = {
  string: StringType,
  number: NumberType,
  boolean: BooleanType,
  date: DateType,
  datetime: DateTimeType,
  model: modelType
};

export * from './base';
export * from './scalar';
export * from './primitive';
export * from './model';
