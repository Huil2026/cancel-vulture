import { readJson, isOfficialUrl } from "./lib.mjs";

const database = await readJson("content/vulture-watch/index.json", { articles: [] });
const slugs = new Set();
const errors = [];
for (const record of database.articles) {
  if (slugs.has(record.slug)) errors.push(`Duplicate slug: ${record.slug}`);
  slugs.add(record.slug);
  const article = await readJson(`content/vulture-watch/articles/${record.slug}.json`, null);
  const sourceRecord = await readJson(`content/vulture-watch/sources/${record.slug}.sources.json`, null);
  if (!article) errors.push(`Missing article: ${record.slug}`);
  if (!sourceRecord?.sources?.length) errors.push(`Missing source ledger: ${record.slug}`);
  for (const source of sourceRecord?.sources || []) if (!isOfficialUrl(source.url)) errors.push(`Non-official source in ${record.slug}: ${source.url}`);
  for (const link of article?.internalLinks || []) if (!link.startsWith("/")) errors.push(`Invalid internal link in ${record.slug}: ${link}`);
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(`Validated ${database.articles.length} Vulture Watch article records.`);

