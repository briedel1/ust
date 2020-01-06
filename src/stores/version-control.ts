import { graphHash } from '../hash';
import moment from 'moment';

type SHA256 = string;

type JSONString = string;

type JSONSerializableObject = {};

export class VCSnapshot {
  public readonly id: SHA256;
  public readonly snapshot: JSONSerializableObject;
  constructor(snapshot: JSONSerializableObject) {
    this.id = graphHash(snapshot, true);
    this.snapshot = snapshot;
  }
  serialize() {
    return {
      id: this.id,
      snapshot: this.snapshot
    };
  }
}

export class VCCommit {
  public readonly remote: boolean;
  public readonly id: SHA256;
  public readonly parent: SHA256 | undefined;
  public readonly createdBy: string;
  public readonly created: moment.Moment;
  public readonly snapshot: VCSnapshot;
  constructor(snapshot: JSONSerializableObject, parent: SHA256 | undefined, createdBy: string) {
    this.parent = parent;
    this.createdBy = createdBy;
    this.created = moment();
    this.snapshot = new VCSnapshot(snapshot);
    this.id = graphHash(
      {
        parent,
        createdBy: this.createdBy,
        created: this.created,
        snapshot
      },
      true
    );
  }
  serialize() {
    return {
      id: this.id,
      parent: this.parent,
      createdBy: this.createdBy,
      created: this.created.toISOString(),
      snapshot: this.snapshot.serialize()
    };
  }
}

export class VCBranch {
  public readonly id: string;
  public readonly head: VCCommit;
  public readonly history: VCCommit[] = [];
  constructor(id: string, head: VCCommit) {
    this.id = id;
    this.head = head;
  }
  serialize() {
    return {
      id: this.id,
      head: this.head.id,
      history: this.history.map(commit => commit.id)
    };
  }
}

export class VCRepo {
  public readonly id: string;
  public readonly commits: VCCommit[] = [];
  public readonly branches: VCBranch[] = [];
  constructor(id: string, snapshot: JSONSerializableObject, createdBy: string) {
    this.id = id;
    const commit = this.commit(snapshot, createdBy);
    this.createBranch('HEAD', commit);
  }
  commit(snapshot: any, createdBy: string) {
    const parent = this.commits.length === 0 ? undefined : this.commits[this.commits.length - 1].id;
    const commit = new VCCommit(snapshot, parent, createdBy);
    this.commits.push(commit);
    return commit;
  }
  push() {
    //pass
  }
  pull() {}
  createBranch(id: string, head: VCCommit) {
    const branch = new VCBranch(id, head);
    this.branches.push(branch);
    return branch;
  }
  serialize() {
    return {
      id: this.id,
      commits: this.commits.map(commit => commit.serialize()),
      branches: this.branches.map(branch => branch.serialize())
    };
  }
}
