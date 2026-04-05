"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export interface FileUploadProps {
  label: string;
  description?: string;
  accept?: string;
  /** `name` on the file input (for FormData). */
  inputName?: string;
}

export function FileUpload({
  label,
  description,
  accept = "application/pdf,audio/*",
  inputName,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--border-strong)]">
      <p className="text-sm font-medium text-[var(--fg)]">{label}</p>
      {description ? (
        <p className="mt-1 text-xs text-[var(--fg-subtle)]">{description}</p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        name={inputName}
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          setName(f?.name ?? null);
        }}
      />
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
        <span className="truncate text-xs text-[var(--fg-muted)]">
          {name ? (
            <span className="text-[var(--accent)]">{name}</span>
          ) : (
            "No file selected"
          )}
        </span>
      </div>
    </div>
  );
}
