import Filter from "./filter.js";
import {Prefix} from "./prefix.js";

const xsd = new Prefix("http://www.w3.org/2001/XMLSchema#");

/**
 * Wrap an array of quads to facilitate filtering and iteration.
 */
export class QuadReader {
  #quads;
  #filter;

  /**
   * Create reader for a set of quads, optionally filtering the quads.  Quads
   * are expected to be in a format compatible with the N3.js library.
   */
  constructor(quads, {subject, predicate, object, graph}={}) {
    if (typeof quads === "string" || !quads[Symbol.iterator]) {
      throw new TypeError("quads should be iterable of quad objects");
    }

    this.#quads = [...quads];
    this.#filter = Filter(subject, predicate, object, graph);
  }

  // TODO: additional methods?
  // getObjectValue
  // getPredicateValue
  // or not; shouldn't getTermValue work for allPO key?

  /**
   * Evaluate an RDF node to determine its value.  For named nodes, return the
   * id of the node.  For blank nodes, return the node itself.  For literal
   * nodes, return the literal value.
   */
  static getTermValue(term) {
    if (!term) return term;

    switch (Object.getPrototypeOf(term).constructor.name) {
      case "NamedNode": return term.id;
      case "BlankNode": return term;
      case "Literal":   return QuadReader.getLiteralValue(term);
      default:          return term;
    }
  }

  /**
   * Evaluate a literal node to determine its value.
   */
  static getLiteralValue(literal) {
    if (literal.id[0] === '"') {
      const end = literal.id.lastIndexOf('"');
      const data = literal.id.slice(1, end);
      const type = literal.id.slice(end+3);

      // TODO: ensure type has '^^' prefix?

      switch (type) {
        case "":
          return data;
        case xsd.boolean:
          return data === "true";
        case xsd.integer:
          return parseInt(data);
        case xsd.decimal:
        case xsd.double:
          return parseFloat(data);
        case xsd.hexBinary:
          return Buffer.from(data, "hex");
        default:
          throw new TypeError(`cannot read ${type} literal`);
      }
    }
  }

  /**
   * Iterate over quads which match the filter set for this reader.
   */
  *[Symbol.iterator]() {
    if (this.#filter) {
      yield* this.#quads.filter(this.#filter)
    } else {
      yield* this.#quads;
    }
  }

  /**
   * Create new QuadReader by filtering the quads from this reader.
   */
  filter(subject=null, predicate=null, object=null, graph=null) {
    return new QuadReader(this, {subject, predicate, object, graph});
  }

  /**
   * Return an object containing all filtered quad predicates and objects, using
   * the predicate as the keys, and the objects as the values.  Each object
   * value will be an array by default.  If flatten is truthy the arrays will be
   * flattened into a single object when possible.
   */
  allPO(flatten=false) {
    const result = {};

    for (const quad of this) {
      const key = quad.predicate.id;
      const value = QuadReader.getTermValue(quad.object);

      if (result[key] instanceof Array) {
        result[key].push(value);
      } else if (result[key]) {
        result[key] = [result[key], value];
      } else if (flatten) {
        result[key] = value;
      } else {
        result[key] = [value];
      }
    }

    return result;
  }
}
