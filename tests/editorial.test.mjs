import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { deterministicReview, findDuplicate, isOfficialUrl, similarity, slugify, validateManualArticle } from "../editorial/lib.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

test("duplicate detection catches overlapping search intent", () => {
  const existing = [{ title: "How to cancel Netflix", slug: "how-to-cancel-netflix", searchIntent: "cancel a Netflix subscription" }];
  assert.ok(findDuplicate({ title: "Cancel Netflix subscription", searchIntent: "how to cancel Netflix subscription" }, existing));
  assert.ok(similarity("cancel Netflix subscription", "how to cancel a Netflix subscription") >= 0.58);
});

test("source allowlist accepts official subdomains and rejects third parties", () => {
  assert.equal(isOfficialUrl("https://help.netflix.com/en/node/407"), true);
  assert.equal(isOfficialUrl("https://example.com/how-to-cancel-netflix"), false);
});

test("slug generation is stable and URL safe", () => assert.equal(slugify("Netflix Price Change: What to Know"), "netflix-price-change-what-to-know"));

test("quality gate rejects unsupported source records", () => {
  const article = { title: "Test", slug: "test", searchIntent: "test", summaryAnswer: "Answer", cancellationInstructions: ["Step"], refundInformation: "Policy", internalLinks: ["/vulture-watch"] };
  const reasons = deterministicReview(article, [{ url: "https://example.com", official: false, reachable: true, claims: [], claimsSupported: false }], { articles: [] });
  assert.ok(reasons.includes("invalid_or_insufficient_official_sources"));
  assert.ok(reasons.includes("source_without_extracted_claims"));
  assert.ok(reasons.includes("claim_not_found_in_retrieved_source_text"));
});

test("manual article template is structurally complete but cannot be published with placeholders", async () => {
  const template = JSON.parse(await readFile(new URL("../content/vulture-watch/manual/article-template.json", import.meta.url), "utf8"));
  const errors = validateManualArticle(template, { articles: [] });
  assert.ok(errors.includes("Template placeholders must be replaced"));
  assert.ok(errors.includes("lastVerified must be YYYY-MM-DD"));
});

test("AI pipeline exits successfully when OPENAI_API_KEY is absent", () => {
  const env = { ...process.env };
  delete env.OPENAI_API_KEY;
  const result = spawnSync(process.execPath, ["editorial/pipeline.mjs"], { cwd: root, env, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /AI discovery and drafting were skipped/);
});

test("Vulture Watch reuses the existing sitewide analytics IDs", async () => {
  const analytics = await readFile(new URL("../app/analytics.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(analytics, /G-92CECJG5CY/);
  assert.match(layout, /xsktlxsem4/);
  assert.match(layout, /<GoogleAnalytics \/>/);
});
