import Link from "next/link";
import { catalog, currentPrice } from "../../catalog";

export default function VerificationQueue() {
  const rows = catalog.map((service) => {
    const price = currentPrice(service);
    const issues = [
      !price.lastVerifiedAt && "Price missing verification date",
      price.verificationStatus === "Conflicting Sources" && "Conflicting price sources",
      service.cancellation.verificationStatus !== "Verified" && "No verified cancellation method",
      service.plans.some((plan) => plan.status === "unknown") && "Plan missing regional data",
      service.sources.length === 0 && "No official source recorded",
    ].filter(Boolean) as string[];
    return { service, price, issues };
  }).filter((row) => row.issues.length > 0);

  const verifiedMethods = catalog.filter((service) => service.cancellation.verificationStatus === "Verified").length;
  const verifiedPrices = catalog.filter((service) => currentPrice(service).verificationStatus === "Verified").length;

  return <main className="queue-shell">
    <header className="record-topbar"><Link href="/" className="watch-brand"><img src="/cancel-vulture-icon.png" alt="" /><span><b>CANCEL</b><strong>VULTURE</strong></span></Link><nav><Link href="/">Catalog</Link><Link href="/check-my-area">Check My Area</Link></nav></header>
    <section className="queue-hero"><div><span className="eyebrow">ADMIN · DATA FRESHNESS</span><h1>Verification Queue.</h1><p>Prices, regional plans and cancellation methods stay unpublished as verified facts until an official source supports them.</p></div><div className="queue-metrics"><article><span>Needs attention</span><strong>{rows.length}</strong></article><article><span>Verified prices</span><strong>{verifiedPrices}</strong></article><article><span>Verified methods</span><strong>{verifiedMethods}</strong></article></div></section>
    <section className="queue-content"><div className="queue-toolbar"><div><b>Freshness rules</b><span>Prices: 30–60 days · Guides: 60–90 days</span></div><div className="status-legend"><span>Draft</span><span>Verified</span><span>Needs Review</span><span>Conflicting Sources</span><span>Outdated</span><span>Archived</span></div></div><div className="queue-table"><div className="queue-row queue-head"><span>Service</span><span>Price status</span><span>Cancellation</span><span>Flags</span><span>Record</span></div>{rows.map(({ service, price, issues }) => <article className="queue-row" key={service.id}><div><b>{service.name}</b><small>{service.category}</small></div><span className={`record-status ${price.verificationStatus.toLowerCase().replaceAll(" ", "-")}`}>{price.verificationStatus}</span><span className={`record-status ${service.cancellation.verificationStatus.toLowerCase().replaceAll(" ", "-")}`}>{service.cancellation.verificationStatus}</span><ul>{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul><Link href={`/services/${service.slug}`}>Review →</Link></article>)}</div></section>
  </main>;
}
