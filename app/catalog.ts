export type Usage = "Daily" | "Weekly" | "Monthly" | "Rarely" | "Never" | "Unsure";
export type Billing = "monthly" | "annual";
export type ServiceType = "digital" | "connectivity" | "printer" | "household";
export type VerificationStatus = "Verified" | "Needs Review" | "Conflicting Sources" | "Outdated" | "Draft" | "Archived";

export type SourceRecord = {
  id: string;
  url: string;
  title: string;
  retrievedAt: string;
  official: boolean;
  claims: string[];
};

export type ProviderPlan = {
  id: string;
  name: string;
  serviceType: string;
  speed?: string;
  dataCap?: string;
  contractRequired?: boolean;
  description: string;
  status: "active" | "regional" | "unknown";
};

export type PriceRecord = {
  id: string;
  planId: string;
  region: string;
  currency: string;
  price: number | null;
  billingPeriod: Billing;
  priceType: "standard" | "promotional" | "first-year" | "post-promotion" | "location-variable" | "estimate";
  postPromoPrice?: number | null;
  equipmentFee?: number | null;
  installationFee?: number | null;
  activationFee?: number | null;
  sourceId?: string;
  verificationStatus: VerificationStatus;
  lastVerifiedAt?: string;
};

export type CancellationMethod = {
  methodType: "online" | "phone" | "app" | "store" | "varies" | "unverified";
  onlineAvailable: boolean | null;
  phoneRequired: boolean | null;
  storeRequired: boolean | null;
  equipmentReturnRequired: boolean | null;
  earlyTerminationFeePossible: boolean | null;
  cancelUrl?: string;
  supportPhone?: string;
  requiredAccountInfo: string[];
  estimatedMinutes?: number;
  accessContinues?: string;
  confirmationMethod?: string;
  billingPlatformException?: string;
  lastVerifiedAt?: string;
  sourceId?: string;
  verificationStatus: VerificationStatus;
  steps?: string[];
};

export type CatalogService = {
  id: string;
  slug: string;
  name: string;
  category: string;
  serviceType: ServiceType;
  mark: string;
  color: string;
  usage: Usage;
  difficulty: "Easy" | "Medium" | "Hard" | "Unknown";
  alternative: string;
  recommendationActions: string[];
  recommendationReason: string;
  selected: boolean;
  officialAvailabilityUrl?: string;
  plans: ProviderPlan[];
  prices: PriceRecord[];
  cancellation: CancellationMethod;
  sources: SourceRecord[];
};

const checked = "2026-10-06";

function draftService(
  id: string,
  name: string,
  category: string,
  serviceType: ServiceType,
  color: string,
  mark: string,
  availabilityUrl?: string,
): CatalogService {
  const planId = `${id}-regional-plan`;
  return {
    id,
    slug: id,
    name,
    category,
    serviceType,
    mark,
    color,
    usage: "Unsure",
    difficulty: "Unknown",
    alternative: serviceType === "connectivity" ? "Compare local providers" : serviceType === "printer" ? "Compare direct ink costs" : "Compare plans",
    recommendationActions: serviceType === "connectivity"
      ? ["Switch provider", "Downgrade", "Renegotiate", "Remove add-on", "Change plan"]
      : serviceType === "printer"
        ? ["Cancel plan", "Change page allowance", "Compare direct ink", "Review rollover pages"]
        : ["Cancel", "Pause", "Downgrade", "Replace"],
    recommendationReason: "No verified price or usage history is available yet. Review the plan and region before taking action.",
    selected: false,
    officialAvailabilityUrl: availabilityUrl,
    plans: [{ id: planId, name: "Plans vary by location", serviceType: category, description: "Plan name, eligibility and terms require provider verification.", status: "unknown" }],
    prices: [{ id: `${id}-price-pending`, planId, region: "Region required", currency: "USD", price: null, billingPeriod: "monthly", priceType: "location-variable", verificationStatus: "Draft" }],
    cancellation: {
      methodType: "unverified",
      onlineAvailable: null,
      phoneRequired: null,
      storeRequired: null,
      equipmentReturnRequired: null,
      earlyTerminationFeePossible: null,
      requiredAccountInfo: [],
      verificationStatus: "Draft",
    },
    sources: availabilityUrl ? [{ id: `${id}-availability`, url: availabilityUrl, title: `${name} official availability or plans`, retrievedAt: checked, official: true, claims: ["Use the provider checker for current plan and address eligibility."] }] : [],
  };
}

function estimatedDigital(id: string, name: string, category: string, price: number, billing: Billing, mark: string, color: string, usage: Usage, difficulty: "Easy" | "Medium" | "Hard", minutes: number, alternative: string, selected = false): CatalogService {
  const planId = `${id}-default-plan`;
  return {
    ...draftService(id, name, category, "digital", color, mark),
    usage,
    difficulty,
    alternative,
    selected,
    recommendationReason: "The saved estimate and your usage pattern can help prioritize a manual review. Verify the provider price before cancelling.",
    plans: [{ id: planId, name, serviceType: category, description: "User-editable MVP estimate; current provider price has not been verified in this catalog.", status: "unknown" }],
    prices: [{ id: `${id}-estimate`, planId, region: "US estimate", currency: "USD", price, billingPeriod: billing, priceType: "estimate", verificationStatus: "Needs Review" }],
    cancellation: { methodType: "unverified", onlineAvailable: null, phoneRequired: null, storeRequired: null, equipmentReturnRequired: null, earlyTerminationFeePossible: null, requiredAccountInfo: [], estimatedMinutes: minutes, verificationStatus: "Needs Review" },
  };
}

const hpSource: SourceRecord = {
  id: "hp-instant-ink-cancel",
  url: "https://support.hp.com/us-en/document/ish_3259778-1993151-16?section=doc-section-6",
  title: "HP Instant Ink account subscription, billing, and cancellation",
  retrievedAt: checked,
  official: true,
  claims: ["Cancellation is available from Instant Ink plan settings.", "Email confirmation is expected.", "Instant Ink cartridges stop working after the final billing cycle."],
};

const attSource: SourceRecord = {
  id: "att-internet-cancel",
  url: "https://www.att.com/support/how-to/cancellation-policy-internet/",
  title: "AT&T Internet cancellation policy",
  retrievedAt: checked,
  official: true,
  claims: ["The account owner calls to cancel with account number and PIN.", "Equipment return and an early termination fee may apply."],
};

const spectrumSource: SourceRecord = {
  id: "spectrum-change-cancel",
  url: "https://www.spectrum.net/support/account-and-billing/change-or-cancel-service",
  title: "Change or Cancel Your Spectrum Service",
  retrievedAt: checked,
  official: true,
  claims: ["Cancellation options depend on the service and signed-in account.", "Equipment return information is provided separately."],
};

const hpInstantInk: CatalogService = {
  ...draftService("hp-instant-ink", "HP Instant Ink", "Printer subscriptions", "printer", "#0875c1", "HP", "https://www.hp.com/us-en/shop/cv/instantink"),
  difficulty: "Medium",
  recommendationReason: "Compare your page allowance, rollover pages and cartridge consequences with buying ink directly.",
  cancellation: {
    methodType: "online", onlineAvailable: true, phoneRequired: false, storeRequired: false, equipmentReturnRequired: false, earlyTerminationFeePossible: false,
    cancelUrl: hpSource.url, requiredAccountInfo: ["HP account", "Enrolled printer serial number"], estimatedMinutes: 10,
    accessContinues: "Instant Ink supplies work through the current billing cycle; regional yearly-plan rules can differ.", confirmationMethod: "Immediate email and end-of-cycle email",
    lastVerifiedAt: checked, sourceId: hpSource.id, verificationStatus: "Verified",
    steps: ["Sign in to the HP Instant Ink account.", "Confirm the enrolled printer under Overview and Printer Details.", "Open HP Instant Ink, then Update Plan.", "Under Plan Details, choose Cancel Instant Ink and follow the prompts."],
  },
  sources: [hpSource],
};

function attInternet(id: string, name: string): CatalogService {
  return {
    ...draftService(id, name, "Home internet / Wi-Fi", "connectivity", "#00a8e0", "AT&T", "https://www.att.com/internet/availability/"),
    difficulty: "Hard",
    recommendationReason: "Check address eligibility, equipment, discounts and any term commitment before switching or cancelling.",
    cancellation: {
      methodType: "phone", onlineAvailable: false, phoneRequired: true, storeRequired: false, equipmentReturnRequired: true, earlyTerminationFeePossible: true,
      cancelUrl: attSource.url, supportPhone: "800-288-2020", requiredAccountInfo: ["Account owner", "Account number", "PIN"], estimatedMinutes: 20,
      accessContinues: "Timing depends on the account and billing period.", confirmationMethod: "Provider confirmation",
      lastVerifiedAt: checked, sourceId: attSource.id, verificationStatus: "Verified",
      steps: ["Confirm the account owner, account number and PIN are available.", "Call AT&T during normal operating hours.", "Ask whether equipment must be returned and whether a term commitment applies.", "Save the cancellation confirmation and return receipt."],
    },
    sources: [attSource],
  };
}

const spectrumInternet: CatalogService = {
  ...draftService("spectrum-internet", "Spectrum Internet", "Home internet / Wi-Fi", "connectivity", "#0073d1", "S", "https://www.spectrum.com/internet"),
  difficulty: "Hard",
  recommendationReason: "Spectrum offers and Wi-Fi charges vary by address, tier and promotion; compare the post-promotion total before switching.",
  cancellation: {
    methodType: "varies", onlineAvailable: null, phoneRequired: null, storeRequired: null, equipmentReturnRequired: true, earlyTerminationFeePossible: null,
    cancelUrl: spectrumSource.url, requiredAccountInfo: ["Primary Spectrum account access"], estimatedMinutes: 20,
    accessContinues: "Review the current billing-cycle terms shown for the account.", confirmationMethod: "Signed-in cancellation options",
    lastVerifiedAt: checked, sourceId: spectrumSource.id, verificationStatus: "Verified",
  },
  sources: [spectrumSource],
};

export const catalog: CatalogService[] = [
  estimatedDigital("netflix", "Netflix", "Streaming", 15.49, "monthly", "N", "#e50914", "Monthly", "Easy", 6, "Tubi · Free", true),
  estimatedDigital("spotify", "Spotify", "Music", 11.99, "monthly", "S", "#1ed760", "Daily", "Easy", 5, "Spotify Free", true),
  estimatedDigital("adobe", "Adobe Creative Cloud", "Software", 22.99, "monthly", "A", "#ff3c2e", "Rarely", "Hard", 20, "Photopea · Free", true),
  estimatedDigital("chatgpt", "ChatGPT Plus", "AI tools", 20, "monthly", "✦", "#10a37f", "Weekly", "Easy", 4, "Free plan", true),
  estimatedDigital("disney", "Disney+", "Streaming", 11.99, "monthly", "D+", "#1769e0", "Never", "Easy", 4, "Rotate seasonally", true),
  estimatedDigital("prime", "Amazon Prime", "Delivery memberships", 14.99, "monthly", "a", "#00a8e1", "Monthly", "Medium", 12, "Prime Video only"),
  estimatedDigital("youtube", "YouTube Premium", "Streaming", 13.99, "monthly", "▶", "#ff0000", "Weekly", "Medium", 10, "YouTube Free"),
  estimatedDigital("planet", "Planet Fitness", "Fitness", 24.99, "monthly", "PF", "#7d2cb7", "Never", "Hard", 25, "Nike Training Club", true),
  estimatedDigital("max", "Max", "Streaming", 16.99, "monthly", "M", "#6824d6", "Rarely", "Medium", 9, "Rotate seasonally"),
  estimatedDigital("hulu", "Hulu", "Streaming", 9.99, "monthly", "h", "#1ce783", "Monthly", "Medium", 10, "Tubi · Free"),
  estimatedDigital("claude", "Claude Pro", "AI tools", 20, "monthly", "C", "#d97757", "Weekly", "Easy", 4, "Free plan"),
  estimatedDigital("midjourney", "Midjourney", "AI tools", 10, "monthly", "MJ", "#ffffff", "Rarely", "Easy", 5, "Free image tools"),
  estimatedDigital("m365", "Microsoft 365", "Productivity", 99.99, "annual", "M", "#f35325", "Weekly", "Medium", 10, "LibreOffice · Free"),
  estimatedDigital("canva", "Canva Pro", "Software", 14.99, "monthly", "C", "#7d2ae8", "Monthly", "Easy", 5, "Canva Free"),
  estimatedDigital("dropbox", "Dropbox Plus", "Cloud storage", 11.99, "monthly", "◇", "#0061ff", "Rarely", "Easy", 6, "Google Drive Free"),
  estimatedDigital("notion", "Notion Plus", "Productivity", 10, "monthly", "N", "#ffffff", "Daily", "Easy", 4, "Notion Free"),
  estimatedDigital("xbox", "Xbox Game Pass", "Gaming", 19.99, "monthly", "X", "#107c10", "Weekly", "Easy", 5, "Pause between games"),
  estimatedDigital("peloton", "Peloton App+", "Fitness", 24, "monthly", "P", "#e21a2d", "Rarely", "Easy", 5, "Nike Training Club"),
  estimatedDigital("audible", "Audible", "Education", 14.95, "monthly", "A", "#f7991c", "Monthly", "Medium", 12, "Libby · Free"),
  estimatedDigital("linkedin", "LinkedIn Premium", "Productivity", 39.99, "monthly", "in", "#0a66c2", "Rarely", "Medium", 8, "LinkedIn Free"),
  hpInstantInk,
  draftService("hp-instant-ink-toner", "HP Instant Ink Toner", "Printer subscriptions", "printer", "#0875c1", "HP", "https://www.hp.com/us-en/shop/cv/instantink"),
  draftService("epson-readyprint", "Epson ReadyPrint", "Printer subscriptions", "printer", "#1764a5", "E", "https://www.epson.com/readyprint"),
  draftService("brother-refresh", "Brother Refresh EZ Print", "Printer subscriptions", "printer", "#1779ba", "B", "https://www.brother-usa.com/supplies/refresh"),
  draftService("canon-replenishment", "Canon Subscription / Replenishment", "Printer subscriptions", "printer", "#d71920", "C", "https://www.usa.canon.com/shop/ink-paper-toner"),
  attInternet("att-internet", "AT&T Internet"),
  attInternet("att-fiber", "AT&T Fiber"),
  attInternet("att-internet-air", "AT&T Internet Air"),
  spectrumInternet,
  draftService("xfinity-internet", "Xfinity Internet", "Home internet / Wi-Fi", "connectivity", "#7b2cbf", "X", "https://www.xfinity.com/learn/internet-service"),
  draftService("verizon-fios", "Verizon Fios", "Home internet / Wi-Fi", "connectivity", "#e60000", "V", "https://www.verizon.com/home/internet/fios-fastest-internet/"),
  draftService("verizon-5g-home", "Verizon 5G Home", "Home internet / Wi-Fi", "connectivity", "#e60000", "V", "https://www.verizon.com/home/internet/5g/"),
  draftService("tmobile-home", "T-Mobile Home Internet", "Home internet / Wi-Fi", "connectivity", "#e20074", "T", "https://www.t-mobile.com/home-internet/eligibility"),
  draftService("cox-internet", "Cox Internet", "Home internet / Wi-Fi", "connectivity", "#0067a0", "C", "https://www.cox.com/residential/internet.html"),
  draftService("frontier-fiber", "Frontier Fiber", "Home internet / Wi-Fi", "connectivity", "#ff0037", "F", "https://frontier.com/shop/internet/fiber-internet"),
  draftService("optimum-internet", "Optimum Internet", "Home internet / Wi-Fi", "connectivity", "#f58220", "O", "https://www.optimum.com/internet"),
  draftService("google-fiber", "Google Fiber", "Home internet / Wi-Fi", "connectivity", "#4285f4", "G", "https://fiber.google.com/"),
  draftService("att-wireless", "AT&T Wireless", "Mobile phone plans", "connectivity", "#00a8e0", "AT&T", "https://www.att.com/wireless/"),
  draftService("verizon-wireless", "Verizon Wireless", "Mobile phone plans", "connectivity", "#e60000", "V", "https://www.verizon.com/plans/"),
  draftService("tmobile", "T-Mobile", "Mobile phone plans", "connectivity", "#e20074", "T", "https://www.t-mobile.com/cell-phone-plans"),
  draftService("spectrum-mobile", "Spectrum Mobile", "Mobile phone plans", "connectivity", "#0073d1", "S", "https://www.spectrum.com/mobile/plans"),
  draftService("xfinity-mobile", "Xfinity Mobile", "Mobile phone plans", "connectivity", "#7b2cbf", "X", "https://www.xfinity.com/mobile/learn/plan"),
  draftService("visible", "Visible", "Mobile phone plans", "connectivity", "#2f00ff", "V", "https://www.visible.com/plans"),
  draftService("mint-mobile", "Mint Mobile", "Mobile phone plans", "connectivity", "#00a859", "M", "https://www.mintmobile.com/plans/"),
  draftService("cricket", "Cricket", "Mobile phone plans", "connectivity", "#5bbd37", "C", "https://www.cricketwireless.com/cell-phone-plans"),
  draftService("metro", "Metro by T-Mobile", "Mobile phone plans", "connectivity", "#6337a5", "M", "https://www.metrobyt-mobile.com/cell-phone-plans"),
  draftService("cable-tv-bundle", "Cable / TV bundle", "Cable / TV bundles", "household", "#ff6a00", "TV"),
  draftService("adt", "ADT Monitoring", "Security / monitoring services", "household", "#0057b8", "ADT", "https://www.adt.com/"),
  draftService("new-york-times", "The New York Times", "News / media", "digital", "#ffffff", "NYT"),
  draftService("coursera-plus", "Coursera Plus", "Education", "digital", "#0056d2", "C"),
  draftService("other-household", "Other recurring household service", "Other recurring household services", "household", "#686868", "+"),
];

export const categoryOrder = [
  "Streaming", "Music", "AI tools", "Software", "Gaming", "Fitness", "Cloud storage", "Productivity", "Education",
  "Printer subscriptions", "Home internet / Wi-Fi", "Mobile phone plans", "Cable / TV bundles", "Security / monitoring services",
  "Delivery memberships", "News / media", "Other recurring household services",
];

export function currentPrice(service: CatalogService) {
  return service.prices.find((price) => price.price !== null) ?? service.prices[0];
}

export function freshness(service: CatalogService) {
  const price = currentPrice(service);
  if (!price.lastVerifiedAt) return "Not yet verified";
  return `Price checked: ${price.lastVerifiedAt}`;
}
