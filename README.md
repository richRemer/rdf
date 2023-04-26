Example: WebID-TLS
==================
This example retrieves a WebID profile document and filters for the exponent and
modulus for the client certificate defined for the WebID.

```js
import {Parser} from "https://cdn.jsdelivr.net/npm/@welib/n3-esm/n3.js";
import {QuadReader, Prefix} from "https://cdn.jsdelivr.net/npm/@welib/rdf/rdf.js"

const webid = "https://id.example/me";
const rdf = new Prefix("http://www.w3.org/1999/02/22-rdf-syntax-ns#";
const cert = new Prefix("http://www.w3.org/ns/auth/cert#";

let parser = new Parser({baseIRI: webid});
let body = await (await fetch(webid)).text();
let quads = parser.parse(body);
let reader = new QuadReader(quads);

for (const {object: node} of reader.filter(webid, cert.key)) {
  const certInfo = reader.filter(node).allPO(true);

  if (certInfo[rdf.type] === cert.RSAPublicKey) {
    const exp = certInfo[cert.exponent];
    const mod = certInfo[cert.modulus];
    console.log("WebID-TLS Cert Found:", exp, mod);
  }
}
```
