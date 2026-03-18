import { Container } from "@/components/layout/Container";
import { PRODUCT_NAME } from "@/lib/config/brand";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-elevated">
      <Container className="py-8 text-sm text-muted">© {new Date().getFullYear()} {PRODUCT_NAME}</Container>
    </footer>
  );
}
