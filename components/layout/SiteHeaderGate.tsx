"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";

const SHOW_HEADER_PARAM = "showDbpHeader";
const SHOW_HEADER_VALUE = "1";
const HIDE_HEADER_PARAM = "hideDbpHeader";
const HIDE_HEADER_VALUE = "1";

export function SiteHeaderGate() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isPublicPreviewRoute = pathname.startsWith("/demo/") || pathname.startsWith("/p/");
  const isLegacyHideEnabled = searchParams.get(HIDE_HEADER_PARAM) === HIDE_HEADER_VALUE;
  const isShowEnabled = searchParams.get(SHOW_HEADER_PARAM) === SHOW_HEADER_VALUE;
  const shouldHideHeader = isPublicPreviewRoute && (isLegacyHideEnabled || !isShowEnabled);

  if (shouldHideHeader) {
    return null;
  }

  return <Header />;
}
