const crypto = require("node:crypto");

module.exports = {
  default: crypto,
  getRandomValues: (arr) => (crypto.webcrypto ? crypto.webcrypto.getRandomValues(arr) : crypto.randomFillSync(arr)),
  randomUUID: () => (crypto.randomUUID ? crypto.randomUUID() : "mock-uuid"),
  subtle: crypto.webcrypto?.subtle,
};
