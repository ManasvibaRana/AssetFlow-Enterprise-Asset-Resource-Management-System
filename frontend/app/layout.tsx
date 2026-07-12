import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "AssetFlow · Assets", description: "Enterprise asset lifecycle management" };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
