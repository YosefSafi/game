import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VOID-CORE",
  description: "Futuristic Survival Protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className="h-full w-full overflow-hidden m-0 p-0">
        {children}
      </body>
    </html>
  );
}
