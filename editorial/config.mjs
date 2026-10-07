export const MODEL = process.env.OPENAI_MODEL || "gpt-5.6-sol";
export const MAX_DAILY_DRAFTS = 5;
export const DUPLICATE_THRESHOLD = 0.58;
export const MIN_QUALITY_SCORE = 78;

export const topicCategories = [
  "cancellation guide",
  "price change",
  "fee warning",
  "refund policy",
  "free trial",
  "subscription alternative",
  "consumer education",
];

export const officialSources = [
  { company: "Netflix", domains: ["netflix.com"], seedUrls: ["https://help.netflix.com/", "https://www.netflix.com/signup/planform"] },
  { company: "Spotify", domains: ["spotify.com"], seedUrls: ["https://support.spotify.com/", "https://www.spotify.com/premium/"] },
  { company: "Adobe", domains: ["adobe.com"], seedUrls: ["https://helpx.adobe.com/", "https://www.adobe.com/legal/subscription-terms.html"] },
  { company: "Amazon Prime", domains: ["amazon.com"], seedUrls: ["https://www.amazon.com/gp/help/customer/", "https://www.amazon.com/amazonprime"] },
  { company: "Disney+", domains: ["disneyplus.com"], seedUrls: ["https://help.disneyplus.com/", "https://www.disneyplus.com/"] },
  { company: "Hulu", domains: ["hulu.com"], seedUrls: ["https://help.hulu.com/", "https://www.hulu.com/plans"] },
  { company: "Max", domains: ["help.max.com", "max.com"], seedUrls: ["https://help.max.com/", "https://www.max.com/"] },
  { company: "Microsoft 365", domains: ["microsoft.com"], seedUrls: ["https://support.microsoft.com/", "https://www.microsoft.com/microsoft-365/buy/compare-all-microsoft-365-products"] },
  { company: "YouTube Premium", domains: ["support.google.com", "youtube.com"], seedUrls: ["https://support.google.com/youtube/", "https://www.youtube.com/premium"] },
  { company: "Planet Fitness", domains: ["planetfitness.com"], seedUrls: ["https://www.planetfitness.com/about-planet-fitness/customer-service"] },
  { company: "Consumer education", domains: ["ftc.gov", "consumerfinance.gov"], seedUrls: ["https://consumer.ftc.gov/", "https://www.consumerfinance.gov/consumer-tools/"] },
];

export const officialDomainSet = new Set(officialSources.flatMap(source => source.domains));

