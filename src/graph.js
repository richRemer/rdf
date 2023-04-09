import fetch from "node-fetch";
import rdf from "rdf";

const a = rdf.rdfns("type");

export class Graph {
  #graph;

  constructor(rdfGraph, type=undefined, base=undefined) {
    if (typeof rdfGraph === "string") switch (type) {
      case "text/turtle":
        rdfGraph = rdf.TurtleParser.parse(rdfGraph, base).graph;
        break;
      default:
        throw new Error("supported types are: text/turtle");
    }

    this.#graph = rdfGraph;
  }

  static async fetch(url) {
    const res = await fetch(url);
    const body = await res.text();
    const doc = rdf.TurtleParser.parse(body, url);

    return new Graph(doc.graph);
  }

  findObjects(subject, predicate) {
    const graph = this.#graph;
    return graph.match(subject, predicate, null).toArray().map(T => T.object);
  }

  findOnlyObject(subject, predicate) {
    const objects = this.findObjects(...arguments);
    return objects.length === 1 ? objects[0] : null;
  }

  readLiteral(subject, predicate, type=undefined) {
    const object = this.findOnlyObject(subject, predicate);

    if (object instanceof rdf.Literal) {
      return type && object.datatype !== type ? null : object.nominalValue;
    }
  }

  typeFilter(type) {
    const graph = this.#graph;

    return function(subject) {
      const {length} = graph.match(subject, a, type);
      return length > 0;
    }
  }
}
