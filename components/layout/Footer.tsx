import { PRODUCT_NAME } from "@/lib/config/brand";

export function Footer() {
  return (
    <footer className="border-t border-neutral-200">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-neutral-600">
        © {new Date().getFullYear()} {PRODUCT_NAME}
      </div>
    </footer>
  );
}
