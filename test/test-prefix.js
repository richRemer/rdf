import expect from "expect.js";
import {Prefix} from "../src/prefix.js";

const foo = "http://foo.example/#";

describe("Prefix", () => {
  const prefix = new Prefix(foo);

  it("should construct a Prefix object", () => {
    expect(prefix).to.be.a(Prefix);
  });

  it("should expose prefix string as Prefix.prefix property", () => {
    expect(prefix[Prefix.prefix]).to.be(foo);
  });

  it("should provide property prefixes for arbitrary keys", () => {
    expect(prefix.bar).to.be(foo+"bar");
    expect(prefix.baz).to.be(foo+"baz");
  });
});