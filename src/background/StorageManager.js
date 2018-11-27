import EventEmitter from 'events';

class StorageManager extends EventEmitter
{
  constructor(schema, storage) {
    super();
    this.schema = schema;
    this.storage = storage;
  }

  async get() {
    let [payload, modified] = this._upgrade(await this.storage.get());
    if (modified) {
      await this.storage.clear();
      await this.storage.set(payload);
    }

    return payload;
  }

  async set(payload) {
    var [payload, _] = this._upgrade(payload);
    await this.storage.set(payload);
    this.emit('change', payload);
  }

  _upgrade(payload) {
    let modified = false;

    if (Object.keys(payload).length === 0) {
      modified = true;
      payload = this.schema.default;
    }

    if (!payload.version) {
      throw new Error('Missing version.');
    }

    if (payload.version < this.schema.version) {
      modified = true;
      for (let version = payload.version; version < this.schema.version; ++version) {
        let method = `from${version}To${version + 1}`;
        payload = this.schema[method](payload);

        if (payload.version !== (version + 1)) {
          throw new Error('Unexpected version.');
        }
      }
    }

    return [payload, modified];
  }
}

export default StorageManager;