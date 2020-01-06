import { ModelType } from '../types';
import { Store, StoreItem, MutabilityType } from './base';

export class CreatableStoreItem extends StoreItem {}

export class CreatableStore extends Store<CreatableStoreItem> {}

interface CreatableStoreOptions<T> {
  type: T;
}

export function creatableStore<T extends ModelType<{}>>(opts: CreatableStoreOptions<T>) {
  const { type } = opts;
  return new CreatableStore(type.name, MutabilityType.Creatable);
}
