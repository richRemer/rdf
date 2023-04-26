const prefix = Symbol("Prefix.prefix");

/**
 * Create a Prefix proxy which can generate strings with a prefix.
 */
export class Prefix {
  constructor(prefix) {
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop === Prefix.prefix) {
          return prefix;
        } else if (typeof prop === "string") {
          return prefix + prop;
        } else {
          return undefined;
        }
      }
    });
  }

  /**
   * Symbol which can be used to look up the prefix used to construct a Prefix
   * proxy.
   */
  static prefix = prefix;
}