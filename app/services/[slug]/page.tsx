import Link from "next/link";
import { catalog, currentPrice, freshness } from "../../catalog";

const money = (value: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = catalog.find((item) => item.slug === slug);

  if (!service) {
    return <main className="record-shell"><div className="record-empty"><h1>Service not found.</h1><Link href="/">Return to Cancel Vulture</Link></div></main>;
  }

  const price = currentPrice(service);
  return <main className="record-shell">
    <header className="record-topbar"><Link href="/" className="watch-brand"><img src="/cancel-vulture-icon.png" alt="" /><span><b>CANCEL</b><strong>VULTURE</strong></span></Link><nav><Link href="/">Catalog</Link><Link href="/check-my-area">Check My Area</Link><Link href="/admin/verification-queue">Verification Queue</Link></nav></header>
    <article className="service-record">
      <div className="record-hero"><div><span className="eyebrow">{service.category}</span><h1>{service.name}</h1><p>{service.recommendationReason}</p></div><div className="record-mark" style={{ background: service.color }}>{service.mark}</div></div>

      <section className="record-facts">
        <div><span>Current plan price</span><strong>{price.price === null ? "Not yet verified" : money(price.price, price.currency)}</strong><small>{price.priceType.replaceAll("-", " ")}</small></div>
        <div><span>Region</span><strong>{price.region}</strong><small>{freshness(service)}</small></div>
        <div><span>Cancellation difficulty</span><strong>{service.difficulty}</strong><small>{service.cancellation.estimatedMinutes ? `${service.cancellation.estimatedMinutes} min estimate` : "Time not verified"}</small></div>
        <div><span>Cancellation method</span><strong>{service.cancellation.methodType}</strong><small>{service.cancellation.lastVerifiedAt ? `Checked: ${service.cancellation.lastVerifiedAt}` : "Not yet verified"}</small></div>
      </section>

      {price.price === null && <div className="record-alert"><b>Estimated price — verify with provider</b><span>This catalog does not claim a current price until an official plan, region and source have been recorded.</span></div>}

      <div className="record-grid">
        <section className="record-panel"><span className="eyebrow">PLAN & PRICE RECORD</span>{service.plans.map((plan) => <div className="plan-row" key={plan.id}><div><h2>{plan.name}</h2><p>{plan.description}</p></div><span className={`record-status ${price.verificationStatus.toLowerCase().replaceAll(" ", "-")}`}>{price.verificationStatus}</span></div>)}<dl><div><dt>Price type</dt><dd>{price.priceType}</dd></div><div><dt>Post-promotion</dt><dd>{price.postPromoPrice == null ? "Check current provider rate" : money(price.postPromoPrice, price.currency)}</dd></div><div><dt>Equipment fee</dt><dd>{price.equipmentFee == null ? "Not verified" : money(price.equipmentFee, price.currency)}</dd></div><div><dt>Installation fee</dt><dd>{price.installationFee == null ? "Not verified" : money(price.installationFee, price.currency)}</dd></div><div><dt>Activation fee</dt><dd>{price.activationFee == null ? "Not verified" : money(price.activationFee, price.currency)}</dd></div></dl></section>
        <section className="record-panel"><span className="eyebrow">CANCELLATION RECORD</span><h2>{service.cancellation.verificationStatus === "Verified" ? "Verified method available" : "Not yet verified"}</h2><div className="cancel-flags"><span>Online<b>{service.cancellation.onlineAvailable === null ? "Unknown" : service.cancellation.onlineAvailable ? "Yes" : "No"}</b></span><span>Phone<b>{service.cancellation.phoneRequired === null ? "Unknown" : service.cancellation.phoneRequired ? "Required" : "No"}</b></span><span>Store<b>{service.cancellation.storeRequired === null ? "Unknown" : service.cancellation.storeRequired ? "Required" : "No"}</b></span><span>Equipment return<b>{service.cancellation.equipmentReturnRequired === null ? "Unknown" : service.cancellation.equipmentReturnRequired ? "Possible" : "No"}</b></span><span>Early termination fee<b>{service.cancellation.earlyTerminationFeePossible === null ? "Unknown" : service.cancellation.earlyTerminationFeePossible ? "Possible" : "No"}</b></span></div>{service.cancellation.requiredAccountInfo.length > 0 && <p><b>Have ready:</b> {service.cancellation.requiredAccountInfo.join(", ")}.</p>}</section>
      </div>

      {service.cancellation.steps?.length ? <section className="record-panel record-steps"><span className="eyebrow">VERIFIED STEPS</span><ol>{service.cancellation.steps.map((step) => <li key={step}>{step}</li>)}</ol></section> : <section className="record-panel record-steps"><span className="eyebrow">CANCELLATION STEPS</span><h2>Not yet verified</h2><p>No AI-generated or inferred instructions are shown. Verify the current procedure with the provider.</p></section>}

      <section className="record-panel"><span className="eyebrow">RECOMMENDED ACTIONS</span><div className="action-chips">{service.recommendationActions.map((action) => <span key={action}>{action}</span>)}</div><p>{service.recommendationReason}</p></section>

      <section className="record-panel"><span className="eyebrow">OFFICIAL SOURCES</span>{service.sources.length ? service.sources.map((item) => <a className="source-row" href={item.url} target="_blank" rel="noreferrer" key={item.id}><span><b>{item.title}</b><small>Retrieved {item.retrievedAt} · Official provider source</small></span><strong>Open ↗</strong></a>) : <p>No official source has been recorded yet. This service remains in the verification queue.</p>}{service.officialAvailabilityUrl && <a className="button primary record-button" href={service.officialAvailabilityUrl} target="_blank" rel="noreferrer">Check exact availability with provider ↗</a>}</section>
    </article>
  </main>;
}
