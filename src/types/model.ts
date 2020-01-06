import { observable } from 'mobx';

import { TYPE, CONTEXT, PARENT, MUTABLES } from '../symbols';
import { Type, Properties, Snapshot, Instance, getter } from './base';

export type ModelSnapshot<T extends AnyModelType> = { __typename: string } & {
  [K in keyof T['properties']]?: Snapshot<T['properties'][K]>;
};

export type ModelInstance<T extends AnyModelType> = {} & Model<T> &
  { [K in keyof T['properties']]?: Instance<T['properties'][K]> };

export type AnyModelType = ModelType<{}>;

export type AnyModelInstance = ModelInstance<AnyModelType>;

export class ModelType<P extends Properties> extends Type<ModelInstance<ModelType<P>>, ModelSnapshot<ModelType<P>>> {
  properties: P;
  ctor: ModelConstructor<ModelType<P>>;
  constructor(name: string, properties: P, baseModel: ModelConstructor<ModelType<P>> = Model) {
    super();
    this.name = name;
    this.persistent = true;
    this.primitive = false;
    this.compound = true;
    this.properties = properties;
    this.ctor = extendModel(properties, baseModel);

    // Bind method context
    this.serialize = this.serialize.bind(this);
    this.deserialize = this.deserialize.bind(this);
    this.create = this.create.bind(this);
  }
  serialize(instance: ModelInstance<this>): ModelSnapshot<this> {
    const snapshot = Object.create({});
    for (const key in this.properties) {
      const instValue = instance[key];
      if (instValue !== undefined) {
        snapshot[key] = this.properties[key].type.serialize(instValue);
      }
    }
    snapshot['__typename'] = this.name;
    return snapshot;
  }
  deserialize(snapshot: ModelSnapshot<this>, instance?: ModelInstance<this>, context?: any): ModelInstance<this> {
    // Create the instance
    if (instance === undefined) {
      instance = new this.ctor(this) as ModelInstance<this>;
      instance[CONTEXT] = context;
    } else {
      if (instance.id !== snapshot.id) {
        //TODO: Check __typename as well.
        instance[TYPE].detach(instance);
        instance = new this.ctor(this) as ModelInstance<this>;
        instance[CONTEXT] = context;
      }
    }

    // Deserialize / reconcile properties
    for (const key in this.properties) {
      if (snapshot[key] === undefined) continue;
      instance[key] = this.properties[key].type.deserialize(snapshot[key], instance[key], context);
    }
    return instance;
  }
  create(snapshot: ModelSnapshot<this>, context: any) {
    // Create the root instance
    const instance = this.deserialize(snapshot, undefined, context);

    // This is a root node, so attach all the children
    instance[TYPE].attach(instance);
    return instance;
  }
  attach(instance: ModelInstance<this>, parent?: ModelInstance<this>) {
    // Attach this instance
    instance[PARENT] = parent;

    // Attach the children
    for (const key in this.properties) {
      const prop = this.properties[key];
      if (!prop.type.compound || instance[key] === undefined) continue;
      if (instance[key][PARENT] !== undefined) continue;
      (prop.type as ModelType<P>).attach(instance[key] as ModelInstance<this>, instance);
    }
  }
  detach(instance: ModelInstance<this>) {
    instance[PARENT] = undefined;
  }
}

export function modelType<P extends Properties>(name: string, properties: P) {
  return new ModelType(name, properties);
}

export class Model<T extends AnyModelType> {
  [TYPE]: T;
  [CONTEXT]: any;
  [PARENT]?: any;
  [MUTABLES]: { [key: string]: any };
  constructor(type: T) {
    this[TYPE] = type;
    this[MUTABLES] = observable({});
  }
}

export interface ModelConstructor<T extends AnyModelType> extends Function {
  new (...args: any[]): Model<T>;
}

function defaultGetter<T>(this: AnyModelInstance, key: string): T {
  return this[MUTABLES][key];
}

function defaultSetter<T>(this: AnyModelInstance, key: string, value: T): void {
  this[MUTABLES][key] = value;
}

function extendModel<P extends Properties>(properties: P, baseModel: ModelConstructor<ModelType<P>>) {
  // Subclass the base model
  class Model extends baseModel {}

  // Define the additional properties
  for (const key in properties) {
    const prop = properties[key];
    Object.defineProperty(Model.prototype, key, {
      configurable: false,
      enumerable: true,
      get:
        prop.getter !== undefined
          ? function(this: Model): Instance<typeof prop> {
              return (prop.getter as getter<Instance<typeof prop>, {}>).call(this, key);
            }
          : function(this: Model): Instance<typeof prop> {
              return defaultGetter.call<Model, [string], Instance<typeof prop>>(this, key);
            },
      set: function(this: Model, value: Instance<typeof prop>) {
        defaultSetter.call<Model, [string, Instance<typeof prop>], void>(this, key, value);
      }
    });
  }

  return Model;
}

// Utilty Functions

export function serialize(instance: AnyModelInstance) {
  return instance[TYPE].serialize(instance);
}

//TODO: Fix argument types
export function applySnapshot<I extends AnyModelInstance>(instance: I, snapshot: ModelSnapshot<AnyModelType>) {
  // Reconcile the instance
  const type = instance[TYPE];
  const reconciled = type.deserialize(snapshot, instance, instance[CONTEXT]);

  // Attach any new children
  type.attach(reconciled);
  return reconciled;
}

export function fallback<T>(func: getter<T, {}>) {
  return function(this: AnyModelInstance, key: string): T {
    return defaultGetter.call<typeof this, [typeof key], T>(this, key) || func.call(this, key);
  };
}
