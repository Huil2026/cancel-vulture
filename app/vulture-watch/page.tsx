import Link from "next/link";
import { editorialState } from "./generated";

const prettyDate = (value: string | null) => value ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" }) : "Not run yet";

export default function VultureWatchDashboard() {
  const articles = [...editorialState.articles];
  const drafts = [...editorialState.drafts];
  return (
    <main className="watch-shell">
      <header className="watch-topbar">
        <Link className="watch-brand" href="/"><img src="/cancel-vulture-icon.png" alt="" /><span><b>CANCEL</b><strong>VULTURE</strong></span></Link>
        <Link className="watch-back" href="/">← Wallet audit</Link>
      </header>

      <section className="watch-hero">
        <div><span className="eyebrow">EDITORIAL INTELLIGENCE DESK</span><h1>Vulture Watch.</h1><p>Evidence-backed cancellation guides, fee warnings, price alerts and consumer education—tracked from source to publication.</p></div>
        <div className={`watch-run ${editorialState.status.includes("failed") ? "failed" : "healthy"}`}><span>Pipeline status</span><strong>{editorialState.status.replaceAll("_", " ")}</strong><small>Last run: {prettyDate(editorialState.lastRun)}</small></div>
      </section>

      <section className="watch-dashboard">
        <div className="watch-metrics">
          <article><span>Drafts generated</span><strong>{editorialState.generated}</strong><small>Maximum five per daily run</small></article>
          <article><span>Quality approved</span><strong>{editorialState.approved}</strong><small>Minimum score: 78</small></article>
          <article><span>Rejected</span><strong>{editorialState.rejected}</strong><small>Duplicates and unsupported claims</small></article>
          <article><span>Ready to publish</span><strong>{articles.filter(item => item.publicationStatus === "draft_pr").length}</strong><small>Manual merge approval required</small></article>
        </div>

        <div className="watch-grid">
          <section className="watch-panel watch-queue">
            <div className="watch-heading"><div><span className="eyebrow">TODAY'S QUEUE</span><h2>Editorial review</h2></div><span className="watch-schedule">Daily · 5:15 AM COT</span></div>
            {drafts.length ? drafts.map((draft, index) => <article className="watch-row" key={`${draft.title}-${index}`}>
              <span className={`watch-status ${draft.status}`}>{draft.status.replaceAll("_", " ")}</span>
              <div><strong>{draft.title}</strong><small>{"lastVerified" in draft ? `Verified ${draft.lastVerified}` : "Awaiting verification"}</small></div>
              <div className="watch-score"><b>{draft.qualityScore}</b><span>/100</span></div>
              <span className="watch-source-count">{"sources" in draft ? draft.sources : 0} sources</span>
            </article>) : <div className="watch-empty"><b>The nest is ready.</b><p>The first scheduled run will place up to five researched drafts here. Only the strongest approved article advances to a draft pull request.</p></div>}
          </section>

          <aside className="watch-panel watch-rules">
            <span className="eyebrow">AUTOMATIC GUARDRAILS</span><h2>No source, no story.</h2>
            <ul><li>Official sources prioritized and checked</li><li>Claim-level evidence ledger</li><li>Duplicate search-intent rejection</li><li>Prices and dates must be current</li><li>Broken internal links fail review</li><li>One standard article maximum per run</li><li>Manual approval before initial launch merges</li></ul>
          </aside>
        </div>

        <section className="watch-panel watch-library">
          <div className="watch-heading"><div><span className="eyebrow">CONTENT DATABASE</span><h2>Publication ledger</h2></div><span>{articles.length} records</span></div>
          {articles.length ? articles.map(article => <article className="watch-library-row" key={article.slug}>
            <div><strong>{article.title}</strong><small>/vulture-watch/{article.slug}</small></div><span>{article.sourceCount} official sources</span><span>{article.lastVerified}</span><span className={`watch-status ${article.status}`}>{article.publicationStatus.replaceAll("_", " ")}</span>
          </article>) : <div className="watch-empty compact"><p>No article has cleared the evidence and quality gates yet.</p></div>}
        </section>
      </section>
    </main>
  );
}

