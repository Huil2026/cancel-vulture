import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { editorialState } from "../generated";

export function generateStaticParams() { return editorialState.documents.map(article => ({ slug: article.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = editorialState.documents.find(item => item.slug === slug);
  return article ? { title: article.seoTitle, description: article.metaDescription } : {};
}

export default async function VultureWatchArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = editorialState.documents.find(item => item.slug === slug);
  if (!article) notFound();
  const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: article.faq.map(item => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
  return <main className="watch-shell article-shell">
    <header className="watch-topbar"><Link className="watch-brand" href="/"><img src="/cancel-vulture-icon.png" alt="" /><span><b>CANCEL</b><strong>VULTURE</strong></span></Link><Link className="watch-back" href="/vulture-watch">← Vulture Watch</Link></header>
    <article className="watch-article">
      <span className="eyebrow">VULTURE WATCH · VERIFIED {article.lastVerified}</span><h1>{article.title}</h1><p className="article-summary">{article.summaryAnswer}</p>
      <div className="article-facts"><div><span>Current price</span><strong>{article.currentPrice || "See official pricing"}</strong></div><div><span>Cancellation difficulty</span><strong>{article.cancellationDifficulty}</strong></div><div><span>Steps</span><strong>{article.numberOfSteps}</strong></div><div><span>Last verified</span><strong>{article.lastVerified}</strong></div></div>
      {article.timeSensitive && <aside className="article-alert"><b>Time-sensitive alert</b><span>Effective date: {article.effectiveDate}</span></aside>}
      <Section title="Before you cancel" items={article.beforeYouCancelWarnings}/><Section title="How to cancel" items={article.cancellationInstructions} ordered/><Section title="What happens next" items={article.afterCancellation}/>
      <section><h2>Refund information</h2><p>{article.refundInformation}</p></section><Section title="Common problems" items={article.commonProblems}/><Section title="Alternatives" items={article.alternatives}/><Section title="Renewal warnings" items={article.renewalWarnings}/>
      <section><h2>Early-termination fees</h2><p>{article.earlyTerminationFees}</p></section>
      <section><h2>Frequently asked questions</h2>{article.faq.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
      <section className="article-sources"><h2>Official sources</h2>{article.sources.map(source => <a href={source.url} key={source.url} target="_blank" rel="noreferrer">{new URL(source.url).hostname} ↗</a>)}</section>
      <aside className="article-cta"><span className="eyebrow">TAKE BACK YOUR MONEY</span><h2>{article.callToAction}</h2><Link className="button primary" href="/">Scan my subscriptions →</Link></aside>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
    </article>
  </main>;
}

function Section({ title, items, ordered = false }: { title: string; items: string[]; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return <section><h2>{title}</h2><Tag>{items.map(item => <li key={item}>{item}</li>)}</Tag></section>;
}

