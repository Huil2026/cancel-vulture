"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Usage = "Daily" | "Weekly" | "Monthly" | "Rarely" | "Never" | "Unsure";
type Billing = "monthly" | "annual";
type View = "home" | "select" | "damage" | "usage" | "bones" | "savings";

type Subscription = {
  id: string;
  name: string;
  category: string;
  price: number;
  billing: Billing;
  mark: string;
  color: string;
  usage: Usage;
  difficulty: "Easy" | "Medium" | "Hard";
  minutes: number;
  alternative: string;
  selected: boolean;
  cancelled?: boolean;
};

const seedSubscriptions: Subscription[] = [
  { id: "netflix", name: "Netflix", category: "Streaming", price: 15.49, billing: "monthly", mark: "N", color: "#e50914", usage: "Monthly", difficulty: "Easy", minutes: 6, alternative: "Tubi · Free", selected: true },
  { id: "spotify", name: "Spotify", category: "Music", price: 11.99, billing: "monthly", mark: "S", color: "#1ed760", usage: "Daily", difficulty: "Easy", minutes: 5, alternative: "Spotify Free", selected: true },
  { id: "adobe", name: "Adobe Creative Cloud", category: "Software", price: 22.99, billing: "monthly", mark: "A", color: "#ff3c2e", usage: "Rarely", difficulty: "Hard", minutes: 20, alternative: "Photopea · Free", selected: true },
  { id: "chatgpt", name: "ChatGPT Plus", category: "AI tools", price: 20, billing: "monthly", mark: "✦", color: "#10a37f", usage: "Weekly", difficulty: "Easy", minutes: 4, alternative: "Free plan", selected: true },
  { id: "disney", name: "Disney+", category: "Streaming", price: 11.99, billing: "monthly", mark: "D+", color: "#1769e0", usage: "Never", difficulty: "Easy", minutes: 4, alternative: "Rotate seasonally", selected: true },
  { id: "prime", name: "Amazon Prime", category: "Streaming", price: 14.99, billing: "monthly", mark: "a", color: "#00a8e1", usage: "Monthly", difficulty: "Medium", minutes: 12, alternative: "Prime Video only", selected: false },
  { id: "youtube", name: "YouTube Premium", category: "Streaming", price: 13.99, billing: "monthly", mark: "▶", color: "#ff0000", usage: "Weekly", difficulty: "Medium", minutes: 10, alternative: "YouTube Free", selected: false },
  { id: "planet", name: "Planet Fitness", category: "Fitness", price: 24.99, billing: "monthly", mark: "PF", color: "#7d2cb7", usage: "Never", difficulty: "Hard", minutes: 25, alternative: "Nike Training Club", selected: true },
  { id: "max", name: "Max", category: "Streaming", price: 16.99, billing: "monthly", mark: "M", color: "#6824d6", usage: "Rarely", difficulty: "Medium", minutes: 9, alternative: "Rotate seasonally", selected: false },
  { id: "hulu", name: "Hulu", category: "Streaming", price: 9.99, billing: "monthly", mark: "h", color: "#1ce783", usage: "Monthly", difficulty: "Medium", minutes: 10, alternative: "Tubi · Free", selected: false },
  { id: "claude", name: "Claude Pro", category: "AI tools", price: 20, billing: "monthly", mark: "C", color: "#d97757", usage: "Weekly", difficulty: "Easy", minutes: 4, alternative: "Free plan", selected: false },
  { id: "midjourney", name: "Midjourney", category: "AI tools", price: 10, billing: "monthly", mark: "MJ", color: "#fff", usage: "Rarely", difficulty: "Easy", minutes: 5, alternative: "Free image tools", selected: false },
  { id: "m365", name: "Microsoft 365", category: "Software", price: 99.99, billing: "annual", mark: "M", color: "#f35325", usage: "Weekly", difficulty: "Medium", minutes: 10, alternative: "LibreOffice · Free", selected: false },
  { id: "canva", name: "Canva Pro", category: "Software", price: 14.99, billing: "monthly", mark: "C", color: "#7d2ae8", usage: "Monthly", difficulty: "Easy", minutes: 5, alternative: "Canva Free", selected: false },
  { id: "dropbox", name: "Dropbox Plus", category: "Cloud", price: 11.99, billing: "monthly", mark: "◇", color: "#0061ff", usage: "Rarely", difficulty: "Easy", minutes: 6, alternative: "Google Drive Free", selected: false },
  { id: "notion", name: "Notion Plus", category: "Productivity", price: 10, billing: "monthly", mark: "N", color: "#ffffff", usage: "Daily", difficulty: "Easy", minutes: 4, alternative: "Notion Free", selected: false },
  { id: "xbox", name: "Xbox Game Pass", category: "Gaming", price: 19.99, billing: "monthly", mark: "X", color: "#107c10", usage: "Weekly", difficulty: "Easy", minutes: 5, alternative: "Pause between games", selected: false },
  { id: "peloton", name: "Peloton App+", category: "Fitness", price: 24, billing: "monthly", mark: "P", color: "#e21a2d", usage: "Rarely", difficulty: "Easy", minutes: 5, alternative: "Nike Training Club", selected: false },
  { id: "audible", name: "Audible", category: "Education", price: 14.95, billing: "monthly", mark: "A", color: "#f7991c", usage: "Monthly", difficulty: "Medium", minutes: 12, alternative: "Libby · Free", selected: false },
  { id: "linkedin", name: "LinkedIn Premium", category: "Productivity", price: 39.99, billing: "monthly", mark: "in", color: "#0a66c2", usage: "Rarely", difficulty: "Medium", minutes: 8, alternative: "LinkedIn Free", selected: false },
];

const views: { id: View; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "select", label: "My Subs", icon: "▣" },
  { id: "damage", label: "Damage", icon: "$" },
  { id: "bones", label: "Pick Bones", icon: "✂" },
  { id: "savings", label: "Savings", icon: "↗" },
];

const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });
const monthlyPrice = (s: Subscription) => s.billing === "annual" ? s.price / 12 : s.price;

function Logo({ sub }: { sub: Subscription }) {
  return <span className="service-logo" style={{ background: sub.color, color: sub.color === "#fff" || sub.color === "#ffffff" ? "#050505" : "white" }}>{sub.mark}</span>;
}

export default function Home() {
  const [view, setView] = useState<View>("home");
  const [subs, setSubs] = useState<Subscription[]>(seedSubscriptions);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [guide, setGuide] = useState<Subscription | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [period, setPeriod] = useState<"Monthly" | "Yearly" | "5 Years" | "10 Years">("Monthly");

  useEffect(() => {
    const stored = localStorage.getItem("cancel-vulture-subs");
    if (stored) {
      try { setSubs(JSON.parse(stored)); } catch { /* keep seed data */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cancel-vulture-subs", JSON.stringify(subs));
    setSaved(true);
    const timer = setTimeout(() => setSaved(false), 1200);
    return () => clearTimeout(timer);
  }, [subs]);

  const active = useMemo(() => subs.filter(s => s.selected && !s.cancelled), [subs]);
  const cancelled = useMemo(() => subs.filter(s => s.cancelled), [subs]);
  const monthly = active.reduce((sum, s) => sum + monthlyPrice(s), 0);
  const recovered = cancelled.reduce((sum, s) => sum + monthlyPrice(s), 0);
  const lowValue = active.filter(s => s.usage === "Rarely" || s.usage === "Never");
  const lowValueTotal = lowValue.reduce((sum, s) => sum + monthlyPrice(s), 0);
  const survival = Math.max(12, Math.min(94, Math.round(82 - monthly * .28 - lowValue.length * 3 + recovered * .35)));
  const recommendation = [...lowValue].sort((a, b) => monthlyPrice(b) - monthlyPrice(a))[0] || active[0];
  const categories = ["All", ...Array.from(new Set(subs.map(s => s.category)))];
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

  function addCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "Custom subscription");
    const price = Number(data.get("price") || 0);
    const billing = String(data.get("billing")) as Billing;
    setSubs(current => [...current, { id: `custom-${Date.now()}`, name, price, billing, category: "Other", mark: name.slice(0, 2).toUpperCase(), color: "#5c5c5c", usage: "Unsure", difficulty: "Medium", minutes: 10, alternative: "Compare free plans", selected: true }]);
    setCustomOpen(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView("home")} aria-label="Cancel Vulture home">
          <span className="brand-bird">♛</span>
          <span><b>CANCEL</b><strong>VULTURE</strong></span>
        </button>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {views.map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}>{item.label}</button>)}
        </nav>
        <div className="top-actions"><span className={saved ? "save-dot show" : "save-dot"}>Saved</span><button className="avatar">WG</button></div>
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
            <img src="/cancel-vulture-brand.png" alt="The crowned Cancel Vulture mascot holding a wallet report" />
            <div className="hero-stat"><span>MONTHLY DRAIN</span><strong>{money(monthly)}</strong><small>{money(monthly * 12)} per year</small></div>
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
            <article className="shame-card"><span className="eyebrow">HALL OF SHAME</span><h3>Hardest to cancel</h3>{["Adobe", "Planet Fitness", "Amazon Prime"].map((name, i) => <div className="rank" key={name}><b>{i + 1}</b><span>{name}<small>{i === 0 ? "Nightmare" : "Difficult"}</small></span><i>{[18, 24, 12][i]} min</i></div>)}</article>
          </div>
        </section>
      </>}

      {view === "select" && <section className="workspace">
        <div className="workspace-head"><div><span className="eyebrow">STEP 1 OF 4 · SCAN YOUR SUBS</span><h1>What’s picking at your wallet?</h1><p>Select everything you currently pay for. Prices are editable estimates.</p></div><div className="drain-pill"><span>Current monthly drain</span><strong>{money(monthly)}</strong></div></div>
        <div className="toolbar"><label className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subscriptions…" /></label><button className="button ghost compact" onClick={() => setCustomOpen(true)}>+ Add custom</button></div>
        <div className="category-tabs">{categories.map(c => <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{c}</button>)}</div>
        <div className="subscription-grid">{filtered.map(sub => <button key={sub.id} className={`sub-card ${sub.selected && !sub.cancelled ? "selected" : ""}`} onClick={() => toggle(sub.id)}><Logo sub={sub}/><span className="sub-info"><b>{sub.name}</b><small>{sub.category} · {sub.billing}</small></span><span className="sub-price">{money(monthlyPrice(sub))}<small>/mo</small></span><i className="check">✓</i></button>)}</div>
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
        <div className="cancel-list">{[...active].sort((a,b) => ((b.usage === "Never" ? 2 : b.usage === "Rarely" ? 1 : 0) * monthlyPrice(b)) - ((a.usage === "Never" ? 2 : a.usage === "Rarely" ? 1 : 0) * monthlyPrice(a))).map((sub, index) => <article className="cancel-card" key={sub.id}><span className="priority">#{index + 1}</span><Logo sub={sub}/><div className="cancel-main"><div><h3>{sub.name}</h3><span className={`difficulty ${sub.difficulty.toLowerCase()}`}>{sub.difficulty} · {sub.minutes} min</span></div><p>{sub.usage === "Never" || sub.usage === "Rarely" ? `Recommended because it costs ${money(monthlyPrice(sub))} monthly and is marked “${sub.usage}.”` : `You use this ${sub.usage.toLowerCase()}. Review before cancelling.`}</p><div className="alternative"><span>Better picking</span><b>{sub.alternative}</b></div></div><div className="cancel-money"><span>Save yearly</span><strong>{money(monthlyPrice(sub) * 12)}</strong><button className="button yellow compact" onClick={() => setGuide(sub)}>Open guide →</button></div></article>)}</div>
      </section>}

      {view === "savings" && <section className="workspace narrow savings-view">
        <span className="success-crown">♛</span><span className="eyebrow">ONE LESS SUBSCRIPTION PICKING AT YOUR WALLET</span><h1>You took back <em>{money(recovered * 12)}</em> per year.</h1><p>Nice work. Your savings are stored on this device and update whenever you cut another subscription.</p>
        <div className="savings-cards"><article><span>Monthly recovered</span><strong>{money(recovered)}</strong></article><article><span>Five-year projection</span><strong>{money(recovered * 60)}</strong></article><article><span>Subscriptions cut</span><strong>{cancelled.length}</strong></article><article><span>Wallet score</span><strong>{survival}</strong></article></div>
        <div className="progress-panel"><div><span>Financial freedom streak</span><b>{cancelled.length ? 12 : 0} days</b></div><div className="progress-track"><i style={{ width: `${Math.min(100, recovered / 100 * 100)}%` }}/></div><p>Cancel {money(Math.max(0, 100 - recovered))}/month more to reach your first $100 monthly recovery goal.</p></div>
        <button className="button primary" onClick={() => setView("bones")}>Keep Picking the Bones →</button>
      </section>}

      {guide && <div className="modal-backdrop" role="presentation" onMouseDown={() => setGuide(null)}><section className="guide-modal" role="dialog" aria-modal="true" aria-label={`${guide.name} cancellation guide`} onMouseDown={e => e.stopPropagation()}><button className="modal-close" onClick={() => setGuide(null)}>×</button><div className="guide-title"><Logo sub={guide}/><div><span className="eyebrow">CANCELLATION GUIDE</span><h2>Cancel {guide.name}</h2></div></div><div className="verification"><span>✓ Community-confirmed template</span><span>Estimated time: {guide.minutes} min</span></div><div className="warning-box"><b>Choose where you subscribed</b><p>Cancellation steps differ by billing platform.</p><div className="billing-choices"><button className="active">Direct website</button><button>Apple App Store</button><button>Google Play</button></div></div><ol className="steps"><li><b>Open the official account or billing page.</b><span>Sign in directly and locate Account, Plan, or Membership settings.</span></li><li><b>Find “Manage subscription”.</b><span>Check the active plan and renewal date before continuing.</span></li><li><b>Choose Cancel and review the confirmation.</b><span>Save a screenshot or email receipt. Exact instructions require official verification.</span></li></ol><p className="guide-note">Cancellation flows change. Verify every step on the provider’s official site before acting.</p><div className="guide-actions"><button className="button ghost" onClick={() => setGuide(null)}>Save for later</button><button className="button primary" onClick={() => cancelSub(guide.id)}>Mark as Cancelled ✓</button></div></section></div>}

      {customOpen && <div className="modal-backdrop" onMouseDown={() => setCustomOpen(false)}><form className="custom-modal" onSubmit={addCustom} onMouseDown={e => e.stopPropagation()}><button type="button" className="modal-close" onClick={() => setCustomOpen(false)}>×</button><span className="eyebrow">ADD A MISSING SUBSCRIPTION</span><h2>Custom subscription</h2><label>Name<input required name="name" placeholder="e.g. Local gym" /></label><label>Price<input required min="0" step="0.01" name="price" type="number" placeholder="19.99" /></label><label>Billing period<select name="billing"><option value="monthly">Monthly</option><option value="annual">Annual</option></select></label><button className="button primary" type="submit">Add to my subscriptions</button></form></div>}

      <nav className="mobile-nav" aria-label="Mobile navigation">{views.map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><b>{item.icon}</b><span>{item.label}</span></button>)}</nav>
      <footer><div className="footer-brand"><b>♛ CANCEL VULTURE</b><span>Pick apart your subscriptions. Take back your money.</span></div><div><span>Estimates only · Not financial advice · Prices vary by plan and region</span><b>cancelvulture.net</b></div></footer>
    </main>
  );
}
