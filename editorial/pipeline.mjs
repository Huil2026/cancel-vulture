import { mkdir, writeFile } from "node:fs/promises";
import { MAX_DAILY_DRAFTS, MIN_QUALITY_SCORE, officialDomainSet, officialSources, topicCategories } from "./config.mjs";
import { articleSchema, discoverySchema, reviewSchema } from "./schemas.mjs";
import { askOpenAI, deterministicReview, findDuplicate, generateDashboardData, readJson, slugify, today, validateSources, writeJson } from "./lib.mjs";

const databasePath = "content/vulture-watch/index.json";
const database = await readJson(databasePath, { articles: [] });
const run = { lastRun: new Date().toISOString(), status: "running", generated: 0, approved: 0, rejected: 0, selectedSlug: null, drafts: [], errors: [] };
await mkdir(".editorial-output/drafts", { recursive: true });

try {
  const discovery = await askOpenAI({
    name: "vulture_watch_discovery", schema: discoverySchema, webSearch: true,
    prompt: `Identify up to ${MAX_DAILY_DRAFTS} useful US subscription topics for ${today()} across: ${topicCategories.join(", ")}.
Use recent official company help centers, pricing pages, terms, support documents, announcements, FTC or CFPB pages. Do not rely on blogs or invent changes.
Choose from this official-source registry: ${JSON.stringify(officialSources)}.
Return distinct search intents with practical consumer value. Price alerts must have a confirmed official announcement and effective date.`,
  });

  const uniqueTopics = [];
  for (const topic of discovery.topics.slice(0, MAX_DAILY_DRAFTS)) {
    topic.officialDomains = topic.officialDomains.filter(domain => officialDomainSet.has(domain));
    if (!topic.officialDomains.length) { run.drafts.push({ title: topic.title, status: "rejected", qualityScore: 0, reasons: ["no_registered_official_domain"], sources: 0 }); continue; }
    const duplicate = findDuplicate(topic, [...database.articles, ...uniqueTopics]);
    if (duplicate) run.drafts.push({ title: topic.title, status: "rejected", qualityScore: 0, reasons: ["duplicate_intent"], sources: 0 });
    else uniqueTopics.push(topic);
  }

  const approved = [];
  for (const topic of uniqueTopics) {
    try {
      const article = await askOpenAI({
        name: "vulture_watch_article", schema: articleSchema, webSearch: true,
        prompt: `Draft a Cancel Vulture article about: ${JSON.stringify(topic)}.
Use only official pages on these domains: ${topic.officialDomains.join(", ")}. Every factual statement about prices, dates, fees, refunds, trials, cancellation steps or post-cancellation behavior must appear as an extracted claim under its supporting source URL. If official information is incomplete, use "Manual verification required" and do not guess.
Use this article schema exactly. Keep advice original and useful. Internal links must be root-relative and limited to /, /vulture-watch, or existing article slugs supplied here: ${database.articles.map(item => `/vulture-watch/${item.slug}`).join(", ") || "none"}.
Set lastVerified to ${today()}. Never claim first-hand experience or quote user reports as facts.`,
      });
      article.slug = slugify(article.slug || article.title);
      const checkedSources = await validateSources(article, topic.officialDomains);
      const deterministicReasons = deterministicReview(article, checkedSources, database);
      const review = await askOpenAI({
        name: "vulture_watch_review", schema: reviewSchema,
        prompt: `Act as a strict consumer editorial fact checker. Review this article and its official-source claim ledger.
Reject unsupported facts, overlapping intent, fabricated experience, keyword stuffing, stale or conflicting information, broken internal links, or insufficient original value. Do not infer support merely because a source URL exists; the relevant claim must be present in that source's extracted claims.
ARTICLE: ${JSON.stringify(article)}
SOURCES: ${JSON.stringify(checkedSources)}
DETERMINISTIC FAILURES: ${JSON.stringify(deterministicReasons)}`,
      });
      const finalReasons = [...new Set([...deterministicReasons, ...review.reasons])];
      const status = review.approved && review.score >= MIN_QUALITY_SCORE && !finalReasons.length ? "approved" : review.manualVerificationRequired ? "manual_verification" : "rejected";
      const draftRecord = { title: article.title, slug: article.slug, status, qualityScore: review.score, reasons: finalReasons, sources: checkedSources.length, lastVerified: article.lastVerified, timeSensitive: article.timeSensitive };
      run.drafts.push(draftRecord); run.generated += 1;
      await writeJson(`.editorial-output/drafts/${article.slug}.json`, { article, sources: checkedSources, review, deterministicReasons });
      if (status === "approved") approved.push({ article, sources: checkedSources, review }); else run.rejected += 1;
    } catch (error) { run.errors.push({ topic: topic.title, message: String(error.message || error) }); run.rejected += 1; }
  }

  approved.sort((a, b) => b.review.score - a.review.score);
  const selected = approved.find(item => !item.article.timeSensitive) || approved[0];
  run.approved = approved.length;
  if (selected) {
    const record = { title: selected.article.title, slug: selected.article.slug, searchIntent: selected.article.searchIntent, status: "review_ready", qualityScore: selected.review.score, sourceCount: selected.sources.length, lastVerified: selected.article.lastVerified, publicationStatus: "draft_pr", timeSensitive: selected.article.timeSensitive };
    await writeJson(`content/vulture-watch/articles/${selected.article.slug}.json`, selected.article);
    await writeJson(`content/vulture-watch/sources/${selected.article.slug}.sources.json`, { slug: selected.article.slug, retrievedAt: new Date().toISOString(), sources: selected.sources });
    database.articles = [...database.articles.filter(item => item.slug !== record.slug), record];
    run.selectedSlug = record.slug;
    await writeFile("editorial/pr-body.md", `## Vulture Watch editorial candidate\n\n- **Article:** ${record.title}\n- **Quality score:** ${record.qualityScore}/100\n- **Official sources:** ${record.sourceCount}\n- **Last verified:** ${record.lastVerified}\n\nManual editorial approval is required before merge. Review every source claim, price, date, fee, refund statement and cancellation step.\n`, "utf8");
  }
  run.status = run.errors.length ? "completed_with_errors" : "completed";
} catch (error) {
  run.status = "failed"; run.errors.push({ stage: "pipeline", message: String(error.message || error) });
}

await writeJson(databasePath, database);
await writeJson(".editorial-output/run.json", run);
await generateDashboardData(database, run);
if (run.status === "failed") process.exitCode = 1;
