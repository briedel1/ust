import { observable } from 'mobx';
import { DocumentNode } from 'graphql';
import shortid from 'shortid';

import { Snapshot, AnyModelType, ModelInstance, serialize, applySnapshot, AnyModelInstance } from '../types';
import { operation_root } from './network';
import { VCRepo } from './version-control';
import { MutabilityType, Store, StoreItem } from './base';

// CreateRemote -> Send snapshot, server commits it, and client receives back confirmation.
// GetRemote -> Send id, get head commit, deserialize snapshot to model.
// CommitRemote -> Send snapshot, server commits it and forwards branch, and client receivs back confirmation.

// The user is always operating on the stage.

/**
 * Mutable store contains nested state entities, which can be
 * (1) Created remotely on the server by providing an (a) id and (b) state graph
 * (2) Modified and committed remotely by providing an (a) id (b) headId (c) state graph
 */

export class MutableStoreItem<D> extends StoreItem {
  id: string; // repo id
  repo: VCRepo;
  data: D | null;
  constructor(id: string, data: D | null) {
    super();
    this.id = id;
    this.repo = new VCRepo(id, serialize((data as unknown) as AnyModelInstance), 'briedel1');
    this.data = data;
  }
}

export class MutableStore<T extends AnyModelType = AnyModelType> extends Store<MutableStoreItem<ModelInstance<T>>> {
  private readonly type: T;
  private readonly fetchOp: DocumentNode;
  private readonly createOp: DocumentNode;
  @observable counts = { loading: 0, creating: 0, committing: 0 };
  constructor(type: T, mutability: MutabilityType, fetch: DocumentNode, create: DocumentNode) {
    super(type.name, mutability);
    this.type = type;
    this.fetchOp = fetch;
    this.createOp = create;
  }
  create(graph: Snapshot<T>) {
    // Generate an ID and create a local placeholder with initial state.
    const id = shortid.generate();
    const datum = this.type.create({ ...graph, id }, this.domain);
    const item = new MutableStoreItem(id, datum);
    this._items.set(id, item);

    // Mutate Remotely
    this.createRemote(item);

    return item;
  }
  async createRemote(item: MutableStoreItem<ModelInstance<T>>) {
    //const state = JSON.stringify(item.data === null ? null : serialize(item.data));
    //const hash = graphHash(state, false);
    this.counts.creating++;
    item.network.action = 'creating';

    const response = await this.domain.client.mutate({
      errorPolicy: 'all',
      mutation: this.createOp,
      variables: {
        input: { repo: JSON.stringify(item.repo.serialize()) }
      }
    });

    item.network.action = 'none';
    this.counts.creating--;

    if (response.errors) {
      console.error(response);
      throw new Error('There were errors!');
    }

    if (!response.data) {
      throw new Error('No data was returned!');
    }

    const rootNode = operation_root(this.createOp);
    let data = response.data[rootNode];

    if (item.data !== null) {
      applySnapshot(item.data, data.pricer);
    }

    const jsonString = data.pricer;
    console.log(jsonString);
    console.log(item);
  }
  get(id: string) {
    let item = this._items.get(id);
    if (item === undefined) {
      // Create a local placeholder
      item = new MutableStoreItem<ModelInstance<T>>(id, null);

      // Fetch remotely
      this.getRemote(item);
    }
    return item;
  }
  async getRemote(item: MutableStoreItem<ModelInstance<T>>) {
    this.counts.loading++;
    item.network.action = 'loading';

    const response = await this.domain.client.query({
      query: this.fetchOp,
      variables: {
        id: item.id
      }
    });

    item.network.action = 'none';
    this.counts.loading--;

    if (response.errors) {
      throw new Error('There were errors!');
    }

    if (!response.data) {
      throw new Error('No data was returned!');
    }

    const rootNode = operation_root(this.fetchOp);
    const data = response.data[rootNode];

    // Deserialize item and update the store item
    console.log(JSON.parse(data.state));

    // item.data = datum;

    return;
  }
}

interface MutableStoreOptions<T> {
  type: T;
  fetch: DocumentNode;
  create: DocumentNode;
}

export function mutableStore<T extends AnyModelType>(opts: MutableStoreOptions<T>) {
  const { type, fetch, create } = opts;
  return new MutableStore(type, MutabilityType.Mutable, fetch, create);
}
