import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Section } from "@/components/layout/Section";
import { PRODUCT_DESCRIPTION, PRODUCT_NAME } from "@/lib/config/brand";

export const metadata: Metadata = {
  title: {
    default: PRODUCT_NAME,
    template: `%s | ${PRODUCT_NAME}`
  },
  description: PRODUCT_DESCRIPTION,
  openGraph: {
    title: PRODUCT_NAME,
    description: PRODUCT_DESCRIPTION,
    siteName: PRODUCT_NAME,
  },
  twitter: {
    title: PRODUCT_NAME,
    description: PRODUCT_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <Section>
          <Container>{children}</Container>
        </Section>
        <Footer />
      </body>
    </html>
  );
}
