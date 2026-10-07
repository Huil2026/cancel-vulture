import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const services = sqliteTable("services", { id: text("id").primaryKey(), name: text("name").notNull(), slug: text("slug").notNull().unique(), category: text("category").notNull(), serviceType: text("service_type").notNull(), status: text("status").notNull().default("Draft") });
export const regions = sqliteTable("regions", { id: text("id").primaryKey(), country: text("country").notNull(), stateRegion: text("state_region"), city: text("city"), postalCode: text("postal_code") });
export const sources = sqliteTable("sources", { id: text("id").primaryKey(), url: text("url").notNull(), title: text("title").notNull(), retrievedAt: text("retrieved_at").notNull(), official: integer("official", { mode: "boolean" }).notNull().default(true), extractedClaims: text("extracted_claims", { mode: "json" }).$type<string[]>().notNull() });
export const billingPlatforms = sqliteTable("billing_platforms", { id: text("id").primaryKey(), name: text("name").notNull() });

export const providerPlans = sqliteTable("provider_plans", {
  id: text("id").primaryKey(), serviceId: text("service_id").notNull().references(() => services.id), name: text("name").notNull(), serviceType: text("service_type").notNull(), speed: text("speed"), dataCap: text("data_cap"), contractRequired: integer("contract_required", { mode: "boolean" }), description: text("description").notNull(), status: text("status").notNull(),
});

export const servicePrices = sqliteTable("service_prices", {
  id: text("id").primaryKey(), serviceId: text("service_id").notNull().references(() => services.id), planId: text("plan_id").notNull().references(() => providerPlans.id), regionId: text("region_id").notNull().references(() => regions.id), currency: text("currency").notNull(), price: real("price"), billingPeriod: text("billing_period").notNull(), priceType: text("price_type").notNull(), promotionStart: text("promotion_start"), promotionEnd: text("promotion_end"), postPromoPrice: real("post_promo_price"), equipmentFee: real("equipment_fee"), installationFee: real("installation_fee"), activationFee: real("activation_fee"), sourceId: text("source_id").references(() => sources.id), verificationStatus: text("verification_status").notNull().default("Draft"), lastVerifiedAt: text("last_verified_at"),
});

export const cancellationMethods = sqliteTable("cancellation_methods", {
  id: text("id").primaryKey(), serviceId: text("service_id").notNull().references(() => services.id), planId: text("plan_id").references(() => providerPlans.id), regionId: text("region_id").references(() => regions.id), billingPlatformId: text("billing_platform_id").references(() => billingPlatforms.id), methodType: text("method_type").notNull(), onlineAvailable: integer("online_available", { mode: "boolean" }), phoneRequired: integer("phone_required", { mode: "boolean" }), storeRequired: integer("store_required", { mode: "boolean" }), equipmentReturnRequired: integer("equipment_return_required", { mode: "boolean" }), earlyTerminationFeePossible: integer("early_termination_fee_possible", { mode: "boolean" }), cancelUrl: text("cancel_url"), supportPhone: text("support_phone"), requiredAccountInfo: text("required_account_info", { mode: "json" }).$type<string[]>(), estimatedMinutes: integer("estimated_minutes"), lastVerifiedAt: text("last_verified_at"), sourceId: text("source_id").references(() => sources.id), verificationStatus: text("verification_status").notNull().default("Draft"),
});

export const verificationReports = sqliteTable("verification_reports", { id: text("id").primaryKey(), serviceId: text("service_id").notNull().references(() => services.id), reportType: text("report_type").notNull(), note: text("note").notNull(), status: text("status").notNull().default("Needs Review"), createdAt: text("created_at").notNull() });
