import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Native Components Demo - Drouple",
  description: "Experience native-like components that work across all platforms - web, PWA, mobile, and desktop",
};

export default function NativeDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}