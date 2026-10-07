import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { DUPLICATE_THRESHOLD, MODEL, officialDomainSet } from "./config.mjs";

export const today = () => new Date().toISOString().slice(0, 10);
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export const slugify = value => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
export const tokens = value => new Set(value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(word => word.length > 2));

export function similarity(a, b) {
  const left = tokens(a); const right = tokens(b);
  const intersection = [...left].filter(token => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

export function findDuplicate(candidate, existing) {
  return existing.find(item => similarity(candidate.searchIntent || candidate.title, item.searchIntent || item.title) >= DUPLICATE_THRESHOLD || slugify(candidate.title) === item.slug);
}

export function isOfficialUrl(rawUrl, extraDomains = []) {
  try {
    const host = new URL(rawUrl).hostname.replace(/^www\./, "");
    return [...officialDomainSet, ...extraDomains].some(domain => host === domain || host.endsWith(`.${domain}`));
  } catch { return false; }
}

export async function fetchWithRetry(url, options = {}, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000), headers: { "User-Agent": "CancelVultureEditorialBot/1.0", ...(options.headers || {}) } });
      if (response.ok) return response;
      throw new Error(`${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(750 * attempt);
    }
  }
  throw lastError;
}

function extractOutputText(response) {
  if (response.output_text) return response.output_text;
  for (const item of response.output || []) for (const part of item.content || []) if (part.type === "output_text") return part.text;
  throw new Error("OpenAI response did not contain output text");
}

export async function askOpenAI({ name, schema, prompt, webSearch = false }) {
  if (!process.env.OPENAI_API_KEY) throw new Error("AI generation is disabled because OPENAI_API_KEY is not configured");
  const response = await fetchWithRetry("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      reasoning: { effort: "medium" },
      tools: webSearch ? [{ type: "web_search" }] : undefined,
      input: prompt,
      text: { verbosity: "medium", format: { type: "json_schema", name, strict: true, schema } },
    }),
  });
  return JSON.parse(extractOutputText(await response.json()));
}

const manualRequiredFields = [
  "title", "searchIntent", "summaryAnswer", "currentPrice", "cancellationDifficulty", "numberOfSteps",
  "beforeYouCancelWarnings", "cancellationInstructions", "afterCancellation", "refundInformation",
  "commonProblems", "alternatives", "internalLinks", "sources", "lastVerified", "callToAction",
  "seoTitle", "metaDescription", "faq", "featuredImageBrief", "priceHistory", "renewalWarnings",
  "earlyTerminationFees", "userReportedIssues", "timeSensitive", "effectiveDate",
];

export function validateManualArticle(article, database = { articles: [] }) {
  const errors = [];
  if (!article || typeof article !== "object" || Array.isArray(article)) return ["Article must be a JSON object"];
  for (const field of manualRequiredFields) if (!(field in article)) errors.push(`Missing required field: ${field}`);
  if (!article.title?.trim()) errors.push("Title is required");
  if (/^replace with/i.test(article.title || "") || /^replace-with/i.test(article.slug || "")) errors.push("Template placeholders must be replaced");
  if (!article.searchIntent?.trim()) errors.push("Search intent is required");
  if (!article.summaryAnswer?.trim()) errors.push("Summary answer is required");
  if (!Array.isArray(article.cancellationInstructions) || !article.cancellationInstructions.length) errors.push("At least one cancellation instruction is required");
  if (!Array.isArray(article.sources) || !article.sources.length) errors.push("At least one official source is required");
  for (const source of article.sources || []) {
    if (!isOfficialUrl(source.url)) errors.push(`Source is outside the official-domain registry: ${source.url || "missing URL"}`);
    if (!Array.isArray(source.claims) || !source.claims.length) errors.push(`Source requires extracted claims: ${source.url || "missing URL"}`);
    if ((source.claims || []).some(claim => /^replace this/i.test(claim))) errors.push(`Source claim placeholder must be replaced: ${source.url || "missing URL"}`);
  }
  for (const link of article.internalLinks || []) if (!link.startsWith("/")) errors.push(`Internal link must be root-relative: ${link}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(article.lastVerified || "")) errors.push("lastVerified must be YYYY-MM-DD");
  if (article.timeSensitive && !/^\d{4}-\d{2}-\d{2}$/.test(article.effectiveDate || "")) errors.push("Time-sensitive articles require effectiveDate in YYYY-MM-DD format");
  const candidate = { ...article, slug: slugify(article.slug || article.title) };
  const duplicate = findDuplicate(candidate, (database.articles || []).filter(item => item.slug !== candidate.slug));
  if (duplicate) errors.push(`Overlapping search intent with existing article: ${duplicate.slug}`);
  return errors;
}

export async function readJson(path, fallback) {
  try { return JSON.parse(await readFile(path, "utf8")); } catch { return fallback; }
}

export async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function validateSources(article, topicDomains = []) {
  const checked = [];
  for (const source of article.sources || []) {
    const official = isOfficialUrl(source.url, topicDomains);
    let reachable = false; let status = null; let pageText = "";
    if (official) {
      try {
        const response = await fetchWithRetry(source.url, { method: "GET" }, 2);
        reachable = true; status = response.status;
        pageText = (await response.text()).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase().slice(0, 500000);
      } catch (error) { status = String(error.message || error); }
    }
    const claimChecks = (source.claims || []).map(claim => {
      const claimTokens = [...tokens(claim)].filter(token => token.length > 3);
      const matched = claimTokens.filter(token => pageText.includes(token)).length;
      return { claim, supportedByRetrievedText: reachable && claimTokens.length > 0 && matched / claimTokens.length >= 0.45 };
    });
    checked.push({ ...source, official, reachable, status, retrievedAt: new Date().toISOString(), claimChecks, claimsSupported: claimChecks.length > 0 && claimChecks.every(check => check.supportedByRetrievedText) });
  }
  return checked;
}

export function deterministicReview(article, sources, database) {
  const reasons = [];
  if (findDuplicate(article, database.articles || [])) reasons.push("duplicate_intent");
  if (!sources.length || sources.some(source => !source.official || !source.reachable)) reasons.push("invalid_or_insufficient_official_sources");
  if (sources.some(source => !source.claims?.length)) reasons.push("source_without_extracted_claims");
  if (sources.some(source => !source.claimsSupported)) reasons.push("claim_not_found_in_retrieved_source_text");
  if ((article.internalLinks || []).some(link => !link.startsWith("/"))) reasons.push("broken_internal_link_format");
  if (/\b(I tried|in my experience|we tested|I called)\b/i.test(JSON.stringify(article))) reasons.push("fabricated_experience_risk");
  if (!article.summaryAnswer || !article.cancellationInstructions?.length || !article.refundInformation) reasons.push("missing_required_value");
  if (article.timeSensitive && !/^\d{4}-\d{2}-\d{2}$/.test(article.effectiveDate || "")) reasons.push("missing_effective_date");
  return reasons;
}

export async function generateDashboardData(database, run) {
  const documents = [];
  for (const record of database.articles || []) {
    const document = await readJson(`content/vulture-watch/articles/${record.slug}.json`, null);
    if (document) documents.push(document);
  }
  const payload = `import type { EditorialState } from "./types";\n\nexport const editorialState: EditorialState = ${JSON.stringify({ ...run, articles: database.articles || [], documents }, null, 2)};\n`;
  await writeFile("app/vulture-watch/generated.ts", payload, "utf8");
}
