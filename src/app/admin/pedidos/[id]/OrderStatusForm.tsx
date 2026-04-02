"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_LABELS } from "@/lib/utils";

const STATUSES = ["PENDING", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"];

interface OrderStatusFormProps {
  orderId: string;
  currentStatus: string;
}

export function OrderStatusForm({ orderId, currentStatus }: OrderStatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (status === currentStatus) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } catch {
      alert("Error al actualizar el estado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={{ fontSize: "14px" }}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s] ?? s}
          </option>
        ))}
      </select>
      {status !== currentStatus && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[var(--espresso)] text-[var(--ivory)] py-2 text-sm hover:bg-[var(--espresso-mid)] disabled:opacity-50 transition-colors"
        >
          {saving ? "Guardando..." : "Actualizar estado"}
        </button>
      )}
    </div>
  );
}
