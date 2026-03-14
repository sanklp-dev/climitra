"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Supplier } from "@/lib/db/schema";

// Fix Leaflet default icon issue in Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Tier-based marker colors
const TIER_COLORS: Record<string, string> = {
  preferred: "#22c55e",   // green
  approved: "#3b82f6",    // blue
  probation: "#eab308",   // yellow
  blacklisted: "#ef4444", // red
};

function createMarkerIcon(tier: string): L.DivIcon {
  const color = TIER_COLORS[tier] || TIER_COLORS.approved;
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

interface SupplierMapProps {
  suppliers: Supplier[];
  center?: [number, number];
  zoom?: number;
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function SupplierMap({
  suppliers,
  center = [22, 80],
  zoom = 5,
}: SupplierMapProps) {
  const suppliersWithCoords = suppliers.filter(
    (s) => s.lat && s.lng && Number(s.lat) !== 0 && Number(s.lng) !== 0
  );

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%", minHeight: "500px" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={center} zoom={zoom} />
      {suppliersWithCoords.map((supplier) => (
        <Marker
          key={supplier.id}
          position={[Number(supplier.lat), Number(supplier.lng)]}
          icon={createMarkerIcon(supplier.tier || "approved")}
        >
          <Popup>
            <div className="min-w-[200px]">
              <h3 className="font-bold text-sm mb-1">{supplier.businessName}</h3>
              <div className="text-xs space-y-1">
                <p>
                  <span className="font-medium">State:</span> {supplier.state}
                  {supplier.district ? `, ${supplier.district}` : ""}
                </p>
                {supplier.capacityTonsPerMonth && (
                  <p>
                    <span className="font-medium">Capacity:</span>{" "}
                    {Number(supplier.capacityTonsPerMonth).toFixed(1)} tons/mo
                  </p>
                )}
                {supplier.pricePerTon && (
                  <p>
                    <span className="font-medium">Price:</span>{" "}
                    ₹{Number(supplier.pricePerTon).toLocaleString("en-IN")}/ton
                  </p>
                )}
                <p>
                  <span className="font-medium">Tier:</span>{" "}
                  <span
                    style={{
                      color: TIER_COLORS[supplier.tier || "approved"],
                      fontWeight: 600,
                    }}
                  >
                    {(supplier.tier || "approved").charAt(0).toUpperCase() +
                      (supplier.tier || "approved").slice(1)}
                  </span>
                </p>
                {supplier.ownerName && (
                  <p>
                    <span className="font-medium">Owner:</span> {supplier.ownerName}
                  </p>
                )}
                {supplier.phone && (
                  <p>
                    <span className="font-medium">Phone:</span> {supplier.phone}
                  </p>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
