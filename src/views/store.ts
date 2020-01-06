import { computed } from 'mobx';
import { createTransformer } from 'mobx-utils';

import { NetworkState, MutableStore, MutableStoreItem, Store, Domain } from '../stores';
import { AnyModelInstance } from '../types';

abstract class TreeNode {
  name: string;
  path: string;
  isLeaf: boolean;
}

export class ModelNode<I extends MutableStoreItem<AnyModelInstance>> extends TreeNode {
  item: I;
  constructor(name: string, path: string, isLeaf: boolean, item: I) {
    super();
    this.name = name;
    this.path = path;
    this.isLeaf = isLeaf;
    this.item = item;
  }
  get network(): NetworkState {
    return this.item.network;
  }
  get model(): AnyModelInstance | null {
    return this.item.data;
  }
}

export class MutableStoreNode<S extends MutableStore = MutableStore> extends TreeNode {
  store?: S;
  constructor(name: string, path: string, isLeaf: boolean, store?: S) {
    super();
    this.name = name;
    this.path = path;
    this.isLeaf = isLeaf;
    this.store = store;
  }
  @computed get children() {
    return !this.store ? [] : Array.from(this.store.values, item => new ModelNode(item.id, '', false, item));
  }
}

export class StoreNode<S extends Store = Store> extends TreeNode {
  store?: S;
  constructor(name: string, path: string, isLeaf: boolean, store?: S) {
    super();
    this.name = name;
    this.path = path;
    this.isLeaf = isLeaf;
    this.store = store;
  }
  @computed get children(): ModelNode<MutableStoreItem<AnyModelInstance>>[] {
    return [];
  }
}

export class DomainView {
  private readonly domain: Domain;
  constructor(domain: Domain) {
    this.domain = domain;
  }
  @computed get stores() {
    return Array.from(this.domain.stores.values(), store => {
      switch (store.constructor) {
        case MutableStore:
          return new MutableStoreNode(store.name, '', true, store as MutableStore);
        default:
          return new StoreNode(store.name, '', true, store);
      }
    });
  }
}

export const domainView = createTransformer((domain: Domain) => {
  return new DomainView(domain);
});
