const { TestEnvironment } = require("jest-environment-jsdom");

class CustomJSDOMEnvironment extends TestEnvironment {
  async setup() {
    await super.setup();
    this.global.fetch = fetch;
    this.global.Request = Request;
    this.global.Response = Response;
    this.global.Headers = Headers;
    this.global.ReadableStream = ReadableStream;
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder;
    this.global.AbortController = AbortController;
    this.global.AbortSignal = AbortSignal;
  }
}

module.exports = CustomJSDOMEnvironment;
