import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Cancel Vulture homepage and Vulture Watch link", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Cancel Vulture/);
  assert.match(html, /href="\/vulture-watch"/);
  assert.match(html, /microsoft-clarity/);
  assert.match(html, /GoogleAnalytics/);
});

test("server-renders the editorial dashboard with quality guardrails", async () => {
  const response = await render("/vulture-watch");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Vulture Watch/);
  assert.match(html, /No source, no story/);
  assert.match(html, /Manual merge approval required/);
  assert.match(html, /Manual publishing/);
  assert.match(html, /microsoft-clarity/);
  assert.match(html, /GoogleAnalytics/);
});
