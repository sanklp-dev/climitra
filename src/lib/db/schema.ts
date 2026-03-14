import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  boolean,
  timestamp,
  pgEnum,
  json,
  uuid,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "procurement_manager",
  "field_agent",
]);

export const supplierTierEnum = pgEnum("supplier_tier", [
  "preferred",
  "approved",
  "probation",
  "blacklisted",
]);

export const supplierSourceEnum = pgEnum("supplier_source", [
  "manual",
  "scraped",
  "self_registered",
]);

export const supplierStatusEnum = pgEnum("supplier_status", [
  "pending_approval",
  "active",
  "inactive",
]);

export const charcoalFormEnum = pgEnum("charcoal_form", [
  "lump",
  "briquette",
  "powder",
]);

export const leadCategoryEnum = pgEnum("lead_category", [
  "traditional_charcoal",
  "maize_processing",
  "artisanal_biochar",
  "other_charcoal_mfg",
  "briquette_torrefied",
]);

export const poStatusEnum = pgEnum("po_status", [
  "draft",
  "sent",
  "acknowledged",
  "in_transit",
  "delivered",
  "closed",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "partial",
  "paid",
]);

export const qualityResultEnum = pgEnum("quality_result", ["pass", "fail"]);

export const noteTypeEnum = pgEnum("note_type", [
  "general",
  "negotiation",
  "quality",
  "visit",
]);

export const pricingBasisEnum = pgEnum("pricing_basis", ["fob", "delivered"]);

// Tables
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("field_agent"),
  operatingState: varchar("operating_state", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessName: varchar("business_name", { length: 500 }).notNull(),
  ownerName: varchar("owner_name", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  state: varchar("state", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }),
  pinCode: varchar("pin_code", { length: 10 }),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  leadCategories: json("lead_categories").$type<string[]>().default([]),
  charcoalType: varchar("charcoal_type", { length: 255 }),
  species: varchar("species", { length: 255 }),
  form: charcoalFormEnum("form"),
  capacityTonsPerMonth: decimal("capacity_tons_per_month", {
    precision: 10,
    scale: 2,
  }),
  currentAvailability: decimal("current_availability", {
    precision: 10,
    scale: 2,
  }),
  pricePerTon: decimal("price_per_ton", { precision: 12, scale: 2 }),
  pricingBasis: pricingBasisEnum("pricing_basis").default("fob"),
  fixedCarbonPct: decimal("fixed_carbon_pct", { precision: 5, scale: 2 }),
  moisturePct: decimal("moisture_pct", { precision: 5, scale: 2 }),
  ashPct: decimal("ash_pct", { precision: 5, scale: 2 }),
  volatilePct: decimal("volatile_pct", { precision: 5, scale: 2 }),
  tier: supplierTierEnum("tier").default("approved"),
  source: supplierSourceEnum("source").default("manual"),
  status: supplierStatusEnum("status").default("active"),
  internalRating: decimal("internal_rating", { precision: 3, scale: 2 }),
  certifications: json("certifications").$type<string[]>().default([]),
  photoUrls: json("photo_urls").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  poNumber: varchar("po_number", { length: 50 }).notNull().unique(),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  items: json("items")
    .$type<
      Array<{
        charcoalType: string;
        quantityTons: number;
        pricePerTon: number;
      }>
    >()
    .default([]),
  totalAmount: decimal("total_amount", { precision: 14, scale: 2 }),
  paymentTerms: text("payment_terms"),
  status: poStatusEnum("status").default("draft"),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  transporterDetails: text("transporter_details"),
  vehicleNumber: varchar("vehicle_number", { length: 50 }),
  lrNumber: varchar("lr_number", { length: 50 }),
  quantityReceived: decimal("quantity_received", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const qualityTests = pgTable("quality_tests", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseOrderId: uuid("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id),
  fixedCarbonPct: decimal("fixed_carbon_pct", { precision: 5, scale: 2 }),
  moisturePct: decimal("moisture_pct", { precision: 5, scale: 2 }),
  ashPct: decimal("ash_pct", { precision: 5, scale: 2 }),
  volatilePct: decimal("volatile_pct", { precision: 5, scale: 2 }),
  result: qualityResultEnum("result"),
  notes: text("notes"),
  testedBy: uuid("tested_by").references(() => users.id),
  testedAt: timestamp("tested_at").defaultNow(),
  weighbridgeSlipUrl: text("weighbridge_slip_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  purchaseOrderId: uuid("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date"),
  paymentMode: varchar("payment_mode", { length: 50 }),
  invoiceUrl: text("invoice_url"),
  status: paymentStatusEnum("status").default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const supplierNotes = pgTable("supplier_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  supplierId: uuid("supplier_id")
    .notNull()
    .references(() => suppliers.id),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  type: noteTypeEnum("type").default("general"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scrapingJobs = pgTable("scraping_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: varchar("actor_id", { length: 255 }),
  runId: varchar("run_id", { length: 255 }),
  status: varchar("status", { length: 50 }).default("pending"),
  searchKeywords: text("search_keywords"),
  targetState: varchar("target_state", { length: 100 }),
  leadCategory: varchar("lead_category", { length: 100 }),
  resultsCount: integer("results_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type NewPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type QualityTest = typeof qualityTests.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type SupplierNote = typeof supplierNotes.$inferSelect;
export type ScrapingJob = typeof scrapingJobs.$inferSelect;
