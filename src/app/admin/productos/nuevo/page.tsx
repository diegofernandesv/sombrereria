"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, X } from "lucide-react";
import { PRODUCT_TYPE_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

// ─── tipos ───────────────────────────────────────────────────────────────────

interface Variant {
  id: string;
  color: string;
  size: string;
  sku: string;
  price: string;
  stock: string;
  lowStockThreshold: string;
}

interface ImportResult {
  ok: boolean;
  summary: { total: number; created: number; skipped: number; errors: number };
  details: { created: string[]; skipped: string[]; errors: string[] };
}

const PRODUCT_TYPES = Object.entries(PRODUCT_TYPE_LABELS);

const emptyVariant = (): Variant => ({
  id: crypto.randomUUID(),
  color: "",
  size: "",
  sku: "",
  price: "",
  stock: "",
  lowStockThreshold: "3",
});

// ─── componente principal ─────────────────────────────────────────────────────

export default function NuevoProductoPage() {
  const router = useRouter();

  // tabs
  const [tab, setTab] = useState<"manual" | "excel">("manual");

  // ── formulario manual ──
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("PANAMA");
  const [variants, setVariants] = useState<Variant[]>([emptyVariant()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ── importación Excel ──
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState("");

  // ─── handlers formulario manual ────────────────────────────────────────────

  function updateVariant(id: string, field: keyof Variant, value: string) {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  }

  function removeVariant(id: string) {
    if (variants.length === 1) return;
    setVariants((prev) => prev.filter((v) => v.id !== id));
  }

  function autoFillSku(id: string) {
    const v = variants.find((x) => x.id === id);
    if (!v || v.sku) return;
    const prefix = name.slice(0, 3).toUpperCase().replace(/\s/g, "");
    const color = v.color.slice(0, 3).toUpperCase();
    const size = v.size.toUpperCase();
    if (prefix && color && size) {
      updateVariant(id, "sku", `${prefix}-${color}-${size}`);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) return setFormError("El nombre es requerido.");
    const incomplete = variants.find((v) => !v.color || !v.size || !v.sku || !v.price);
    if (incomplete) return setFormError("Completá todos los campos de las variantes.");

    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          type,
          variants: variants.map((v) => ({
            color: v.color,
            size: v.size,
            sku: v.sku,
            price: Number(v.price),
            stock: Number(v.stock) || 0,
            lowStockThreshold: Number(v.lowStockThreshold) || 3,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al guardar");
      router.push("/admin/productos");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  // ─── handlers Excel ────────────────────────────────────────────────────────

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setImportError("");
    setImportResult(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al importar");
      setImportResult(data);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setImporting(false);
    }
  }

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-2 text-sm text-[var(--brown)] hover:text-[var(--espresso)] mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Volver a productos
      </Link>

      <div className="mb-8">
        <h1 className="font-serif text-2xl font-light text-[var(--espresso)]">
          Nuevo producto
        </h1>
        <p className="text-sm text-[var(--brown)] mt-1">
          Cargá manualmente o importá desde un archivo Excel.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] mb-8">
        {[
          { key: "manual", label: "Carga manual" },
          { key: "excel", label: "Importar desde Excel" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "manual" | "excel")}
            className={`px-5 py-3 text-sm transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? "border-[var(--camel)] text-[var(--espresso)] font-medium"
                : "border-transparent text-[var(--brown)] hover:text-[var(--espresso)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB MANUAL ─────────────────────────────────────────────────────── */}
      {tab === "manual" && (
        <form onSubmit={handleManualSubmit} className="space-y-8">
          {/* Datos del producto */}
          <div className="bg-white border border-[var(--border)] rounded p-6">
            <h2 className="font-serif text-base font-light text-[var(--espresso)] mb-5">
              Datos del producto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-[0.1em] text-[var(--brown)] mb-1.5">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Panamá Classic"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.1em] text-[var(--brown)] mb-1.5">
                  Tipo *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {PRODUCT_TYPES.map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-[0.1em] text-[var(--brown)] mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Descripción del producto..."
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          </div>

          {/* Variantes */}
          <div className="bg-white border border-[var(--border)] rounded p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-base font-light text-[var(--espresso)]">
                Variantes ({variants.length})
              </h2>
              <button
                type="button"
                onClick={() => setVariants((v) => [...v, emptyVariant()])}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--camel)] hover:text-[var(--espresso)] transition-colors"
              >
                <Plus size={14} />
                Agregar variante
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, i) => (
                <div
                  key={variant.id}
                  className="grid grid-cols-2 md:grid-cols-7 gap-3 items-end pb-4 border-b border-[var(--border)] last:border-0 last:pb-0"
                >
                  {/* Color */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] uppercase tracking-[0.1em] text-[var(--brown)] mb-1">
                      Color *
                    </label>
                    <input
                      type="text"
                      value={variant.color}
                      onChange={(e) => updateVariant(variant.id, "color", e.target.value)}
                      onBlur={() => autoFillSku(variant.id)}
                      placeholder="natural"
                    />
                  </div>

                  {/* Talla */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] text-[var(--brown)] mb-1">
                      Talla *
                    </label>
                    <input
                      type="text"
                      value={variant.size}
                      onChange={(e) => updateVariant(variant.id, "size", e.target.value)}
                      onBlur={() => autoFillSku(variant.id)}
                      placeholder="M"
                    />
                  </div>

                  {/* SKU */}
                  <div className="col-span-1 md:col-span-1">
                    <label className="block text-[10px] uppercase tracking-[0.1em] text-[var(--brown)] mb-1">
                      SKU *
                    </label>
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => updateVariant(variant.id, "sku", e.target.value)}
                      placeholder="PAN-NAT-M"
                      className="font-mono"
                      style={{ fontFamily: "monospace" }}
                    />
                  </div>

                  {/* Precio */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] text-[var(--brown)] mb-1">
                      Precio *
                    </label>
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) => updateVariant(variant.id, "price", e.target.value)}
                      placeholder="15000"
                      min="0"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] text-[var(--brown)] mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={variant.stock}
                      onChange={(e) => updateVariant(variant.id, "stock", e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  {/* Eliminar */}
                  <div className="flex items-end pb-0.5">
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      disabled={variants.length === 1}
                      className="p-2 text-[var(--brown)] hover:text-red-600 transition-colors disabled:opacity-30"
                      title="Eliminar variante"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-[var(--brown)] opacity-60 mt-3">
              El SKU se genera automáticamente al completar color y talla si está vacío.
            </p>
          </div>

          {/* Error */}
          {formError && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-3">
              <AlertCircle size={16} />
              {formError}
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3">
            <Button type="submit" loading={saving} size="lg">
              Guardar producto
            </Button>
            <Link href="/admin/productos">
              <Button type="button" variant="ghost" size="lg">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      )}

      {/* ── TAB EXCEL ──────────────────────────────────────────────────────── */}
      {tab === "excel" && (
        <div className="space-y-6">
          {/* Instrucciones + template */}
          <div className="bg-white border border-[var(--border)] rounded p-6">
            <h2 className="font-serif text-base font-light text-[var(--espresso)] mb-4">
              Formato del archivo
            </h2>

            <p className="text-sm text-[var(--brown)] mb-4 leading-relaxed">
              Cada fila representa una <strong>variante</strong>. Si un producto tiene múltiples
              colores o tallas, repetí el nombre del producto en varias filas.
            </p>

            {/* Preview tabla */}
            <div className="overflow-x-auto mb-5">
              <table className="text-xs w-full border border-[var(--border)]">
                <thead>
                  <tr className="bg-[var(--ivory-dark)]">
                    {["nombre","tipo","descripcion","color","talla","precio","stock","sku","umbral_stock"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-[var(--espresso)] border-r border-[var(--border)] last:border-0 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Panamá Classic","PANAMA","Descripción...","natural","M","15000","10","PAN-NAT-M","3"],
                    ["Panamá Classic","PANAMA","Descripción...","natural","L","15000","8","PAN-NAT-L","3"],
                    ["Fedora Negro","FEDORA","Descripción...","negro","S","18000","5","FED-NEG-S","2"],
                  ].map((row, i) => (
                    <tr key={i} className="border-t border-[var(--border)] hover:bg-[var(--ivory)]">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-1.5 text-[var(--brown)] border-r border-[var(--border)] last:border-0 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/api/admin/products/import"
                download="template_productos.xlsx"
                className="inline-flex items-center gap-2 text-sm border border-[var(--espresso)] text-[var(--espresso)] px-4 py-2 hover:bg-[var(--espresso)] hover:text-[var(--ivory)] transition-colors"
              >
                <Download size={14} />
                Descargar template Excel
              </a>
              <p className="text-xs text-[var(--brown)]">
                Tipos válidos: {Object.keys(PRODUCT_TYPE_LABELS).join(", ")}
              </p>
            </div>
          </div>

          {/* Upload */}
          <div className="bg-white border border-[var(--border)] rounded p-6">
            <h2 className="font-serif text-base font-light text-[var(--espresso)] mb-4">
              Subir archivo
            </h2>

            {/* Drop zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded cursor-pointer transition-colors text-center py-10 px-6 mb-4 ${
                file
                  ? "border-[var(--camel)] bg-amber-50"
                  : "border-[var(--border)] hover:border-[var(--camel)] hover:bg-[var(--ivory-dark)]"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); setImportResult(null); setImportError(""); }
                }}
              />

              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet size={32} className="text-[var(--camel)]" />
                  <p className="text-sm font-medium text-[var(--espresso)]">{file.name}</p>
                  <p className="text-xs text-[var(--brown)]">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setImportResult(null); }}
                    className="mt-1 text-xs text-red-600 hover:underline flex items-center gap-1"
                  >
                    <X size={12} /> Cambiar archivo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={28} className="text-[var(--brown)] opacity-50" />
                  <p className="text-sm text-[var(--brown)]">
                    Arrastrá el archivo aquí o <span className="text-[var(--camel)] underline">seleccioná uno</span>
                  </p>
                  <p className="text-xs text-[var(--brown)] opacity-60">.xlsx · .xls · .csv</p>
                </div>
              )}
            </div>

            {/* Error de importación */}
            {importError && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-4 py-3 mb-4">
                <AlertCircle size={16} />
                {importError}
              </div>
            )}

            {/* Resultado */}
            {importResult && (
              <div className="mb-4 rounded border border-[var(--border)] overflow-hidden">
                <div className="bg-[var(--ivory-dark)] px-5 py-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm font-medium text-[var(--espresso)]">
                    Importación completada
                  </span>
                </div>
                <div className="p-5 grid grid-cols-4 gap-4 text-center text-sm">
                  {[
                    { label: "Total", val: importResult.summary.total, color: "" },
                    { label: "Creados", val: importResult.summary.created, color: "text-green-700" },
                    { label: "Omitidos", val: importResult.summary.skipped, color: "text-amber-700" },
                    { label: "Errores", val: importResult.summary.errors, color: "text-red-700" },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className={`text-2xl font-serif ${s.color}`}>{s.val}</p>
                      <p className="text-xs text-[var(--brown)]">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Detalles */}
                {(importResult.details.skipped.length > 0 || importResult.details.errors.length > 0) && (
                  <div className="border-t border-[var(--border)] px-5 py-3 space-y-2">
                    {importResult.details.skipped.map((msg, i) => (
                      <p key={i} className="text-xs text-amber-700">⚠ {msg}</p>
                    ))}
                    {importResult.details.errors.map((msg, i) => (
                      <p key={i} className="text-xs text-red-700">✗ {msg}</p>
                    ))}
                  </div>
                )}

                {importResult.summary.created > 0 && (
                  <div className="border-t border-[var(--border)] px-5 py-3 flex justify-end">
                    <Link
                      href="/admin/productos"
                      className="text-sm text-[var(--camel)] hover:underline"
                    >
                      Ver productos creados →
                    </Link>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleImport}
              loading={importing}
              disabled={!file || !!importResult}
              size="lg"
            >
              <Upload size={16} />
              {importing ? "Importando..." : "Importar productos"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
