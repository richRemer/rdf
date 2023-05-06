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
  describe("static properties", () => {
    it("should expose option symbols", () => {
      expect(QuadReader.flatten).to.be.a("symbol");
      expect(QuadReader.objects).to.be.a("symbol");
    });
  });

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

  describe("QuadReader#subjects()", () => {
    const quadA = Quad(A, named, new Literal('"A"'), graph);
    const quadB = Quad(B, named, new Literal('"B"'), graph);
    const quadC = Quad(B, knows, A, graph);
    const quadD = Quad(b1, named, new Literal('"b1"'), graph);
    const reader = new QuadReader([quadA, quadB, quadC, quadD]);

    it("should return array of unique subjects", () => {
      const subjects = reader.subjects();

      expect(subjects).to.be.an("array");
      expect(subjects).to.have.length(3);
      expect(subjects).to.contain(A);
      expect(subjects).to.contain(B);
      expect(subjects).to.contain(b1);
    });

    it("should only return filtered subjects", () => {
      const subjects = reader.filter(null, knows).subjects();

      expect(subjects).to.be.an("array");
      expect(subjects).to.have.length(1);
      expect(subjects).to.contain(B);
    });
  });

  describe("QuadReader#predicates()", () => {
    const quadA = Quad(A, named, new Literal('"A"'), graph);
    const quadB = Quad(B, named, new Literal('"B"'), graph);
    const quadC = Quad(B, knows, A, graph);
    const quadD = Quad(b1, named, new Literal('"b1"'), graph);
    const reader = new QuadReader([quadA, quadB, quadC, quadD]);

    it("should return array of unique predicates", () => {
      const predicates = reader.predicates();

      expect(predicates).to.be.an("array");
      expect(predicates).to.have.length(2);
      expect(predicates).to.contain(named);
      expect(predicates).to.contain(knows);
    });

    it("should only return filtered predicates", () => {
      const predicates = reader.filter(b1).predicates();

      expect(predicates).to.be.an("array");
      expect(predicates).to.have.length(1);
      expect(predicates).to.contain(named);
    });
  });

  describe("QuadReader#objects()", () => {
    const quadA = Quad(A, named, new Literal('"A"'), graph);
    const quadB = Quad(B, named, new Literal('"B"'), graph);
    const quadC = Quad(B, knows, A, graph);
    const quadD = Quad(b1, named, new Literal('"b1"'), graph);
    const quadE = Quad(b1, knows, A, graph);
    const reader = new QuadReader([quadA, quadB, quadC, quadD, quadE]);

    it("should return array of unique objects", () => {
      const objects = reader.objects();

      expect(objects).to.be.an("array");
      expect(objects).to.have.length(4);
      expect(objects).to.contain("A");
      expect(objects).to.contain("B");
      expect(objects).to.contain("b1");
      expect(objects).to.contain(A);
    });

    it("should only return filtered subjects", () => {
      const subjects = reader.filter(null, knows).objects();

      expect(subjects).to.be.an("array");
      expect(subjects).to.have.length(1);
      expect(subjects).to.contain(A);
    });
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

  describe("QuadReader#pojo(subject, [flatten], [objects])", () => {
    const quadA = Quad(A, knows, B, graph);
    const quadB = Quad(B, knows, C, graph);
    const quadC = Quad(C, named, new Literal('"foo"'), graph);
    const quadD = Quad(C, is, b1, graph);
    const quadE = Quad(b1, is, A, graph);
    const reader = new QuadReader([quadA, quadB, quadC, quadD, quadE]);

    it("should return object", () => {
      expect(reader.pojo()).to.be.an("object");
    });

    it("should set keys for subject ids", () => {
      const object = reader.pojo();

      expect(object).to.have.key(A.id);
      expect(object).to.have.key(B.id);
      expect(object).to.have.key(C.id);
    });

    it("should set values to nested objects", () => {
      const object = reader.pojo();

      expect(object[A.id]).to.be.an("object");
      expect(object[B.id]).to.be.an("object");
      expect(object[C.id]).to.be.an("object");
    });

    it("should set nested object keys to predicate ids", () => {
      const object = reader.pojo();

      expect(object[A.id]).to.have.key("knows");
      expect(object[B.id]).to.have.key("knows");
      expect(object[C.id]).to.have.key("named");
    });

    it("should set nested object values to arrays of object ids", () => {
      const object = reader.pojo();

      expect(object[A.id].knows).to.have.length(1);
      expect(object[B.id].knows).to.have.length(1);
      expect(object[C.id].named).to.have.length(1);

      expect(object[A.id].knows).to.contain(B.id);
      expect(object[B.id].knows).to.contain(C.id);
      expect(object[C.id].named).to.contain("foo");
    });

    it("should return single object if specified", () => {
      const object = reader.pojo(A);

      expect(object).to.be.an("object");
      expect(object).to.only.have.keys("knows");
      expect(object.knows).to.have.length(1);
      expect(object.knows).to.contain(B.id);
    });

    it("should return single object by id", () => {
      const object = reader.pojo(A.id);

      expect(object).to.be.an("object");
      expect(object).to.only.have.keys("knows");
      expect(object.knows).to.have.length(1);
      expect(object.knows).to.contain(B.id);
    });

    it("should flatten values if option specified", () => {
      const object = reader.pojo(A, QuadReader.flatten);

      expect(object.knows).to.be(B.id);
    });

    it("should descend into objects if option specified", () => {
      const object = reader.pojo(A, QuadReader.flatten, QuadReader.objects);

      expect(object.knows).to.be.an("object");
      expect(object.knows).to.only.have.keys("knows");
      expect(object.knows.knows).to.be.an("object");
      expect(object.knows.knows).to.only.have.keys(["named", "is"]);
      expect(object.knows.knows.named).to.be("foo");
    });

    it("should generate circular references when descending", () => {
      const object = reader.pojo(null, QuadReader.flatten, QuadReader.objects);

      expect(object).to.have.key(A.id);
      expect(object).to.have.key(B.id);
      expect(object).to.have.key(C.id);

      expect(object[A.id].knows).to.be(object[B.id]);
      expect(object[B.id].knows).to.be(object[C.id]);
      expect(object[C.id].named).to.be("foo");
    });

    it("should descend into BlankNodes", () => {
      const object = reader.pojo(null, QuadReader.flatten, QuadReader.objects);

      expect(object[C.id]).to.have.key("is");
      expect(object[C.id].is).to.be.an("object");
      expect(object[C.id].is.is).to.be(object[A.id]);
    });
  });
});
