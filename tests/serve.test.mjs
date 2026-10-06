import { test } from "node:test";
import assert from "node:assert/strict";
import { createPreviewServer } from "../scripts/serve.mjs";

test("preview serves built documents and refuses arbitrary filesystem paths", async () => {
  const server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    const responses = await Promise.all(
      [
        "/",
        "/examples/brief.html",
        "/examples/editorial.html",
        "/examples/report.html",
      ].map((route) => fetch(base + route)),
    );
    for (const response of responses) {
      assert.equal(response.status, 200);
      assert.equal(
        response.headers.get("content-type"),
        "text/html; charset=utf-8",
      );
    }
    const denied = await Promise.all(
      [
        "/package.json",
        "/../package.json",
        "/%2e%2e/package.json",
        "/examples/../../etc/passwd",
        "/examples/%2e%2e%2fpackage.json",
        "/%2fetc%2fpasswd",
        "/examples/brief.html/../../package.json",
      ].map((route) => fetch(base + route)),
    );
    for (const response of denied) assert.equal(response.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
