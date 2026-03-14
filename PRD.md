# Climitra — Supplier Procurement Platform PRD

## Context

Climitra is a biofuels manufacturing/trading startup that needs to source wood charcoal from producers across Indian states. Currently there's no systematic way to discover, evaluate, and procure from suppliers in adjacent geographies. This platform will be an internal web app for a small team (3-5 users) to manage the full supplier lifecycle — from discovery through procurement and delivery tracking.

---

## 1. Problem Statement

The team has no centralized system to:
- Discover charcoal producers across Indian states (especially adjacent/nearby states)
- Evaluate suppliers on quality, price, capacity, and reliability
- Manage procurement — place orders, negotiate, track deliveries
- Maintain supplier relationships and history over time

---

## 2. Users & Roles

| Role | Description |
|------|-------------|
| **Admin** | Full access — manage users, system settings, supplier approvals |
| **Procurement Manager** | Search suppliers, place orders, manage relationships |
| **Field Agent** | Add suppliers from field visits, update supplier info |

Scale: 3-5 internal users, 50-200 suppliers initially.

---

## 3. Core Features

### 3.1 Supplier Discovery & Database

**Geographic search**
- Search by Indian state, district, or pin code
- "Nearby states" — auto-suggest suppliers from adjacent states based on your operating geography
- Map view showing supplier locations (pin markers on India map)
- Filter by: state, district, lead category (see intent signals), capacity (tons/month), price range, charcoal type (hardwood/softwood), certification status

**Supplier profiles**
- Business name, owner/contact person, phone, email, address
- Charcoal type produced (species, grade, form — lump/briquette/powder)
- Production capacity (tons/month), current availability
- Pricing (per ton, FOB/delivered)
- Quality parameters: fixed carbon %, moisture %, ash %, volatile matter %
- Photos of facility, product samples
- Certifications (FSC, ISO, pollution board clearance)
- Rating/score (internal, calculated from order history)

**Lead Intent Signals — Target Supplier Categories**

Each scraped or discovered lead is classified into one or more of these intent categories. This drives search keywords, Apify actor queries, and supplier tagging:

| # | Category | Description | Search Keywords (Apify) |
|---|----------|-------------|------------------------|
| 1 | **Traditional Charcoal Manufacturers** | Established charcoal production units using kilns (earth mound, brick, retort) | charcoal manufacturer, wood charcoal supplier, charcoal kiln, hardwood charcoal producer, activated charcoal manufacturer |
| 2 | **Maize Seed Processing Units** | Corn/maize processing facilities that produce cob waste — a feedstock for charcoal/biochar | maize processing unit, corn seed processing, maize cob supplier, corn cob charcoal, maize seed plant |
| 3 | **Low-Tech Kon-Tiki / Artisanal Biochar Producers** | Small-scale biochar producers using open-flame Kon-Tiki kilns, TLUD stoves, or similar artisanal pyrolysis methods | biochar producer, kon-tiki kiln, artisanal biochar, small scale pyrolysis, TLUD biochar, farm biochar |
| 4 | **Other Charcoal-Producing Manufacturing Units** | Any industrial unit generating charcoal as a primary or by-product — coconut shell, rice husk, sawmill waste, bamboo | coconut shell charcoal, rice husk charcoal, sawmill charcoal, bamboo charcoal, biomass carbonization, charcoal by-product |
| 5 | **Briquette & Torrefied Briquette Manufacturers** | Producers of biomass briquettes (compressed fuel blocks) and torrefied briquettes (thermally treated for higher energy density) | briquette manufacturer, biomass briquette, torrefied briquette, bio-coal briquette, white coal, torrefaction plant, fuel briquette supplier |

- Every supplier in the system gets tagged with one or more of these categories
- Apify actors use these keyword sets per category, per geography (state + adjacent states)
- Dashboard shows lead funnel breakdown by category
- Filters support category-based search alongside geographic filters

**Data ingestion — 3 channels**
1. **Manual entry** — team adds suppliers via form (field visits, referrals, trade shows); must select lead category on entry
2. **Scraping via Apify** — Apify actors run keyword searches from the intent signals table above across IndiaMart, TradeIndia, JustDial per state; results auto-tagged by category and pulled into a staging area for review before adding to main database
3. **Supplier self-registration** — public registration page where suppliers select their category and submit details; goes into a pending approval queue

### 3.2 Supplier Evaluation

- Internal rating system (1-5 stars) based on: quality, reliability, price, communication
- Notes/comments per supplier (visible only to internal team)
- Comparison view — side-by-side compare 2-3 suppliers on key metrics
- Supplier tier classification: Preferred / Approved / Probation / Blacklisted
- Quality test records — link lab test results to suppliers

### 3.3 Procurement & Orders

**Order management**
- Create purchase orders (PO) against a supplier: quantity, price, delivery date, terms
- PO approval workflow (for orders above a threshold)
- PO statuses: Draft → Sent → Acknowledged → In Transit → Delivered → Closed
- Track multiple POs per supplier

**Pricing & negotiation**
- Price history per supplier (track rate changes over time)
- Market rate benchmarking — average price across suppliers by region
- Negotiation log — record offers/counteroffers

**Delivery tracking**
- Expected vs actual delivery dates
- Truck/transporter details, LR number, vehicle number
- Weighbridge slip upload (photo/PDF)
- Delivery receipt confirmation with quantity received vs ordered

### 3.4 Quality & Inspection

- Record quality parameters on delivery (fixed carbon, moisture, ash, volatile)
- Pass/fail against predefined specs
- Link quality results to supplier rating
- Rejection workflow — if quality fails, create a rejection note

### 3.5 Payments & Accounts

- Track payment terms per supplier (advance %, credit days)
- Payment status per PO: Pending → Partial → Paid
- Invoice upload and linking to POs
- Outstanding balance per supplier
- Basic payment reports

### 3.6 Dashboard & Reports

- **Home dashboard**: Active orders, pending deliveries, pending approvals, top suppliers
- **Supplier map**: Geographic view of all suppliers with filters
- **Reports**: Monthly procurement summary, supplier performance, spend by region, price trends
- **Alerts**: Overdue deliveries, pending approvals, low-rated supplier orders

---

## 4. Geographic Intelligence

This is the core differentiator — making geography-aware supplier discovery easy:

- **State adjacency model**: Hardcoded adjacency map of Indian states (e.g., Maharashtra neighbors: Gujarat, Madhya Pradesh, Karnataka, Telangana, Goa, Chhattisgarh)
- **"Find nearby suppliers"**: Given your operating state, automatically surface suppliers from adjacent states
- **Distance estimation**: Approximate road distance from your facility to supplier location
- **Regional pricing heatmap**: Average charcoal price by state/region
- **Supply density map**: How many active suppliers per state

---

## 5. Tech Stack (Recommended)

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14+ (App Router), Tailwind CSS, shadcn/ui |
| **Backend** | Next.js API Routes + tRPC or plain REST |
| **Database** | PostgreSQL (via Supabase or Neon) |
| **ORM** | Drizzle ORM |
| **Auth** | NextAuth.js (credentials-based for internal team) |
| **Maps** | Leaflet.js with OpenStreetMap (free, no API key needed) |
| **File storage** | Supabase Storage or S3 |
| **Scraping** | Apify platform — actors for IndiaMart/TradeIndia/JustDial, scheduled runs, webhook integration |
| **Deployment** | Vercel (frontend) + Supabase (DB + storage) |

---

## 6. Data Model (Key Entities)

```
Supplier
├── id, business_name, owner_name, phone, email, address
├── state, district, pin_code, lat, lng
├── lead_categories[] (traditional_charcoal/maize_processing/artisanal_biochar/other_charcoal_mfg/briquette_torrefied)
├── charcoal_type, species, form (lump/briquette/powder)
├── capacity_tons_per_month, current_availability
├── price_per_ton, pricing_basis (FOB/delivered)
├── quality_specs (fixed_carbon, moisture, ash, volatile)
├── tier (preferred/approved/probation/blacklisted)
├── source (manual/scraped/self_registered)
├── status (pending_approval/active/inactive)
├── internal_rating, certifications[]
└── created_at, updated_at

PurchaseOrder
├── id, po_number, supplier_id, created_by
├── items[] (charcoal_type, quantity_tons, price_per_ton)
├── total_amount, payment_terms
├── status (draft/sent/acknowledged/in_transit/delivered/closed)
├── expected_delivery_date, actual_delivery_date
├── transporter_details, vehicle_number, lr_number
└── created_at, updated_at

QualityTest
├── id, purchase_order_id, supplier_id
├── fixed_carbon_pct, moisture_pct, ash_pct, volatile_pct
├── result (pass/fail), notes
├── tested_by, tested_at
└── weighbridge_slip_url

Payment
├── id, purchase_order_id, supplier_id
├── amount, payment_date, payment_mode
├── invoice_url, status (pending/partial/paid)
└── notes

SupplierNote
├── id, supplier_id, created_by
├── content, type (general/negotiation/quality/visit)
└── created_at

User
├── id, name, email, password_hash, role
└── operating_state (for geographic defaults)
```

---

## 7. MVP Phasing

### Phase 1 — Foundation (Week 1-2)
- Project setup (Next.js, DB, auth)
- Supplier CRUD (add, edit, list, view profile)
- Geographic search with state adjacency
- Map view with Leaflet
- Basic dashboard

### Phase 2 — Procurement (Week 3-4)
- Purchase order creation and lifecycle
- Delivery tracking
- Quality test recording
- Supplier rating system

### Phase 3 — Intelligence (Week 5-6)
- Supplier self-registration portal
- Apify scraping pipeline (IndiaMart, TradeIndia actors + webhook to ingest results)
- Price history and benchmarking
- Reports and analytics
- Payment tracking

---

## 8. Acceptance Criteria

1. User can search for charcoal suppliers by state and see suppliers from adjacent states
2. User can view suppliers on a map of India
3. User can add suppliers manually with all profile fields
4. User can create and track purchase orders through their full lifecycle
5. User can record quality test results and link them to deliveries
6. User can see a dashboard with active orders, pending deliveries, and top suppliers
7. Supplier self-registration page works and feeds into an approval queue
8. System shows price trends and supplier performance over time

---

## 9. Verification Plan

1. **Supplier discovery**: Add 5-10 test suppliers across different states → search by state → verify adjacent state suggestions appear
2. **Map view**: Verify pins render correctly on India map with correct locations
3. **PO workflow**: Create PO → move through all statuses → verify tracking works
4. **Quality flow**: Record quality test → verify pass/fail logic → check supplier rating updates
5. **Self-registration**: Submit supplier form from public page → verify it appears in admin approval queue
6. **Dashboard**: Verify all widgets show correct counts and data
7. **Responsive**: Test on desktop (primary) and tablet browsers

---

## 10. Files to Create

Since this is a greenfield project, all files will be new. Key paths:
```
climitra/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/
│   │   ├── suppliers/
│   │   ├── orders/
│   │   ├── quality/
│   │   └── register/          # Public supplier self-registration
│   ├── components/
│   ├── lib/
│   │   ├── db/                # Drizzle schema + migrations
│   │   ├── geo/               # State adjacency model
│   │   └── auth/
│   └── server/                # API/tRPC routes
├── actors/                    # Apify actor source code (IndiaMart, TradeIndia, JustDial)
├── drizzle.config.ts
├── package.json
└── next.config.js
```
