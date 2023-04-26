import expect from "expect.js";
import {QuadReader} from "../src/quad-reader.js";

// mocked classes compatible with N3.js types
class BlankNode { constructor(id) { this.id = id; } }
class NamedNode { constructor(id) { this.id = id; } }
class Literal   { constructor(id) { this.id = id; } }

// mocked subjects
const A = new NamedNode("A");
const B = new NamedNode("B");
const C = new NamedNode("C");

// mocked predicates
const knows = new NamedNode("knows");
const is = new NamedNode("is");
const named = new NamedNode("named");

// mocked blank
const b1 = new BlankNode("_:b1");

// mocked graph
const graph = {id: ""};

// mock quad factory
function Quad(subject, predicate, object, graph) {
  return {subject, predicate, object, graph};
}

describe("QuadReader", () => {
  describe("new QuadReader([Quad, ...])", () => {
    it("should construct an QuadReader object", () => {
      expect(new QuadReader([])).to.be.a(QuadReader);
    });

    it("should throw if argument is string or not iterable", () => {
      const iterable = {*[Symbol.iterator]() { yield* []; }};

      expect(() => new QuadReader(undefined)).to.throwError();
      expect(() => new QuadReader(true)).to.throwError();
      expect(() => new QuadReader("foo")).to.throwError();
      expect(() => new QuadReader(42)).to.throwError();
      expect(() => new QuadReader({})).to.throwError();
      expect(() => new QuadReader([])).to.not.throwError();
      expect(() => new QuadReader(iterable)).to.not.throwError();
    });
  });

  describe("iteration", () => {
    it("should be iterable", () => {
      const quadA = Quad(A, knows, B, graph);
      const quadB = Quad(A, knows, C, graph);
      const reader = new QuadReader([quadA, quadB]);
      const iterated = [...reader];

      expect(iterated).to.have.length(2);
      expect(iterated).to.contain(quadA);
      expect(iterated).to.contain(quadB);
    });
  });

  describe("QuadReader#filter(subject, predicate, object, graph)", () => {
    const quadA = Quad(A, knows, B, graph);
    const quadB = Quad(B, knows, A, graph);
    const reader = new QuadReader([quadA, quadB]);

    it("should return new QuadReader", () => {
      const filtered = reader.filter(A, knows, B, graph);

      expect(filtered).to.be.a(QuadReader);
      expect(filtered).to.not.be(reader);
    });

    it("should filter nodes", () => {
      const filtered = reader.filter(A, knows, B, graph);
      const iterated = [...filtered];

      expect(iterated).to.have.length(1);
      expect(iterated).to.contain(quadA);
    });

    it("should filter ids", () => {
      const filtered = reader.filter("A", "knows", "B", "");
      const iterated = [...filtered];

      expect(iterated).to.have.length(1);
      expect(iterated).to.contain(quadA);
    });

    it("should ignore null/undefined terms in filter", () => {
      const filtered = reader.filter(null, "knows");
      const iterated = [...filtered];

      expect(iterated).to.have.length(2);
      expect(iterated).to.contain(quadA);
      expect(iterated).to.contain(quadB);
    })
  });

  describe("QuadReader#allPO(flatten)", () => {
    const quadA = Quad(A, is, B, graph);
    const quadB = Quad(A, knows, B, graph);
    const quadC = Quad(A, knows, C, graph);
    const quadE = Quad(B, is, b1, graph);
    const quadD = Quad(C, named, new Literal('"foo"'), graph);
    const reader = new QuadReader([quadA, quadB, quadC, quadD, quadE]);

    it("should result in key for each predicate id", () => {
      const po = reader.filter(A).allPO();

      expect(po).to.be.an("object");
      expect(po).to.have.property("is");
      expect(po).to.have.property("knows");
    });

    it("should have object ids in result array", () => {
      const po = reader.filter(A).allPO();

      expect(po.is).to.be.an("array");
      expect(po.is).to.have.length(1);
      expect(po.is).to.contain("B");
    });

    it("should result in arrays of literal values", () => {
      const po = reader.filter(C).allPO();

      expect(po.named).to.be.an("array");
      expect(po.named).to.have.length(1);
      expect(po.named).to.contain("foo");
    });

    it("should flatten single results if argument is true", () => {
      const po = reader.filter(A).allPO(true);

      expect(po.is).to.be("B");
    });

    it("should leave multiple results as array if argument is true", () => {
      const po = reader.filter(A).allPO(true);

      expect(po.knows).to.be.an("array");
      expect(po.knows).to.have.length(2);
      expect(po.knows).to.contain("B");
      expect(po.knows).to.contain("C");
    });

    it("should return blank objects instead of ids", () => {
      const po = reader.filter(B).allPO(true);

      expect(po.is).to.be(b1);
    });
  });
});
