"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";

const HIDE_HEADER_PARAM = "hideDbpHeader";
const HIDE_HEADER_VALUE = "1";

export function SiteHeaderGate() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isPublicPreviewRoute = pathname.startsWith("/demo/") || pathname.startsWith("/p/");
  const shouldHideHeader =
    isPublicPreviewRoute && searchParams.get(HIDE_HEADER_PARAM) === HIDE_HEADER_VALUE;

  if (shouldHideHeader) {
    return null;
  }

  return <Header />;
}
