import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { sanitize } from "@/lib/utils/sanitize";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Sanitize all string inputs
    if (body.businessName) body.businessName = sanitize(body.businessName) || "";
    if (body.ownerName) body.ownerName = sanitize(body.ownerName);
    if (body.phone) body.phone = sanitize(body.phone);
    if (body.email) body.email = sanitize(body.email);
    if (body.address) body.address = sanitize(body.address);
    if (body.charcoalType) body.charcoalType = sanitize(body.charcoalType);
    if (body.species) body.species = sanitize(body.species);

    // Validate required fields
    if (!body.businessName || !body.businessName.trim()) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }

    if (!body.phone || !body.phone.trim()) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!body.state || !body.state.trim()) {
      return NextResponse.json(
        { error: "State is required" },
        { status: 400 }
      );
    }

    // Parse certifications from comma-separated string
    const certifications =
      typeof body.certifications === "string"
        ? body.certifications
            .split(",")
            .map((c: string) => c.trim())
            .filter(Boolean)
        : body.certifications || [];

    const newSupplier = await db
      .insert(suppliers)
      .values({
        businessName: body.businessName.trim(),
        ownerName: body.ownerName?.trim() || null,
        phone: body.phone.trim(),
        email: body.email?.trim() || null,
        address: body.address?.trim() || null,
        state: body.state.trim(),
        district: body.district?.trim() || null,
        pinCode: body.pinCode?.trim() || null,
        leadCategories: body.leadCategories || [],
        charcoalType: body.charcoalType?.trim() || null,
        species: body.species?.trim() || null,
        form: body.form || null,
        capacityTonsPerMonth: body.capacityTonsPerMonth || null,
        pricePerTon: body.pricePerTon || null,
        fixedCarbonPct: body.fixedCarbonPct || null,
        moisturePct: body.moisturePct || null,
        ashPct: body.ashPct || null,
        volatilePct: body.volatilePct || null,
        certifications,
        source: "self_registered",
        status: "pending_approval",
        tier: "approved",
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Registration submitted successfully. Your application is pending approval.",
        supplier: newSupplier[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registering supplier:", error);
    return NextResponse.json(
      { error: "Failed to submit registration. Please try again." },
      { status: 500 }
    );
  }
}
