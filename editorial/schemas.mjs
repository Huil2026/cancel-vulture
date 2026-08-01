const stringArray = { type: "array", items: { type: "string" } };
const sourceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["url", "claims"],
  properties: { url: { type: "string" }, claims: stringArray },
};

export const discoverySchema = {
  type: "object",
  additionalProperties: false,
  required: ["topics"],
  properties: {
    topics: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["company", "category", "title", "searchIntent", "whyNow", "officialDomains", "timeSensitive"],
        properties: {
          company: { type: "string" }, category: { type: "string" }, title: { type: "string" },
          searchIntent: { type: "string" }, whyNow: { type: "string" }, officialDomains: stringArray,
          timeSensitive: { type: "boolean" },
        },
      },
    },
  },
};

export const articleSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "slug", "searchIntent", "summaryAnswer", "currentPrice", "cancellationDifficulty", "numberOfSteps", "beforeYouCancelWarnings", "cancellationInstructions", "afterCancellation", "refundInformation", "commonProblems", "alternatives", "internalLinks", "sources", "lastVerified", "callToAction", "seoTitle", "metaDescription", "faq", "featuredImageBrief", "priceHistory", "renewalWarnings", "earlyTerminationFees", "userReportedIssues", "timeSensitive", "effectiveDate"],
  properties: {
    title: { type: "string" }, slug: { type: "string" }, searchIntent: { type: "string" }, summaryAnswer: { type: "string" },
    currentPrice: { type: ["string", "null"] }, cancellationDifficulty: { enum: ["Easy", "Medium", "Hard", "Manual verification required"] },
    numberOfSteps: { type: "integer", minimum: 0 }, beforeYouCancelWarnings: stringArray, cancellationInstructions: stringArray,
    afterCancellation: stringArray, refundInformation: { type: "string" }, commonProblems: stringArray, alternatives: stringArray,
    internalLinks: stringArray, sources: { type: "array", items: sourceSchema }, lastVerified: { type: "string" },
    callToAction: { type: "string" }, seoTitle: { type: "string" }, metaDescription: { type: "string" },
    faq: { type: "array", items: { type: "object", additionalProperties: false, required: ["question", "answer"], properties: { question: { type: "string" }, answer: { type: "string" } } } },
    featuredImageBrief: { type: "string" }, priceHistory: stringArray, renewalWarnings: stringArray,
    earlyTerminationFees: { type: "string" }, userReportedIssues: stringArray,
    timeSensitive: { type: "boolean" }, effectiveDate: { type: ["string", "null"] },
  },
};

export const reviewSchema = {
  type: "object",
  additionalProperties: false,
  required: ["approved", "score", "manualVerificationRequired", "reasons", "unsupportedClaims"],
  properties: {
    approved: { type: "boolean" }, score: { type: "integer", minimum: 0, maximum: 100 },
    manualVerificationRequired: { type: "boolean" }, reasons: stringArray, unsupportedClaims: stringArray,
  },
};

