import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panchabhoota",
  description: "Elemental territory in the war of Deva and Asura."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
