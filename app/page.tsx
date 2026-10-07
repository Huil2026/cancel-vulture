"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Billing, CatalogService, Usage, catalog, categoryOrder, currentPrice, freshness } from "./catalog";

type View = "home" | "select" | "damage" | "usage" | "bones" | "savings" | "hall";

type Subscription = CatalogService & {
  cancelled?: boolean;
  decision?: "keep" | "replace" | "save";
};

const seedSubscriptions: Subscription[] = catalog.map((service) => ({ ...service }));

const views: { id: View; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "select", label: "My Subs", icon: "▣" },
  { id: "damage", label: "Damage", icon: "$" },
  { id: "bones", label: "Pick Bones", icon: "✂" },
  { id: "savings", label: "Savings", icon: "↗" },
  { id: "hall", label: "Hall of Shame", icon: "♛" },
];

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });
const monthlyPrice = (s: Subscription) => {
  const price = currentPrice(s);
  if (price.price === null) return 0;
  return price.billingPeriod === "annual" ? price.price / 12 : price.price;
};

function Logo({ sub }: { sub: Subscription }) {
  return <span className="service-logo" style={{ background: sub.color, color: sub.color === "#fff" || sub.color === "#ffffff" ? "#050505" : "white" }}>{sub.mark}</span>;
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [subs, setSubs] = useState<Subscription[]>(seedSubscriptions);
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [guide, setGuide] = useState<Subscription | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [period, setPeriod] = useState<"Monthly" | "Yearly" | "5 Years" | "10 Years">("Monthly");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = localStorage.getItem("cancel-vulture-subs");
      if (stored) {
        try {
          const saved = JSON.parse(stored) as Array<Partial<Subscription> & { id: string }>;
          setSubs(seedSubscriptions.map((service) => {
            const match = saved.find((item) => item.id === service.id);
            return match ? { ...service, selected: Boolean(match.selected), usage: match.usage ?? service.usage, cancelled: match.cancelled, decision: match.decision } : service;
          }));
        } catch { /* keep current seed data */ }
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("cancel-vulture-subs", JSON.stringify(subs));
  }, [hydrated, subs]);

  const active = useMemo(() => subs.filter(s => s.selected && !s.cancelled), [subs]);
  const cancelled = useMemo(() => subs.filter(s => s.cancelled), [subs]);
  const monthly = active.reduce((sum, s) => sum + monthlyPrice(s), 0);
  const recovered = cancelled.reduce((sum, s) => sum + monthlyPrice(s), 0);
  const lowValue = active.filter(s => s.usage === "Rarely" || s.usage === "Never");
  const lowValueTotal = lowValue.reduce((sum, s) => sum + monthlyPrice(s), 0);
  const survival = Math.max(12, Math.min(94, Math.round(82 - monthly * .28 - lowValue.length * 3 + recovered * .35)));
  const recommendation = [...lowValue].sort((a, b) => monthlyPrice(b) - monthlyPrice(a))[0] || active[0];
  const categories = ["All", ...categoryOrder.filter((item) => subs.some((service) => service.category === item))];
  const filtered = subs.filter(s => (category === "All" || s.category === category) && s.name.toLowerCase().includes(search.toLowerCase()));

  function toggle(id: string) {
    setSubs(current => current.map(s => s.id === id ? { ...s, selected: !s.selected, cancelled: false } : s));
  }

  function setUsage(id: string, usage: Usage) {
    setSubs(current => current.map(s => s.id === id ? { ...s, usage } : s));
  }

  function cancelSub(id: string) {
    setSubs(current => current.map(s => s.id === id ? { ...s, cancelled: true } : s));
    setGuide(null);
    setView("savings");
  }

  function setDecision(id: string, decision: "keep" | "replace" | "save") {
    setSubs(current => current.map(s => s.id === id ? { ...s, decision } : s));
  }

  function addCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "Custom subscription");
    const price = Number(data.get("price") || 0);
    const billing = String(data.get("billing")) as Billing;
    const id = `custom-${Date.now()}`;
    setSubs(current => [...current, {
      id, slug: id, name, category: "Other recurring household services", serviceType: "household", mark: name.slice(0, 2).toUpperCase(), color: "#5c5c5c", usage: "Unsure", difficulty: "Unknown", alternative: "Compare alternatives", selected: true,
      recommendationActions: ["Cancel", "Renegotiate", "Replace"], recommendationReason: "Custom record: verify the bill, contract and cancellation terms directly.",
      plans: [{ id: `${id}-plan`, name: "Custom plan", serviceType: "household", description: "User-entered plan", status: "unknown" }],
      prices: [{ id: `${id}-price`, planId: `${id}-plan`, region: "User supplied", currency: "USD", price, billingPeriod: billing, priceType: "estimate", verificationStatus: "Needs Review" }],
      cancellation: { methodType: "unverified", onlineAvailable: null, phoneRequired: null, storeRequired: null, equipmentReturnRequired: null, earlyTerminationFeePossible: null, requiredAccountInfo: [], verificationStatus: "Draft" },
      sources: [],
    }]);
    setCustomOpen(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("home")} aria-label="Cancel Vulture home">
          <img className="brand-bird" src="/cancel-vulture-icon.png" alt="" />
          <span><b>CANCEL</b><strong>VULTURE</strong></span>
        </button>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {views.map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>{item.label}</button>)}
          <Link href="/check-my-area">Check My Area</Link>
          <Link href="/vulture-watch">Vulture Watch</Link>
        </nav>
        <div className="top-actions"><button className="avatar">WG</button></div>
      </header>

      {view === "home" && <>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">THE SUBSCRIPTION WASTE HUNTER</span>
            <h1>What’s feeding<br />on your <em>wallet?</em></h1>
            <p>Select the subscriptions you pay for. We’ll expose the real cost, spot the waste, and show you what to cut first.</p>
            <div className="hero-actions">
              <button className="button primary" onClick={() => setView("select")}>Scan My Subscriptions <span>→</span></button>
              <button className="button ghost" onClick={() => setView("bones")}>Browse Cancel Guides</button>
            </div>
            <div className="trust-row"><span>✓ No bank connection</span><span>✓ Your data stays local</span><span>✓ Free to use</span></div>
          </div>
          <div className="hero-art" aria-label="Cancel Vulture brand artwork">
            <img src="/cancel-vulture-wide-hero.png" alt="Cancel Vulture chasing away overpriced subscription characters" />
            <div className="slash slash-one" /><div className="slash slash-two" />
          </div>
        </section>

        <section className="dashboard-wrap">
          <div className="section-heading"><div><span className="eyebrow">YOUR WALLET REPORT</span><h2>Here’s the damage.</h2></div><button className="text-button" onClick={() => setView("damage")}>Full breakdown →</button></div>
          <div className="stats-grid">
            <article className="stat-card danger"><span>Monthly drain</span><strong>{money(monthly)}</strong><small>{active.length} active subscriptions</small><div className="spark"><i/><i/><i/><i/><i/><i/></div></article>
            <article className="stat-card"><span>Yearly damage</span><strong>{money(monthly * 12)}</strong><small>That’s {money(monthly * 120)} over 10 years</small></article>
            <article className="stat-card score-card"><div className="score-ring" style={{ "--score": `${survival * 3.6}deg` } as React.CSSProperties}><b>{survival}</b></div><div><span>Wallet survival score</span><strong>{survival < 60 ? "Needs attention" : "Stable"}</strong><small>Educational estimate</small></div></article>
            <article className="stat-card success"><span>Money recovered</span><strong>{money(recovered)}</strong><small>{cancelled.length} subscriptions cancelled</small></article>
          </div>

          <div className="action-grid">
            <article className="hunt-card">
              <div><span className="eyebrow">VULTURE’S TOP PICK</span><h3>{recommendation?.name || "Start your audit"}</h3><p>{recommendation ? `${money(monthlyPrice(recommendation))}/month · ${recommendation.usage.toLowerCase()} used` : "Add subscriptions to get a recommendation."}</p></div>
              {recommendation && <><Logo sub={recommendation}/><button className="button yellow" onClick={() => { setGuide(recommendation); setView("bones"); }}>Pick this bone →</button></>}
            </article>
            <article className="waste-card"><div className="scissors">✂</div><div><span className="eyebrow">LOW-VALUE SPEND</span><h3>{money(lowValueTotal)} <small>/ month</small></h3><p>is going to subscriptions you rarely or never use.</p></div><button className="button green" onClick={() => setView("usage")}>Review usage</button></article>
            <article className="shame-card"><span className="eyebrow">HALL OF SHAME</span><h3>Hardest to cancel</h3>{["Adobe", "Planet Fitness", "Amazon Prime"].map((name, i) => <div className="rank" key={name}><b>{i + 1}</b><span>{name}<small>{i === 0 ? "Nightmare" : "Difficult"}</small></span><i>{[18, 24, 12][i]} min</i></div>)}<button className="text-button shame-link" onClick={() => setView("hall")}>See the full ranking →</button></article>
          </div>

          <section className="brand-story">
            <div className="story-mark">CV</div>
            <div><span className="eyebrow">THE CONSUMER WATCHDOG FOR RECURRING SPEND</span><h2>We pick apart the waste.<br /><em>You keep the money.</em></h2></div>
            <p>Cancel Vulture is your bold, witty guide to taking back control of subscriptions. We expose what you don’t use, show the long-term damage, and help you decide what to cut—without asking for bank credentials.</p>
          </section>
        </section>
      </>}

      {view === "select" && <section className="workspace">
        <div className="workspace-head"><div><span className="eyebrow">STEP 1 OF 4 · SCAN YOUR SUBS</span><h1>What’s picking at your wallet?</h1><p>Select everything you currently pay for. Unverified prices remain clearly labeled and contribute $0 until you enter or verify them.</p></div><div className="drain-pill"><span>Known monthly drain</span><strong>{money(monthly)}</strong></div></div>
        <a className="area-callout" href="/check-my-area"><span>⌖</span><div><b>Internet or mobile bill?</b><small>Check likely providers by area without claiming exact address eligibility.</small></div><strong>Check My Area →</strong></a>
        <div className="toolbar"><label className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subscriptions…" /></label><button className="button ghost compact" onClick={() => setCustomOpen(true)}>+ Add custom</button></div>
        <div className="category-tabs">{categories.map(c => <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{c}</button>)}</div>
        <div className="subscription-grid">{filtered.map(sub => { const price = currentPrice(sub); return <article key={sub.id} className={`sub-card ${sub.selected && !sub.cancelled ? "selected" : ""}`}><button className="sub-toggle" onClick={() => toggle(sub.id)} aria-label={`${sub.selected ? "Remove" : "Add"} ${sub.name}`}><Logo sub={sub}/><span className="sub-info"><b>{sub.name}</b><small>{sub.category} · {price.region}</small></span><span className="sub-price">{price.price === null ? "Verify" : money(monthlyPrice(sub))}<small>{price.price === null ? "price" : "/mo est."}</small></span><i className="check">✓</i></button><a href={`/services/${sub.slug}`}>Details →</a></article> })}</div>
        <div className="sticky-total"><div><span>{active.length} subscriptions selected</span><strong>{money(monthly)} <small>/ month</small></strong></div><button className="button primary" disabled={!active.length} onClick={() => setView("damage")}>See My Damage →</button></div>
      </section>}

      {view === "damage" && <section className="workspace narrow">
        <div className="workspace-head"><div><span className="eyebrow">STEP 2 OF 4 · SEE THE DAMAGE</span><h1>Small charges. Big damage.</h1><p>These are estimates based on the prices you selected.</p></div></div>
        <div className="period-tabs">{(["Monthly", "Yearly", "5 Years", "10 Years"] as const).map(p => <button key={p} onClick={() => setPeriod(p)} className={period === p ? "active" : ""}>{p}</button>)}</div>
        <div className="damage-hero"><span>{period} subscription cost</span><strong>{money(monthly * ({ Monthly: 1, Yearly: 12, "5 Years": 60, "10 Years": 120 }[period]))}</strong><p>Across {active.length} active subscriptions</p><div className="damage-bars">{active.slice(0, 8).map(s => <div key={s.id} style={{ height: `${Math.max(16, monthlyPrice(s) / Math.max(...active.map(monthlyPrice)) * 100)}%`, background: s.color }} title={s.name}/>)}</div></div>
        <div className="breakdown-grid"><article className="panel"><span className="eyebrow">WHERE IT GOES</span><h3>Category breakdown</h3>{Array.from(new Set(active.map(s => s.category))).map(cat => { const val = active.filter(s => s.category === cat).reduce((n,s) => n + monthlyPrice(s), 0); return <div className="category-row" key={cat}><span>{cat}</span><div><i style={{ width: `${monthly ? val / monthly * 100 : 0}%` }}/></div><b>{money(val)}</b></div> })}</article><article className="panel cost-stack"><span className="eyebrow">THE LONG VIEW</span><div><span>1 year</span><b>{money(monthly * 12)}</b></div><div><span>5 years</span><b>{money(monthly * 60)}</b></div><div><span>10 years</span><b>{money(monthly * 120)}</b></div><p>Imagine what else that money could do.</p></article></div>
        <div className="next-row"><button className="button ghost" onClick={() => setView("select")}>← Edit subscriptions</button><button className="button primary" onClick={() => setView("usage")}>Pick the Bones →</button></div>
      </section>}

      {view === "usage" && <section className="workspace narrow">
        <div className="workspace-head"><div><span className="eyebrow">STEP 3 OF 4 · USAGE CHECK</span><h1>Are you actually using these?</h1><p>Be ruthless. Honest answers make your cancel list smarter.</p></div><div className="drain-pill warning"><span>Rarely or never used</span><strong>{money(lowValueTotal)}/mo</strong></div></div>
        <div className="usage-list">{active.map(sub => <article key={sub.id} className="usage-row"><Logo sub={sub}/><div className="usage-name"><b>{sub.name}</b><small>{money(monthlyPrice(sub))}/month</small></div><div className="usage-options">{(["Daily", "Weekly", "Monthly", "Rarely", "Never", "Unsure"] as Usage[]).map(u => <button key={u} className={sub.usage === u ? `active ${u.toLowerCase()}` : ""} onClick={() => setUsage(sub.id, u)}>{u}</button>)}</div></article>)}</div>
        <div className="insight-banner"><span>⚡</span><p>You’re paying <strong>{money(lowValueTotal * 12)} per year</strong> for subscriptions you barely use.</p></div>
        <div className="next-row"><button className="button ghost" onClick={() => setView("damage")}>← Back</button><button className="button primary" onClick={() => setView("bones")}>Show Me What to Cancel →</button></div>
      </section>}

      {view === "bones" && <section className="workspace narrow">
        <div className="workspace-head"><div><span className="eyebrow">STEP 4 OF 4 · YOUR CANCEL LIST</span><h1>Pick the bones.</h1><p>Recommendations are based on cost, usage, replacement options, and cancellation friction.</p></div><div className="drain-pill good"><span>Potential monthly savings</span><strong>{money(lowValueTotal)}</strong></div></div>
        <div className="cancel-list">{[...active].sort((a,b) => ((b.usage === "Never" ? 2 : b.usage === "Rarely" ? 1 : 0) * monthlyPrice(b)) - ((a.usage === "Never" ? 2 : a.usage === "Rarely" ? 1 : 0) * monthlyPrice(a))).map((sub, index) => <article className={`cancel-card ${sub.decision ? "decided" : ""}`} key={sub.id}><span className="priority">#{index + 1}</span><Logo sub={sub}/><div className="cancel-main"><div><h3>{sub.name}</h3><span className={`difficulty ${sub.difficulty.toLowerCase()}`}>{sub.difficulty}{sub.cancellation.estimatedMinutes ? ` · ${sub.cancellation.estimatedMinutes} min` : ""}</span>{sub.decision && <span className="decision-chip">{sub.decision}</span>}</div><p>{sub.recommendationReason}</p><div className="alternative"><span>Better picking</span><b>{sub.alternative}</b></div><div className="decision-actions">{sub.recommendationActions.slice(0, 3).map((action, actionIndex) => <button key={action} onClick={() => setDecision(sub.id, actionIndex === 0 ? "keep" : actionIndex === 1 ? "replace" : "save")}>{action}</button>)}</div></div><div className="cancel-money"><span>Potential recovery</span><strong>{monthlyPrice(sub) ? money(monthlyPrice(sub) * 12) : "Verify price"}<small>{monthlyPrice(sub) ? "/yr" : ""}</small></strong><button className="button yellow compact" onClick={() => setGuide(sub)}>Open guide →</button></div></article>)}</div>
      </section>}

      {view === "hall" && <section className="workspace narrow hall-view">
        <div className="workspace-head"><div><span className="eyebrow">THE COMPANIES THAT MAKE LEAVING HARDER THAN JOINING</span><h1>Hall of Shame.</h1><p>Rankings combine cancellation steps, estimated time, online availability, retention pressure, and community reports. Examples remain estimates until independently verified.</p></div><div className="shame-seal"><b>CV</b><span>WATCHLIST</span></div></div>
        <div className="hall-feature"><div className="mug-lines"><span>7&#39;0”</span><span>6&#39;0”</span><span>5&#39;0”</span><span>4&#39;0”</span><span>3&#39;0”</span></div><div className="hall-copy"><span className="eyebrow">CURRENT #1</span><h2>Adobe Creative Cloud</h2><p>Multiple plan types, retention screens, and contract details can create friction. Always review the current official terms before acting.</p><div className="vulture-score"><b>18</b><span>Vulture Score<small>Nightmare</small></span></div></div></div>
        <div className="hall-table"><div className="hall-row hall-head"><span>Rank</span><span>Company</span><span>Vulture Score</span><span>Difficulty</span><span>Est. time</span></div>{[
          ["1", "Adobe Creative Cloud", "18", "Nightmare", "20 min"],
          ["2", "Planet Fitness", "24", "Difficult", "25 min"],
          ["3", "Amazon Prime", "38", "Difficult", "12 min"],
          ["4", "Max", "54", "Annoying", "9 min"],
          ["5", "Hulu", "58", "Annoying", "10 min"],
        ].map(row => <div className="hall-row" key={row[0]}>{row.map((cell, i) => <span key={cell} data-label={["Rank","Company","Score","Difficulty","Time"][i]}>{cell}</span>)}</div>)}</div>
        <div className="method-note"><b>How the ranking works</b><p>Lower scores indicate more cancellation friction. Rankings are educational, region-dependent, and should be updated whenever official processes change.</p></div>
      </section>}

      {view === "savings" && <section className="workspace narrow savings-view">
        <span className="success-crown">♛</span><span className="eyebrow">ONE LESS SUBSCRIPTION PICKING AT YOUR WALLET</span><h1>You took back <em>{money(recovered * 12)}</em> per year.</h1><p>Nice work. Your savings are stored on this device and update whenever you cut another subscription.</p>
        <div className="savings-cards"><article><span>Monthly recovered</span><strong>{money(recovered)}</strong></article><article><span>Five-year projection</span><strong>{money(recovered * 60)}</strong></article><article><span>Subscriptions cut</span><strong>{cancelled.length}</strong></article><article><span>Wallet score</span><strong>{survival}</strong></article></div>
        <div className="progress-panel"><div><span>Financial freedom streak</span><b>{cancelled.length ? 12 : 0} days</b></div><div className="progress-track"><i style={{ width: `${Math.min(100, recovered / 100 * 100)}%` }}/></div><p>Cancel {money(Math.max(0, 100 - recovered))}/month more to reach your first $100 monthly recovery goal.</p></div>
        <button className="button primary" onClick={() => setView("bones")}>Keep Picking the Bones →</button>
      </section>}

      {guide && <div className="modal-backdrop" role="presentation" onMouseDown={() => setGuide(null)}><section className="guide-modal" role="dialog" aria-modal="true" aria-label={`${guide.name} cancellation guide`} onMouseDown={e => e.stopPropagation()}><button className="modal-close" onClick={() => setGuide(null)}>×</button><div className="guide-title"><Logo sub={guide}/><div><span className="eyebrow">CANCELLATION GUIDE</span><h2>Cancel {guide.name}</h2></div></div><div className={`verification ${guide.cancellation.verificationStatus !== "Verified" ? "pending" : ""}`}><span>{guide.cancellation.verificationStatus === "Verified" ? "✓ Official method verified" : "! Not yet verified"}</span><span>{guide.cancellation.lastVerifiedAt ? `Checked: ${guide.cancellation.lastVerifiedAt}` : freshness(guide)}</span></div><div className="warning-box"><b>Method: {guide.cancellation.methodType}</b><p>{guide.cancellation.billingPlatformException || "Plan, region and billing platform can change the available cancellation path."}</p><div className="method-flags"><span>Online: {guide.cancellation.onlineAvailable === null ? "Unknown" : guide.cancellation.onlineAvailable ? "Yes" : "No"}</span><span>Phone: {guide.cancellation.phoneRequired === null ? "Unknown" : guide.cancellation.phoneRequired ? "Required" : "Not required"}</span><span>Equipment return: {guide.cancellation.equipmentReturnRequired === null ? "Unknown" : guide.cancellation.equipmentReturnRequired ? "May apply" : "No"}</span></div></div>{guide.cancellation.steps?.length ? <ol className="steps">{guide.cancellation.steps.map((step, index) => <li key={step}><b>Step {index + 1}</b><span>{step}</span></li>)}</ol> : <div className="unverified-guide"><b>Cancellation instructions are not yet verified.</b><p>Cancel Vulture will not invent steps. Use the official provider page and save written confirmation.</p></div>}{guide.cancellation.cancelUrl && <a className="official-link" href={guide.cancellation.cancelUrl} target="_blank" rel="noreferrer">Open official source ↗</a>}<p className="guide-note">Cancellation flows change. Verify every step, fee, timing rule and equipment obligation on the provider’s official site before acting.</p><div className="guide-actions"><a className="button ghost" href={`/services/${guide.slug}`}>View service record</a><button className="button primary" onClick={() => cancelSub(guide.id)}>Mark as Cancelled ✓</button></div></section></div>}

      {customOpen && <div className="modal-backdrop" onMouseDown={() => setCustomOpen(false)}><form className="custom-modal" onSubmit={addCustom} onMouseDown={e => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => setCustomOpen(false)}>×</button><span className="eyebrow">ADD A MISSING SUBSCRIPTION</span><h2>Custom subscription</h2><label>Name<input required name="name" placeholder="e.g. Local gym" /></label><label>Price<input required min="0" step="0.01" name="price" type="number" placeholder="19.99" /></label><label>Billing period<select name="billing"><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label><button className="button primary" type="submit">Add to my subscriptions</button></form></div>}

      <nav className="mobile-nav" aria-label="Mobile navigation">{views.map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><b>{item.icon}</b><span>{item.label}</span></button>)}<Link href="/vulture-watch"><b>!</b><span>Watch</span></Link></nav>
      <footer><div className="footer-brand"><b>♛ CANCEL VULTURE</b><span>Pick apart your subscriptions. Take back your money.</span></div><div><span>Estimates only · Not financial advice · Prices vary by plan and region</span><b>cancelvulture.net</b></div></footer>
    </main>
  );
}
