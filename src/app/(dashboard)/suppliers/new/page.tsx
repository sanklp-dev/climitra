"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ALL_STATES, LEAD_CATEGORIES } from "@/lib/geo/adjacency";

const TIERS = ["preferred", "approved", "probation", "blacklisted"] as const;
const FORMS = ["lump", "briquette", "powder"] as const;

interface FormData {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  district: string;
  pinCode: string;
  lat: string;
  lng: string;
  leadCategories: string[];
  charcoalType: string;
  species: string;
  form: string;
  capacityTonsPerMonth: string;
  currentAvailability: string;
  pricePerTon: string;
  pricingBasis: string;
  fixedCarbonPct: string;
  moisturePct: string;
  ashPct: string;
  volatilePct: string;
  tier: string;
  source: string;
  internalRating: string;
  certifications: string;
}

export default function NewSupplierPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({
    businessName: "",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    state: "",
    district: "",
    pinCode: "",
    lat: "",
    lng: "",
    leadCategories: [],
    charcoalType: "",
    species: "",
    form: "",
    capacityTonsPerMonth: "",
    currentAvailability: "",
    pricePerTon: "",
    pricingBasis: "fob",
    fixedCarbonPct: "",
    moisturePct: "",
    ashPct: "",
    volatilePct: "",
    tier: "approved",
    source: "manual",
    internalRating: "",
    certifications: "",
  });

  function updateField(field: keyof FormData, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategory(cat: string) {
    setForm((prev) => {
      const cats = prev.leadCategories.includes(cat)
        ? prev.leadCategories.filter((c) => c !== cat)
        : [...prev.leadCategories, cat];
      return { ...prev, leadCategories: cats };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.businessName.trim()) {
      setError("Business name is required.");
      return;
    }
    if (!form.state) {
      setError("State is required.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        businessName: form.businessName,
        ownerName: form.ownerName || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        state: form.state,
        district: form.district || null,
        pinCode: form.pinCode || null,
        lat: form.lat || null,
        lng: form.lng || null,
        leadCategories: form.leadCategories,
        charcoalType: form.charcoalType || null,
        species: form.species || null,
        form: form.form || null,
        capacityTonsPerMonth: form.capacityTonsPerMonth || null,
        currentAvailability: form.currentAvailability || null,
        pricePerTon: form.pricePerTon || null,
        pricingBasis: form.pricingBasis || "fob",
        fixedCarbonPct: form.fixedCarbonPct || null,
        moisturePct: form.moisturePct || null,
        ashPct: form.ashPct || null,
        volatilePct: form.volatilePct || null,
        tier: form.tier || "approved",
        source: form.source || "manual",
        internalRating: form.internalRating || null,
        certifications: form.certifications
          ? form.certifications.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
      };

      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/suppliers/${data.supplier.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create supplier.");
      }
    } catch (err) {
      console.error("Error creating supplier:", err);
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/suppliers")}>
          &larr; Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Supplier</h1>
          <p className="text-muted-foreground mt-1">Enter supplier details to add them to your network.</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Business Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  placeholder="Enter business name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Owner Name</label>
                <Input
                  value={form.ownerName}
                  onChange={(e) => updateField("ownerName", e.target.value)}
                  placeholder="Enter owner name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="supplier@example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  State <span className="text-destructive">*</span>
                </label>
                <Select
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  required
                >
                  <option value="">Select State</option>
                  {ALL_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">District</label>
                <Input
                  value={form.district}
                  onChange={(e) => updateField("district", e.target.value)}
                  placeholder="Enter district"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                <Textarea
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Full address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PIN Code</label>
                <Input
                  value={form.pinCode}
                  onChange={(e) => updateField("pinCode", e.target.value)}
                  placeholder="6-digit PIN code"
                  maxLength={10}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Latitude</label>
                  <Input
                    type="number"
                    step="any"
                    value={form.lat}
                    onChange={(e) => updateField("lat", e.target.value)}
                    placeholder="e.g., 22.5726"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Longitude</label>
                  <Input
                    type="number"
                    step="any"
                    value={form.lng}
                    onChange={(e) => updateField("lng", e.target.value)}
                    placeholder="e.g., 88.3639"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Lead Categories</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {LEAD_CATEGORIES.map((cat) => (
                    <label key={cat.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.leadCategories.includes(cat.value)}
                        onChange={() => toggleCategory(cat.value)}
                        className="rounded border-gray-300"
                      />
                      {cat.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Charcoal Type</label>
                <Input
                  value={form.charcoalType}
                  onChange={(e) => updateField("charcoalType", e.target.value)}
                  placeholder="e.g., Hardwood Charcoal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Species</label>
                <Input
                  value={form.species}
                  onChange={(e) => updateField("species", e.target.value)}
                  placeholder="e.g., Prosopis, Acacia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Form</label>
                <Select
                  value={form.form}
                  onChange={(e) => updateField("form", e.target.value)}
                >
                  <option value="">Select Form</option>
                  {FORMS.map((f) => (
                    <option key={f} value={f}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Capacity (tons/month)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.capacityTonsPerMonth}
                  onChange={(e) => updateField("capacityTonsPerMonth", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current Availability (tons)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.currentAvailability}
                  onChange={(e) => updateField("currentAvailability", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price per Ton (INR)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.pricePerTon}
                  onChange={(e) => updateField("pricePerTon", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pricing Basis</label>
                <Select
                  value={form.pricingBasis}
                  onChange={(e) => updateField("pricingBasis", e.target.value)}
                >
                  <option value="fob">FOB (Ex-Works)</option>
                  <option value="delivered">Delivered</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Specs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quality Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fixed Carbon %</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.fixedCarbonPct}
                  onChange={(e) => updateField("fixedCarbonPct", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Moisture %</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.moisturePct}
                  onChange={(e) => updateField("moisturePct", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ash %</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.ashPct}
                  onChange={(e) => updateField("ashPct", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Volatile %</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.volatilePct}
                  onChange={(e) => updateField("volatilePct", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Business Classification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tier</label>
                <Select
                  value={form.tier}
                  onChange={(e) => updateField("tier", e.target.value)}
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <Select
                  value={form.source}
                  onChange={(e) => updateField("source", e.target.value)}
                >
                  <option value="manual">Manual</option>
                  <option value="scraped">Scraped</option>
                  <option value="self_registered">Self Registered</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Internal Rating (0-5)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={form.internalRating}
                  onChange={(e) => updateField("internalRating", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Certifications</label>
                <Input
                  value={form.certifications}
                  onChange={(e) => updateField("certifications", e.target.value)}
                  placeholder="Comma-separated, e.g., ISO 9001, FSC"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={submitting} size="lg">
            {submitting ? "Creating Supplier..." : "Create Supplier"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/suppliers")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
