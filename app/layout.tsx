import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/space-grotesk";
import "./globals.css";

export const metadata: Metadata = {
  title: "MotionLayer — Script to motion graphics",
  description: "Turn a script into a finished motion-graphics video.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body data-motion-design-contract="3ee87bc2">{children}</body>
    </html>
  );
}
