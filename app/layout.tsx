import "@/styles/globals.css";
import "antd/dist/reset.css";
import "@/styles/antd.css";
import clsx from "clsx";
import { Metadata, Viewport } from "next";
import { Belanosima } from "next/font/google";

import { Providers } from "./providers";

import NavBar from "@/components/NavBar";

const belanosima = Belanosima({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-belanosima",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Aigree",
    template: `%s - Aigree`,
  },
  icons: {
    icon: "/aigree-logo.webp",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning
      className={clsx(belanosima.variable)}
      lang="en"
    >
      <head />
      <body
        className={clsx(
          "min-h-screen bg-background antialiased font-belanosima",
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <main className="relative flex flex-col h-screen">
            <NavBar />
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
