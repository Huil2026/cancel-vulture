import { articleSchema, reviewSchema } from "./schemas.mjs";
import { askOpenAI, deterministicReview, generateDashboardData, isOfficialUrl, readJson, slugify, today, validateSources, writeJson } from "./lib.mjs";

if (!process.env.OPENAI_API_KEY) {
  console.log("OPENAI_API_KEY is not set. AI price-alert drafting was skipped; use the manual article workflow instead.");
  process.exit(0);
}

const officialUrl = process.env.ALERT_OFFICIAL_URL;
const effectiveDate = process.env.ALERT_EFFECTIVE_DATE;
const company = process.env.ALERT_COMPANY;
if (!officialUrl || !effectiveDate || !company) throw new Error("ALERT_COMPANY, ALERT_OFFICIAL_URL and ALERT_EFFECTIVE_DATE are required");
if (!isOfficialUrl(officialUrl)) throw new Error("Price alert source is not in the official-domain registry");
if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) throw new Error("Effective date must be YYYY-MM-DD");

const databasePath = "content/vulture-watch/index.json";
const database = await readJson(databasePath, { articles: [] });
const article = await askOpenAI({ name: "vulture_watch_price_alert", schema: articleSchema, webSearch: true, prompt: `Create a time-sensitive Cancel Vulture price-change alert for ${company}. The required primary official source is ${officialUrl}; the confirmed effective date is ${effectiveDate}. Use official sources only. Extract every price/date claim under its source. Set timeSensitive true, effectiveDate ${effectiveDate}, and lastVerified ${today()}. If the source does not support the change, mark manual verification required and do not guess.` });
article.slug = slugify(article.slug || article.title);
const sources = await validateSources(article);
const deterministicReasons = deterministicReview(article, sources, database);
const review = await askOpenAI({ name: "vulture_watch_alert_review", schema: reviewSchema, prompt: `Strictly review this price alert. It may proceed only if the official source explicitly supports the new price and effective date. ARTICLE: ${JSON.stringify(article)} SOURCES: ${JSON.stringify(sources)} FAILURES: ${JSON.stringify(deterministicReasons)}` });
if (!review.approved || review.manualVerificationRequired || deterministicReasons.length) throw new Error(`Alert rejected: ${[...deterministicReasons, ...review.reasons].join(", ")}`);
const record = { title: article.title, slug: article.slug, searchIntent: article.searchIntent, status: "expedited_review", qualityScore: review.score, sourceCount: sources.length, lastVerified: article.lastVerified, publicationStatus: "draft_pr", timeSensitive: true, effectiveDate };
await writeJson(`content/vulture-watch/articles/${article.slug}.json`, article);
await writeJson(`content/vulture-watch/sources/${article.slug}.sources.json`, { slug: article.slug, retrievedAt: new Date().toISOString(), sources });
database.articles = [...database.articles.filter(item => item.slug !== record.slug), record];
await writeJson(databasePath, database);
await writeJson(".editorial-output/run.json", { lastRun: new Date().toISOString(), status: "alert_ready", generated: 1, approved: 1, rejected: 0, selectedSlug: article.slug, drafts: [record], errors: [] });
await generateDashboardData(database, { lastRun: new Date().toISOString(), status: "alert_ready", generated: 1, approved: 1, rejected: 0, selectedSlug: article.slug, drafts: [record], errors: [] });

