"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { catalog, currentPrice } from "../catalog";

type SearchArea = { country: string; region: string; city: string; postalCode: string; address: string };

export default function CheckMyArea() {
  const [area, setArea] = useState<SearchArea | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setArea({ country: String(form.get("country")), region: String(form.get("region")), city: String(form.get("city")), postalCode: String(form.get("postalCode")), address: String(form.get("address") || "") });
  }

  const providers = catalog.filter((service) => service.serviceType === "connectivity" && service.officialAvailabilityUrl);

  return <main className="area-shell">
    <header className="record-topbar"><Link href="/" className="watch-brand"><img src="/cancel-vulture-icon.png" alt="" /><span><b>CANCEL</b><strong>VULTURE</strong></span></Link><Link href="/">← Back to catalog</Link></header>
    <section className="area-hero"><span className="eyebrow">MVP AVAILABILITY MODULE</span><h1>Check my area.</h1><p>Find official provider checkers for internet and mobile plans. We show likely providers only and never claim exact address eligibility.</p></section>
    <section className="area-layout">
      <form className="area-form" onSubmit={submit}><label>Country<select name="country" defaultValue="US"><option value="US">United States</option><option value="Other">Other</option></select></label><label>State / parish / region<input name="region" required placeholder="e.g. Florida" /></label><label>City / town<input name="city" required placeholder="e.g. Miami" /></label><label>ZIP / postal code<input name="postalCode" required placeholder="e.g. 33101" /></label><label>Address <small>optional</small><input name="address" placeholder="Used only to open provider checkers" /></label><button className="button primary" type="submit">Find likely providers →</button><p>Your inputs stay in this browser and are not sent to Cancel Vulture.</p></form>
      <div className="area-results"><div className="watch-heading"><div><span className="eyebrow">RESULTS</span><h2>{area ? `Likely options near ${area.city}` : "Enter your area"}</h2></div>{area && <span>Official coverage likely · not exact eligibility</span>}</div>{area ? providers.map((provider) => { const price = currentPrice(provider); return <article className="provider-row" key={provider.id}><div className="provider-mark" style={{ background: provider.color }}>{provider.mark}</div><div><h3>{provider.name}</h3><p>{price.price === null ? "Check availability / price varies by location." : `${price.currency} ${price.price} · ${price.priceType}`}</p><span>Confidence: Official coverage likely</span></div><a href={provider.officialAvailabilityUrl} target="_blank" rel="noreferrer">Check exact availability with provider ↗</a></article> }) : <div className="area-empty"><b>No exact eligibility claims.</b><p>Submit a location to see provider-owned availability links.</p></div>}</div>
    </section>
  </main>;
}
