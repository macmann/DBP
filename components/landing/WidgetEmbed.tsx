"use client";

import { useEffect, useRef } from "react";

type WidgetEmbedProps = {
  html: string;
};

export function WidgetEmbed({ html }: WidgetEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.innerHTML = "";

    if (!html.trim()) {
      return;
    }

    const template = document.createElement("template");
    template.innerHTML = html;

    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const scriptElements = Array.from(fragment.querySelectorAll("script"));

    for (const originalScript of scriptElements) {
      const nextScript = document.createElement("script");

      for (const { name, value } of Array.from(originalScript.attributes)) {
        nextScript.setAttribute(name, value);
      }

      if (originalScript.textContent) {
        nextScript.textContent = originalScript.textContent;
      }

      originalScript.replaceWith(nextScript);
    }

    container.appendChild(fragment);
  }, [html]);

  return <div ref={containerRef} className="w-full" />;
}
