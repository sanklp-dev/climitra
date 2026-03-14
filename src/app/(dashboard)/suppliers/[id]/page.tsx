"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LEAD_CATEGORIES, ALL_STATES } from "@/lib/geo/adjacency";
import type { Supplier, SupplierNote } from "@/lib/db/schema";

const TIERS = ["preferred", "approved", "probation", "blacklisted"] as const;
const STATUSES = ["active", "pending_approval", "inactive"] as const;
const FORMS = ["lump", "briquette", "powder"] as const;
const NOTE_TYPES = ["general", "negotiation", "quality", "visit"] as const;

function tierBadgeVariant(tier: string): "success" | "default" | "warning" | "destructive" {
  switch (tier) {
    case "preferred": return "success";
    case "approved": return "default";
    case "probation": return "warning";
    case "blacklisted": return "destructive";
    default: return "default";
  }
}

function statusBadgeVariant(status: string): "success" | "secondary" | "destructive" {
  switch (status) {
    case "active": return "success";
    case "pending_approval": return "secondary";
    case "inactive": return "destructive";
    default: return "secondary";
  }
}

function RatingStars({ rating }: { rating: number | null }) {
  if (rating === null || rating === undefined) {
    return <span className="text-muted-foreground text-sm">Not rated</span>;
  }
  const numRating = Number(rating);
  const fullStars = Math.floor(numRating);
  const hasHalf = numRating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg key={`full-${i}`} className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
      {hasHalf && (
        <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="halfGradDetail">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#d1d5db" />
            </linearGradient>
          </defs>
          <path
            fill="url(#halfGradDetail)"
            d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
          />
        </svg>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg key={`empty-${i}`} className="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
      <span className="ml-2 text-sm font-medium">{numRating.toFixed(1)} / 5.0</span>
    </div>
  );
}

function getCategoryLabel(value: string): string {
  const cat = LEAD_CATEGORIES.find((c) => c.value === value);
  return cat ? cat.label : value;
}

interface PurchaseOrderSummary {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: string | null;
  createdAt: string;
}

export default function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [notes, setNotes] = useState<SupplierNote[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Supplier>>({});

  // Note form state
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<string>("general");
  const [addingNote, setAddingNote] = useState(false);

  const fetchSupplier = useCallback(async () => {
    try {
      const res = await fetch(`/api/suppliers/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setSupplier(data.supplier || null);
      setEditData(data.supplier || {});
    } catch (error) {
      console.error("Error fetching supplier:", error);
    }
  }, [id]);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/suppliers/notes?supplierId=${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  }, [id]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?supplierId=${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch {
      // Orders endpoint may not exist yet
    }
  }, [id]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchSupplier(), fetchNotes(), fetchOrders()]);
      setLoading(false);
    }
    load();
  }, [fetchSupplier, fetchNotes, fetchOrders]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/suppliers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const data = await res.json();
        setSupplier(data.supplier);
        setEditMode(false);
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote() {
    if (!noteContent.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch("/api/suppliers/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: id,
          content: noteContent,
          type: noteType,
        }),
      });
      if (res.ok) {
        setNoteContent("");
        setNoteType("general");
        await fetchNotes();
      }
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setAddingNote(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to deactivate this supplier?")) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/suppliers");
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading supplier details...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">Supplier not found.</p>
        <Button onClick={() => router.push("/suppliers")}>Back to Suppliers</Button>
      </div>
    );
  }

  const displayValue = (val: string | number | null | undefined, suffix?: string) => {
    if (val === null || val === undefined || val === "") return "-";
    return suffix ? `${val}${suffix}` : String(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/suppliers")}>
            &larr; Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {supplier.businessName}
              </h1>
              <Badge variant={tierBadgeVariant(supplier.tier || "approved")}>
                {supplier.tier || "approved"}
              </Badge>
              <Badge variant={statusBadgeVariant(supplier.status || "active")}>
                {(supplier.status || "active").replace("_", " ")}
              </Badge>
            </div>
            {supplier.ownerName && (
              <p className="text-muted-foreground mt-1">Owner: {supplier.ownerName}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => { setEditMode(false); setEditData(supplier); }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditMode(true)}>
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Deactivate
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                  {editMode ? (
                    <Input
                      value={editData.businessName || ""}
                      onChange={(e) => setEditData({ ...editData, businessName: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1">{supplier.businessName}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Owner Name</label>
                  {editMode ? (
                    <Input
                      value={editData.ownerName || ""}
                      onChange={(e) => setEditData({ ...editData, ownerName: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1">{displayValue(supplier.ownerName)}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  {editMode ? (
                    <Input
                      value={editData.phone || ""}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1">{displayValue(supplier.phone)}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  {editMode ? (
                    <Input
                      value={editData.email || ""}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1">{displayValue(supplier.email)}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source</label>
                  <p className="mt-1">{displayValue(supplier.source)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rating</label>
                  <div className="mt-1">
                    <RatingStars rating={supplier.internalRating ? Number(supplier.internalRating) : null} />
                  </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">State</label>
                  {editMode ? (
                    <Select
                      value={editData.state || ""}
                      onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                    >
                      <option value="">Select State</option>
                      {ALL_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  ) : (
                    <p className="mt-1">{supplier.state}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">District</label>
                  {editMode ? (
                    <Input
                      value={editData.district || ""}
                      onChange={(e) => setEditData({ ...editData, district: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1">{displayValue(supplier.district)}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  {editMode ? (
                    <Textarea
                      value={editData.address || ""}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1">{displayValue(supplier.address)}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">PIN Code</label>
                  {editMode ? (
                    <Input
                      value={editData.pinCode || ""}
                      onChange={(e) => setEditData({ ...editData, pinCode: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1">{displayValue(supplier.pinCode)}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Coordinates</label>
                  {editMode ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Latitude"
                        value={editData.lat || ""}
                        onChange={(e) => setEditData({ ...editData, lat: e.target.value })}
                      />
                      <Input
                        placeholder="Longitude"
                        value={editData.lng || ""}
                        onChange={(e) => setEditData({ ...editData, lng: e.target.value })}
                      />
                    </div>
                  ) : (
                    <p className="mt-1">
                      {supplier.lat && supplier.lng
                        ? `${supplier.lat}, ${supplier.lng}`
                        : "-"}
                    </p>
                  )}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lead Categories</label>
                  {editMode ? (
                    <div className="mt-1 space-y-1">
                      {LEAD_CATEGORIES.map((cat) => (
                        <label key={cat.value} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={((editData.leadCategories as string[]) || []).includes(cat.value)}
                            onChange={(e) => {
                              const current = (editData.leadCategories as string[]) || [];
                              const updated = e.target.checked
                                ? [...current, cat.value]
                                : current.filter((c) => c !== cat.value);
                              setEditData({ ...editData, leadCategories: updated });
                            }}
                            className="rounded border-gray-300"
                          />
                          {cat.label}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(supplier.leadCategories as string[] | null)?.length ? (
                        (supplier.leadCategories as string[]).map((cat) => (
                          <span
                            key={cat}
                            className="inline-block text-xs bg-blue-50 text-blue-700 rounded px-2 py-1"
                          >
                            {getCategoryLabel(cat)}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Charcoal Type</label>
                  {editMode ? (
                    <Input
                      value={editData.charcoalType || ""}
                      onChange={(e) => setEditData({ ...editData, charcoalType: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1">{displayValue(supplier.charcoalType)}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Species</label>
                  {editMode ? (
                    <Input
                      value={editData.species || ""}
                      onChange={(e) => setEditData({ ...editData, species: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1">{displayValue(supplier.species)}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Form</label>
                  {editMode ? (
                    <Select
                      value={editData.form || ""}
                      onChange={(e) => setEditData({ ...editData, form: e.target.value as "lump" | "briquette" | "powder" | null })}
                    >
                      <option value="">Select Form</option>
                      {FORMS.map((f) => (
                        <option key={f} value={f}>
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <p className="mt-1">{displayValue(supplier.form)}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Capacity (tons/month)</label>
                  {editMode ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.capacityTonsPerMonth || ""}
                      onChange={(e) => setEditData({ ...editData, capacityTonsPerMonth: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1">{displayValue(supplier.capacityTonsPerMonth)}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Availability (tons)</label>
                  {editMode ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.currentAvailability || ""}
                      onChange={(e) => setEditData({ ...editData, currentAvailability: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1">{displayValue(supplier.currentAvailability)}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Price per Ton (INR)</label>
                  {editMode ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.pricePerTon || ""}
                      onChange={(e) => setEditData({ ...editData, pricePerTon: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1">
                      {supplier.pricePerTon
                        ? `₹${Number(supplier.pricePerTon).toLocaleString("en-IN")}`
                        : "-"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pricing Basis</label>
                  {editMode ? (
                    <Select
                      value={editData.pricingBasis || "fob"}
                      onChange={(e) => setEditData({ ...editData, pricingBasis: e.target.value as "fob" | "delivered" })}
                    >
                      <option value="fob">FOB</option>
                      <option value="delivered">Delivered</option>
                    </Select>
                  ) : (
                    <p className="mt-1">{(supplier.pricingBasis || "fob").toUpperCase()}</p>
                  )}
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fixed Carbon %</label>
                  {editMode ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.fixedCarbonPct || ""}
                      onChange={(e) => setEditData({ ...editData, fixedCarbonPct: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-lg font-semibold">{displayValue(supplier.fixedCarbonPct, "%")}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Moisture %</label>
                  {editMode ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.moisturePct || ""}
                      onChange={(e) => setEditData({ ...editData, moisturePct: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-lg font-semibold">{displayValue(supplier.moisturePct, "%")}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ash %</label>
                  {editMode ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.ashPct || ""}
                      onChange={(e) => setEditData({ ...editData, ashPct: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-lg font-semibold">{displayValue(supplier.ashPct, "%")}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Volatile %</label>
                  {editMode ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.volatilePct || ""}
                      onChange={(e) => setEditData({ ...editData, volatilePct: e.target.value })}
                    />
                  ) : (
                    <p className="mt-1 text-lg font-semibold">{displayValue(supplier.volatilePct, "%")}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add Note Form */}
              <div className="border rounded-lg p-4 mb-4 space-y-3">
                <h4 className="font-medium text-sm">Add a Note</h4>
                <Textarea
                  placeholder="Write a note about this supplier..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
                <div className="flex items-center gap-3">
                  <Select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value)}
                    className="w-40"
                  >
                    {NOTE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={addingNote || !noteContent.trim()}
                  >
                    {addingNote ? "Adding..." : "Add Note"}
                  </Button>
                </div>
              </div>

              {/* Notes List */}
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {note.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Business Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tier</label>
                {editMode ? (
                  <Select
                    value={editData.tier || "approved"}
                    onChange={(e) => setEditData({ ...editData, tier: e.target.value as typeof TIERS[number] })}
                  >
                    {TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge variant={tierBadgeVariant(supplier.tier || "approved")} className="text-sm">
                      {supplier.tier || "approved"}
                    </Badge>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                {editMode ? (
                  <Select
                    value={editData.status || "active"}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value as typeof STATUSES[number] })}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge variant={statusBadgeVariant(supplier.status || "active")}>
                      {(supplier.status || "active").replace("_", " ")}
                    </Badge>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Internal Rating</label>
                {editMode ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={editData.internalRating || ""}
                    onChange={(e) => setEditData({ ...editData, internalRating: e.target.value })}
                  />
                ) : (
                  <div className="mt-1">
                    <RatingStars rating={supplier.internalRating ? Number(supplier.internalRating) : null} />
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Certifications</label>
                {editMode ? (
                  <Input
                    placeholder="Comma-separated"
                    value={((editData.certifications as string[]) || []).join(", ")}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        certifications: e.target.value
                          .split(",")
                          .map((c) => c.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                ) : (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(supplier.certifications as string[] | null)?.length ? (
                      (supplier.certifications as string[]).map((cert) => (
                        <Badge key={cert} variant="outline" className="text-xs">
                          {cert}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">None</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="mt-1 text-sm">
                  {new Date(supplier.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="mt-1 text-sm">
                  {new Date(supplier.updatedAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Related Purchase Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No purchase orders yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{order.poNumber}</span>
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                      {order.totalAmount && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                className="w-full mt-3"
                size="sm"
                onClick={() => router.push(`/orders?supplierId=${id}`)}
              >
                View All Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
