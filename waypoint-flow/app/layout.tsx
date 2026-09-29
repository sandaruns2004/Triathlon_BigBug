import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  title:       "Waypoint Flow — Connected Delivery Operations",
  description: "Waypoint Group's delivery planning and execution platform for dispatchers, loaders, drivers, and store managers.",
  manifest:    "/manifest.json",
};

export const viewport = {
  themeColor: "#146B45",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
