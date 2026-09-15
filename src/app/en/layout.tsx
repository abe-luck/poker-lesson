import { RootDocument, rootMetadata, rootViewport } from "@/components/RootDocument";
import "../globals.css";

export const metadata = rootMetadata("en");
export const viewport = rootViewport;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument locale="en">{children}</RootDocument>;
}
