import Filter from "./filter.js";
import {Prefix} from "./prefix.js";

const flatten = Symbol("QuadReader.flatten");
const objects = Symbol("QuadReader.objects");

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

  static flatten = flatten;
  static objects = objects;

  /**
   * Evaluate an RDF term to determine its value.  For named nodes and blank
   * nodes, return the node itself.  For literal nodes, return the literal
   * value.
   */
  static getObjectValue(term) {
    if (!term) return term;

    switch (Object.getPrototypeOf(term).constructor.name) {
      case "Literal":   return QuadReader.getLiteralValue(term);
      default:          return term;
    }
  }

  /**
   * Evaluate an RDF term to determine its value.  For named nodes, return the
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
   * Return array of unique subjects found in the quads.
   */
  subjects() {
    return [...new Set([...this].map(q => q.subject))];
  }

  /**
   * Return array of unique predicates found in the quads.
   */
  predicates() {
    return [...new Set([...this].map(q => q.predicate))];
  }

  /**
   * Return array of unique objects found in the quads.
   */
  objects() {
    const {getObjectValue} = QuadReader;
    return [...new Set([...this].map(q => getObjectValue(q.object)))];
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

  /**
   * Create a plain old JavaScript object based on the list of quads.  If a
   * subject is specified, the object will include predicates for that subject.
   * If no subject is specified, the object will have a key for each non-blank
   * subject in the quad set.  The following options are recognized and can be
   * provided in any order:
   *  - QuadReader.objects: include references to objects when possible
   *  - QuadReader.flatten: flatten arrays when possible
   */
  pojo(subject, ...options) {
    for (const option of options) {
      if (![QuadReader.flatten, QuadReader.objects].includes(option)) {
        throw new Error(`invalid option '${option}'`);
      }
    }

    const flatten = options.includes(QuadReader.flatten);
    const objects = options.includes(QuadReader.objects);
    const reader = this;
    const evaluated = new Map();
    const subjects = new Set([...reader].map(q => q.subject));

    // if subject id provided, get the actual subject
    if (typeof subject === "string") {
      const [quad] = reader.filter(subject);
      subject = quad?.subject ?? true;   // true caught as degenerate below
    }

    // if requested subject is not in quad set, return degenerate object
    if (subject && !subjects.has(subject)) {
      return {};
    }

    // if subject specified, evaluate it and return
    if (subject) {
      return pojo(subject);
    }

    // if subject not specified, build pojo from all named subjects
    else {
      const named = [...subjects].filter(s => s.constructor.name==="NamedNode");
      return named.reduce((o,s) => ({...o, [s.id]: pojo(s)}), {});
    }

    // recursive implementation
    function pojo(subject) {
      // add subject to evaluated cache if missing
      if (!evaluated.has(subject)) {
        // evaluate subject if it's included in quads
        if (subjects.has(subject)) {
          const result = {};

          evaluated.set(subject, result);

          for (const quad of reader.filter(subject)) {
            const key = quad.predicate.id;
            const object = QuadReader.getObjectValue(quad.object);
            let value;

            if (typeof object === "object") {
              value = objects ? pojo(object) : object.id;
            } else {
              value = object;
            }

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
        }

        // otherwise use the subject id
        else {
          evaluated.set(subject, subject.id);
        }
      }

      // return evaluated subject from cache
      return evaluated.get(subject);
    }
  }
}
