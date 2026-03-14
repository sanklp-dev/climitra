"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ALL_STATES, LEAD_CATEGORIES } from "@/lib/geo/adjacency";

interface FormData {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  state: string;
  district: string;
  pinCode: string;
  leadCategories: string[];
  charcoalType: string;
  species: string;
  form: string;
  capacityTonsPerMonth: string;
  pricePerTon: string;
  fixedCarbonPct: string;
  moisturePct: string;
  ashPct: string;
  volatilePct: string;
  certifications: string;
}

const initialFormData: FormData = {
  businessName: "",
  ownerName: "",
  phone: "",
  email: "",
  address: "",
  state: "",
  district: "",
  pinCode: "",
  leadCategories: [],
  charcoalType: "",
  species: "",
  form: "",
  capacityTonsPerMonth: "",
  pricePerTon: "",
  fixedCarbonPct: "",
  moisturePct: "",
  ashPct: "",
  volatilePct: "",
  certifications: "",
};

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategory(category: string) {
    setFormData((prev) => ({
      ...prev,
      leadCategories: prev.leadCategories.includes(category)
        ? prev.leadCategories.filter((c) => c !== category)
        : [...prev.leadCategories, category],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!formData.businessName.trim()) {
      setError("Business name is required");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required");
      return;
    }
    if (!formData.state) {
      setError("State is required");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: formData.businessName,
          ownerName: formData.ownerName || undefined,
          phone: formData.phone,
          email: formData.email || undefined,
          address: formData.address || undefined,
          state: formData.state,
          district: formData.district || undefined,
          pinCode: formData.pinCode || undefined,
          leadCategories: formData.leadCategories,
          charcoalType: formData.charcoalType || undefined,
          species: formData.species || undefined,
          form: formData.form || undefined,
          capacityTonsPerMonth: formData.capacityTonsPerMonth || undefined,
          pricePerTon: formData.pricePerTon || undefined,
          fixedCarbonPct: formData.fixedCarbonPct || undefined,
          moisturePct: formData.moisturePct || undefined,
          ashPct: formData.ashPct || undefined,
          volatilePct: formData.volatilePct || undefined,
          certifications: formData.certifications || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit registration");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <CardTitle className="text-xl">Registration Submitted</CardTitle>
            <CardDescription className="mt-2 text-base">
              Thank you for registering with Climitra. Your application has been
              submitted and is pending approval. Our team will review your
              details and get back to you shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => { setSubmitted(false); setFormData(initialFormData); }}>
              Submit Another Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Climitra</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Supplier Procurement Platform
        </p>
        <h2 className="mt-4 text-xl font-semibold">Supplier Registration</h2>
        <p className="mt-1 text-muted-foreground">
          Register as a supplier to join the Climitra network
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Business Information</CardTitle>
            <CardDescription>
              Basic details about your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Business Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                placeholder="Enter your business name"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Owner Name
                </label>
                <Input
                  value={formData.ownerName}
                  onChange={(e) => updateField("ownerName", e.target.value)}
                  placeholder="Owner / contact person"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Phone <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Location</CardTitle>
            <CardDescription>
              Where is your business located?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Address
              </label>
              <Textarea
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Full business address"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  State <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  required
                >
                  <option value="">Select state</option>
                  {ALL_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  District
                </label>
                <Input
                  value={formData.district}
                  onChange={(e) => updateField("district", e.target.value)}
                  placeholder="District"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Pin Code
                </label>
                <Input
                  value={formData.pinCode}
                  onChange={(e) => updateField("pinCode", e.target.value)}
                  placeholder="6-digit pin"
                  maxLength={6}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Category</CardTitle>
            <CardDescription>
              Select the categories that best describe your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {LEAD_CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.leadCategories.includes(cat.value)}
                    onChange={() => toggleCategory(cat.value)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{cat.label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Product Details</CardTitle>
            <CardDescription>
              Information about the charcoal you produce
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Charcoal Type
                </label>
                <Input
                  value={formData.charcoalType}
                  onChange={(e) => updateField("charcoalType", e.target.value)}
                  placeholder="e.g., Hardwood, Coconut shell"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Species
                </label>
                <Input
                  value={formData.species}
                  onChange={(e) => updateField("species", e.target.value)}
                  placeholder="e.g., Acacia, Prosopis"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Form
                </label>
                <Select
                  value={formData.form}
                  onChange={(e) => updateField("form", e.target.value)}
                >
                  <option value="">Select form</option>
                  <option value="lump">Lump</option>
                  <option value="briquette">Briquette</option>
                  <option value="powder">Powder</option>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Capacity (tons/month)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.capacityTonsPerMonth}
                  onChange={(e) =>
                    updateField("capacityTonsPerMonth", e.target.value)
                  }
                  placeholder="e.g., 50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Price per Ton (INR)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.pricePerTon}
                  onChange={(e) => updateField("pricePerTon", e.target.value)}
                  placeholder="e.g., 15000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Specifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quality Specifications</CardTitle>
            <CardDescription>
              Typical quality parameters of your product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Fixed Carbon %
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.fixedCarbonPct}
                  onChange={(e) =>
                    updateField("fixedCarbonPct", e.target.value)
                  }
                  placeholder="e.g., 75"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Moisture %
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.moisturePct}
                  onChange={(e) => updateField("moisturePct", e.target.value)}
                  placeholder="e.g., 5"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Ash %
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.ashPct}
                  onChange={(e) => updateField("ashPct", e.target.value)}
                  placeholder="e.g., 3"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Volatile %
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.volatilePct}
                  onChange={(e) => updateField("volatilePct", e.target.value)}
                  placeholder="e.g., 15"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Certifications</CardTitle>
            <CardDescription>
              List any certifications your business holds
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={formData.certifications}
              onChange={(e) => updateField("certifications", e.target.value)}
              placeholder="e.g., ISO 9001, FSC, REACH (comma-separated)"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-center pb-8">
          <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto min-w-[200px]">
            {submitting ? "Submitting..." : "Submit Registration"}
          </Button>
        </div>
      </form>
    </div>
  );
}
