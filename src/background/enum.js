class EnumOption
{
  constructor(name, value) {
    if (!Object.is(value, undefined)) {
      this.value = value;
    }

    this.symbol = Symbol.for(name);

    Object.freeze(this);
  }

  toString() {
    return this.symbol;
  }

  valueOf() {
    return this.value;
  }
}

class Enum
{
  constructor(options) {
    for (let key in options) {
      this[key] = new EnumOption(key, options[key]);
    }

    Object.freeze(this);
  }

  keys() {
    return Object.keys(this);
  }

  contains(option) {
    if (!(option instanceof EnumOption)) {
      return false;
    }

    return this[Symbol.keyFor(option.symbol)] === symbol;
  }
}
