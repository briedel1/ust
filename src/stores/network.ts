import { observable, computed } from 'mobx';
import { ApolloClient, NormalizedCacheObject } from 'apollo-boost';

export type Client = ApolloClient<NormalizedCacheObject>;

export type NetworkStatus = 'pending' | 'static';

export type NetworkAction = 'none' | 'loading' | 'creating' | 'committing';

export class NetworkState {
  @observable action: NetworkAction = 'none';
  constructor(action: NetworkAction = 'none') {
    this.action = action;
  }
  @computed get status(): NetworkStatus {
    return this.action === 'none' ? 'static' : 'pending';
  }
}

// Utilities

export function operation_root(operation: any): string {
  return operation.definitions[0].name.value;
}
