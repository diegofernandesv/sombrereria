"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StockAdjustFormProps {
  variantId: number;
  currentStock: number;
}

export function StockAdjustForm({ variantId, currentStock }: StockAdjustFormProps) {
  const router = useRouter();
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(delta);
    if (isNaN(n) || n === 0) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/variants/${variantId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: n, note }),
      });
      setOpen(false);
      setDelta("");
      setNote("");
      router.refresh();
    } catch {
      alert("Error al ajustar stock");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-[var(--camel)] hover:underline"
      >
        Ajustar
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
      <input
        type="number"
        value={delta}
        onChange={(e) => setDelta(e.target.value)}
        placeholder="±"
        className="w-14 text-xs py-1 px-2 text-center"
        style={{ width: "56px", padding: "4px 8px", fontSize: "12px" }}
        autoFocus
      />
      <button
        type="submit"
        disabled={saving}
        className="text-xs bg-[var(--espresso)] text-[var(--ivory)] px-2 py-1 hover:bg-[var(--espresso-mid)] disabled:opacity-50"
      >
        OK
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-[var(--brown)] hover:text-[var(--espresso)] px-1"
      >
        ✕
      </button>
    </form>
  );
}
