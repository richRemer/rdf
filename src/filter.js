/**
 * Return filter function which can test a quad against the provided terms.  The
 * quad should be in a format compatible with those found in the N3.js project.
 */
export default function filter(subject, predicate, object, graph) {
  let name = "";

  if (isNode(subject))    name += "S"; else if (subject)    name += "s";
  if (isNode(predicate))  name += "P"; else if (predicate)  name += "p";
  if (isNode(object))     name += "O"; else if (object)     name += "o";
  if (isNode(graph))      name += "G"; else if (graph)      name += "g";

  return filters[name](subject, predicate, object, graph);

  function isNode(term) {
    return typeof term?.id === "string";
  }
}

/**
 * All filter permutations.  Facilitates hash lookup for appropriate filter
 * function.  Filter names consist of characters:
 *   'S' filter subject identity      's' filter subject id
 *   'P' filter predicate identity    'p' filter predicate id
 *   'O' filter object identity       'o' filter object id
 *   'G' filter graph identity        'g' filter graph id
 */

const filters = {
  // degenerate factory when no terms are provided
  ""(s,p,o,g)   { return undefined; },

  // one-term filter factories
  S   (s,p,o,g) { return q => s === q.subject                                                                    ; },
  P   (s,p,o,g) { return q =>                       p === q.predicate                                            ; },
  O   (s,p,o,g) { return q =>                                               o === q.object                       ; },
  G   (s,p,o,g) { return q =>                                                                    g === q.graph   ; },
  s   (s,p,o,g) { return q => s === q.subject.id                                                                 ; },
  p   (s,p,o,g) { return q =>                       p === q.predicate.id                                         ; },
  o   (s,p,o,g) { return q =>                                               o === q.object.id                    ; },
  g   (s,p,o,g) { return q =>                                                                    g === q.graph.id; },

  // two-term filter factories
  SP  (s,p,o,g) { return q => s === q.subject    && p === q.predicate                                            ; },
  SO  (s,p,o,g) { return q => s === q.subject                            && o === q.object                       ; },
  SG  (s,p,o,g) { return q => s === q.subject                                                 && g === q.graph   ; },
  Sp  (s,p,o,g) { return q => s === q.subject    && p === q.predicate.id                                         ; },
  So  (s,p,o,g) { return q => s === q.subject                            && o === q.object.id                    ; },
  Sg  (s,p,o,g) { return q => s === q.subject                                                 && g === q.graph.id; },
  PO  (s,p,o,g) { return q =>                       p === q.predicate    && o === q.object                       ; },
  PG  (s,p,o,g) { return q =>                       p === q.predicate                         && g === q.graph   ; },
  Po  (s,p,o,g) { return q =>                       p === q.predicate    && o === q.object.id                    ; },
  Pg  (s,p,o,g) { return q =>                       p === q.predicate                         && g === q.graph.id; },
  OG  (s,p,o,g) { return q =>                                               o === q.object    && g === q.graph   ; },
  Og  (s,p,o,g) { return q =>                                               o === q.object    && g === q.graph.id; },
  sP  (s,p,o,g) { return q => s === q.subject.id && p === q.predicate                                            ; },
  sO  (s,p,o,g) { return q => s === q.subject.id                         && o === q.object                       ; },
  sG  (s,p,o,g) { return q => s === q.subject.id                                              && g === q.graph   ; },
  sp  (s,p,o,g) { return q => s === q.subject.id && p === q.predicate.id                                         ; },
  so  (s,p,o,g) { return q => s === q.subject.id                         && o === q.object.id                    ; },
  sg  (s,p,o,g) { return q => s === q.subject.id                                              && g === q.graph.id; },
  pO  (s,p,o,g) { return q =>                       p === q.predicate.id && o === q.object                       ; },
  pG  (s,p,o,g) { return q =>                       p === q.predicate.id                      && g === q.graph   ; },
  po  (s,p,o,g) { return q =>                       p === q.predicate.id && o === q.object.id                    ; },
  pg  (s,p,o,g) { return q =>                       p === q.predicate.id                      && g === q.graph.id; },
  oG  (s,p,o,g) { return q =>                                               o === q.object.id && g === q.graph   ; },
  og  (s,p,o,g) { return q =>                                               o === q.object.id && g === q.graph.id; },

  // three-term filter factories
  SPO (s,p,o,g) { return q => s === q.subject    && p === q.predicate    && o === q.object                       ; },
  SPG (s,p,o,g) { return q => s === q.subject    && p === q.predicate                         && g === q.graph   ; },
  SPo (s,p,o,g) { return q => s === q.subject    && p === q.predicate    && o === q.object.id                    ; },
  SPg (s,p,o,g) { return q => s === q.subject    && p === q.predicate                         && g === q.graph.id; },
  SpO (s,p,o,g) { return q => s === q.subject    && p === q.predicate.id && o === q.object                       ; },
  SpG (s,p,o,g) { return q => s === q.subject    && p === q.predicate.id                      && g === q.graph   ; },
  Spo (s,p,o,g) { return q => s === q.subject    && p === q.predicate.id && o === q.object.id                    ; },
  Spg (s,p,o,g) { return q => s === q.subject    && p === q.predicate.id                      && g === q.graph.id; },
  SOG (s,p,o,g) { return q => s === q.subject                            && o === q.object    && g === q.graph   ; },
  SOg (s,p,o,g) { return q => s === q.subject                            && o === q.object    && g === q.graph.id; },
  SoG (s,p,o,g) { return q => s === q.subject                            && o === q.object.id && g === q.graph   ; },
  Sog (s,p,o,g) { return q => s === q.subject                            && o === q.object.id && g === q.graph.id; },
  POG (s,p,o,g) { return q =>                       p === q.predicate    && o === q.object    && g === q.graph   ; },
  POg (s,p,o,g) { return q =>                       p === q.predicate    && o === q.object    && g === q.graph.id; },
  PoG (s,p,o,g) { return q =>                       p === q.predicate    && o === q.object.id && g === q.graph   ; },
  Pog (s,p,o,g) { return q =>                       p === q.predicate    && o === q.object.id && g === q.graph.id; },
  sPO (s,p,o,g) { return q => s === q.subject.id && p === q.predicate    && o === q.object                       ; },
  sPG (s,p,o,g) { return q => s === q.subject.id && p === q.predicate                         && g === q.graph   ; },
  sPo (s,p,o,g) { return q => s === q.subject.id && p === q.predicate    && o === q.object.id                    ; },
  sPg (s,p,o,g) { return q => s === q.subject.id && p === q.predicate                         && g === q.graph.id; },
  spO (s,p,o,g) { return q => s === q.subject.id && p === q.predicate.id && o === q.object                       ; },
  spG (s,p,o,g) { return q => s === q.subject.id && p === q.predicate.id                      && g === q.graph   ; },
  spo (s,p,o,g) { return q => s === q.subject.id && p === q.predicate.id && o === q.object.id                    ; },
  spg (s,p,o,g) { return q => s === q.subject.id && p === q.predicate.id                      && g === q.graph.id; },
  sOG (s,p,o,g) { return q => s === q.subject.id                         && o === q.object    && g === q.graph   ; },
  sOg (s,p,o,g) { return q => s === q.subject.id                         && o === q.object    && g === q.graph.id; },
  soG (s,p,o,g) { return q => s === q.subject.id                         && o === q.object.id && g === q.graph   ; },
  sog (s,p,o,g) { return q => s === q.subject.id                         && o === q.object.id && g === q.graph.id; },
  pOG (s,p,o,g) { return q =>                       p === q.predicate.id && o === q.object    && g === q.graph   ; },
  pOg (s,p,o,g) { return q =>                       p === q.predicate.id && o === q.object    && g === q.graph.id; },
  poG (s,p,o,g) { return q =>                       p === q.predicate.id && o === q.object.id && g === q.graph   ; },
  pog (s,p,o,g) { return q =>                       p === q.predicate.id && o === q.object.id && g === q.graph.id; },

  // four-term filter factories
  SPOG(s,p,o,g) { return q => s === q.subject    && p === q.predicate    && o === q.object    && g === q.graph   ; },
  SPOg(s,p,o,g) { return q => s === q.subject    && p === q.predicate    && o === q.object    && g === q.graph.id; },
  SPoG(s,p,o,g) { return q => s === q.subject    && p === q.predicate    && o === q.object.id && g === q.graph   ; },
  SPog(s,p,o,g) { return q => s === q.subject    && p === q.predicate    && o === q.object.id && g === q.graph.id; },
  SpOG(s,p,o,g) { return q => s === q.subject    && p === q.predicate.id && o === q.object    && g === q.graph   ; },
  SpOg(s,p,o,g) { return q => s === q.subject    && p === q.predicate.id && o === q.object    && g === q.graph.id; },
  SpoG(s,p,o,g) { return q => s === q.subject    && p === q.predicate.id && o === q.object.id && g === q.graph   ; },
  Spog(s,p,o,g) { return q => s === q.subject    && p === q.predicate.id && o === q.object.id && g === q.graph.id; },
  sPOG(s,p,o,g) { return q => s === q.subject.id && p === q.predicate    && o === q.object    && g === q.graph   ; },
  sPOg(s,p,o,g) { return q => s === q.subject.id && p === q.predicate    && o === q.object    && g === q.graph.id; },
  sPoG(s,p,o,g) { return q => s === q.subject.id && p === q.predicate    && o === q.object.id && g === q.graph   ; },
  sPog(s,p,o,g) { return q => s === q.subject.id && p === q.predicate    && o === q.object.id && g === q.graph.id; },
  spOG(s,p,o,g) { return q => s === q.subject.id && p === q.predicate.id && o === q.object    && g === q.graph   ; },
  spOg(s,p,o,g) { return q => s === q.subject.id && p === q.predicate.id && o === q.object    && g === q.graph.id; },
  spoG(s,p,o,g) { return q => s === q.subject.id && p === q.predicate.id && o === q.object.id && g === q.graph   ; },
  spog(s,p,o,g) { return q => s === q.subject.id && p === q.predicate.id && o === q.object.id && g === q.graph.id; }
}
