import test from "node:test";
import assert from "node:assert/strict";
import { deterministicReview, findDuplicate, isOfficialUrl, similarity, slugify } from "../editorial/lib.mjs";

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
