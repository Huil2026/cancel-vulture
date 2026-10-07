export type EditorialRecord = {
  title: string; slug: string; searchIntent: string; status: string; qualityScore: number;
  sourceCount: number; lastVerified: string; publicationStatus: string; timeSensitive: boolean;
  effectiveDate?: string;
};

export type DraftRecord = {
  title: string; slug?: string; status: string; qualityScore: number; reasons?: readonly string[];
  sources?: number; lastVerified?: string; timeSensitive?: boolean;
};

export type ArticleDocument = {
  title: string; slug: string; summaryAnswer: string; currentPrice: string | null; cancellationDifficulty: string;
  numberOfSteps: number; beforeYouCancelWarnings: string[]; cancellationInstructions: string[]; afterCancellation: string[];
  refundInformation: string; commonProblems: string[]; alternatives: string[]; internalLinks: string[];
  sources: { url: string; claims: string[] }[]; lastVerified: string; callToAction: string; seoTitle: string;
  metaDescription: string; faq: { question: string; answer: string }[]; featuredImageBrief: string;
  renewalWarnings: string[]; earlyTerminationFees: string; timeSensitive: boolean; effectiveDate: string | null;
};

export type EditorialState = {
  lastRun: string | null; status: string; generated: number; approved: number; rejected: number;
  selectedSlug: string | null; drafts: readonly DraftRecord[]; errors: readonly unknown[];
  articles: readonly EditorialRecord[]; documents: readonly ArticleDocument[];
};

