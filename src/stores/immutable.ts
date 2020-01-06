import { ModelType } from '../types';
import { Store, StoreItem, MutabilityType } from './base';

export class ImmutableStoreItem extends StoreItem {}

export class ImmutableStore extends Store<ImmutableStoreItem> {}

interface ImmutableStoreOptions<T> {
  type: T;
}

export function immutableStore<T extends ModelType<{}>>(opts: ImmutableStoreOptions<T>) {
  const { type } = opts;
  return new ImmutableStore(type.name, MutabilityType.Immutable);
}
