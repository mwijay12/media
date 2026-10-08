"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

export function CopyButton({
  text,
  label = "Copy",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — user can still select manually.
    }
  }

  const content = (
    <>
      {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </>
  );

  if (className) {
    return (
      <button type="button" onClick={copy} className={className}>
        {content}
      </button>
    );
  }

  return (
    <LiquidButton type="button" size="sm" onClick={copy}>
      {content}
    </LiquidButton>
  );
}
