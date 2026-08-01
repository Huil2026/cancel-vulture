import { readFile } from "node:fs/promises";
import { generateDashboardData, readJson, slugify, validateManualArticle, writeJson } from "./lib.mjs";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: npm run editorial:manual -- content/vulture-watch/manual/my-article.json");
  process.exit(1);
}

let article;
try {
  article = JSON.parse(await readFile(inputPath, "utf8"));
} catch (error) {
  console.error(`Unable to read manual article: ${error.message || error}`);
  process.exit(1);
}

const databasePath = "content/vulture-watch/index.json";
const database = await readJson(databasePath, { articles: [] });
article.slug = slugify(article.slug || article.title || "");
const errors = validateManualArticle(article, database);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const retrievedAt = new Date().toISOString();
const record = {
  title: article.title,
  slug: article.slug,
  searchIntent: article.searchIntent,
  status: "manual_review",
  qualityScore: 0,
  sourceCount: article.sources.length,
  lastVerified: article.lastVerified,
  publicationStatus: "draft_pr",
  timeSensitive: article.timeSensitive,
  ...(article.effectiveDate ? { effectiveDate: article.effectiveDate } : {}),
};
const sourceLedger = {
  slug: article.slug,
  verificationMode: "manual",
  retrievedAt,
  sources: article.sources.map(source => ({
    ...source,
    official: true,
    reachable: null,
    status: "manually_verified",
    retrievedAt,
    claimChecks: source.claims.map(claim => ({ claim, supportedByRetrievedText: null })),
    claimsSupported: null,
  })),
};

await writeJson(`content/vulture-watch/articles/${article.slug}.json`, article);
await writeJson(`content/vulture-watch/sources/${article.slug}.sources.json`, sourceLedger);
database.articles = [...database.articles.filter(item => item.slug !== article.slug), record];
await writeJson(databasePath, database);
const run = { lastRun: retrievedAt, status: "manual_ready", generated: 1, approved: 0, rejected: 0, selectedSlug: article.slug, drafts: [{ ...record, sources: record.sourceCount }], errors: [] };
await writeJson(".editorial-output/run.json", run);
await generateDashboardData(database, run);
console.log(`Prepared manual article: /vulture-watch/${article.slug}`);
