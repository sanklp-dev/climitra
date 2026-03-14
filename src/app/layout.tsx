import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Climitra - Supplier Procurement Platform",
  description: "Discover, evaluate, and procure from charcoal suppliers across India",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
