"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { btnSecondary } from "@/components/ui-classes";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
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

  return (
    <button type="button" onClick={copy} className={btnSecondary}>
      {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}
