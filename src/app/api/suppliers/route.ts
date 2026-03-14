import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { eq, ilike, inArray, and, or, desc, asc, sql, SQL } from "drizzle-orm";
import { getStateWithAdjacent } from "@/lib/geo/adjacency";
import { requireAuth } from "@/lib/auth/api-guard";
import { getSessionUser, isProcurementUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const district = searchParams.get("district");
    const leadCategory = searchParams.get("leadCategory");
    const tier = searchParams.get("tier");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const includeAdjacent = searchParams.get("includeAdjacent") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    // State filter with optional adjacent states
    if (state) {
      if (includeAdjacent) {
        const statesWithAdjacent = getStateWithAdjacent(state);
        conditions.push(inArray(suppliers.state, statesWithAdjacent));
      } else {
        conditions.push(eq(suppliers.state, state));
      }
    }

    // District filter
    if (district) {
      conditions.push(eq(suppliers.district, district));
    }

    // Lead category filter - check JSON array contains the category
    if (leadCategory) {
      conditions.push(
        sql`${suppliers.leadCategories}::jsonb @> ${JSON.stringify([leadCategory])}::jsonb`
      );
    }

    // Tier filter
    if (tier) {
      conditions.push(
        eq(suppliers.tier, tier as "preferred" | "approved" | "probation" | "blacklisted")
      );
    }

    // Status filter
    if (status) {
      conditions.push(
        eq(suppliers.status, status as "pending_approval" | "active" | "inactive")
      );
    }

    // Search filter - searches business name, owner name, phone, email
    if (search) {
      conditions.push(
        or(
          ilike(suppliers.businessName, `%${search}%`),
          ilike(suppliers.ownerName, `%${search}%`),
          ilike(suppliers.phone, `%${search}%`),
          ilike(suppliers.email, `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build ordering: if state filter is applied with adjacent, sort operating state first
    let orderBy;
    if (state && includeAdjacent) {
      orderBy = [
        asc(sql`CASE WHEN ${suppliers.state} = ${state} THEN 0 ELSE 1 END`),
        asc(suppliers.state),
        desc(suppliers.createdAt),
      ];
    } else {
      orderBy = [desc(suppliers.createdAt)];
    }

    const [results, countResult] = await Promise.all([
      db
        .select()
        .from(suppliers)
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(suppliers)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      suppliers: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError2 = await requireAuth();
    if (authError2) return authError2;

    const sessionUser = await getSessionUser();
    if (!isProcurementUser(sessionUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.businessName?.trim() || !body.state?.trim()) {
      return NextResponse.json(
        { error: "Business name and state are required" },
        { status: 400 }
      );
    }

    const newSupplier = await db
      .insert(suppliers)
      .values({
        businessName: body.businessName.trim(),
        ownerName: body.ownerName || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        state: body.state.trim(),
        district: body.district || null,
        pinCode: body.pinCode || null,
        lat: body.lat || null,
        lng: body.lng || null,
        leadCategories: body.leadCategories || [],
        charcoalType: body.charcoalType || null,
        species: body.species || null,
        form: body.form || null,
        capacityTonsPerMonth: body.capacityTonsPerMonth || null,
        currentAvailability: body.currentAvailability || null,
        pricePerTon: body.pricePerTon || null,
        pricingBasis: body.pricingBasis || "fob",
        fixedCarbonPct: body.fixedCarbonPct || null,
        moisturePct: body.moisturePct || null,
        ashPct: body.ashPct || null,
        volatilePct: body.volatilePct || null,
        tier: body.tier || "approved",
        source: body.source || "manual",
        status: body.status || "active",
        internalRating: body.internalRating || null,
        certifications: body.certifications || [],
        photoUrls: body.photoUrls || [],
      })
      .returning();

    return NextResponse.json({ supplier: newSupplier[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}
