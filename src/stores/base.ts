import { observable, ObservableMap } from 'mobx';

import { Client, NetworkState } from './network';

export enum MutabilityType {
  Immutable = 'Immutable',
  Creatable = 'Creatable',
  Mutable = 'Mutable'
}

export abstract class StoreItem {
  id: string;
  network: NetworkState = new NetworkState();
}

export abstract class Store<I extends StoreItem = StoreItem> {
  protected domain: Domain;
  public readonly name: string;
  public readonly mutability: MutabilityType;
  protected readonly _items: ObservableMap<string, I>;
  @observable counts = { loading: 0, creating: 0, committing: 0 }; // TODO: Remove
  constructor(name: string, mutability: MutabilityType) {
    this.name = name;
    this.mutability = mutability;
    this._items = observable.map([], { deep: false });
  }
  setDomain(domain: Domain) {
    // TODO: Move to constructor.
    this.domain = domain;
  }
  get(id: string) {
    return this._items.get(id);
  }
  has(id: string) {
    return this._items.has(id);
  }
  get size() {
    return this._items.size;
  }
  get values() {
    return this._items.values();
  }
}

export class Domain {
  client: Client;
  stores: Map<string, Store<StoreItem>>;
  constructor(client: Client, stores: { [key: string]: Store<any> }) {
    this.client = client;
    this.stores = new Map(Object.entries(stores));
    this.stores.forEach(store => {
      store.setDomain(this);
    });
  }
}
