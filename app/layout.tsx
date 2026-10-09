import type { Metadata } from "next";
import "./ds.css";
import "./hims-theme.css";
import "./app.css";

export const metadata: Metadata = {
  title: "Sevana HIMS",
  description: "Hospital information management system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
