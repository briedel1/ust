import { Client, NetworkState } from './network';
import { StoreItem, Store, Domain, MutabilityType } from './base';
import { ImmutableStore, immutableStore } from './immutable';
import { CreatableStore, creatableStore } from './creatable';
import { MutableStore, MutableStoreItem, mutableStore } from './mutable';

export const stores = {
  domain: (client: Client, stores: { [key: string]: Store<any> }) => {
    return new Domain(client, stores);
  },
  immutable: immutableStore,
  creatable: creatableStore,
  mutable: mutableStore
};

export {
  NetworkState,
  StoreItem,
  Store,
  ImmutableStore,
  CreatableStore,
  MutableStoreItem,
  MutableStore,
  MutabilityType,
  Domain
};
