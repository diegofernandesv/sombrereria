"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface CartItem {
  id: string;
  quantity: number;
  variant: {
    price: string;
    color: string;
    size: string;
    product: { name: string; images: string[] };
  };
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  zip: string;
}

const PROVINCES = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba",
  "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
  "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan",
  "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucumán",
];

export default function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "", email: "", phone: "",
    street: "", city: "", province: "Buenos Aires", zip: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then((data) => setItems(data?.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.variant.price) * item.quantity,
    0
  );

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Requerido";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Email inválido";
    if (!form.street.trim()) e.street = "Requerido";
    if (!form.city.trim()) e.city = "Requerido";
    if (!form.zip.trim()) e.zip = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // 1. Crear orden
      const orderRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          shippingAddress: {
            street: form.street,
            city: form.city,
            province: form.province,
            zip: form.zip,
          },
        }),
      });

      if (!orderRes.ok) throw new Error("Error al crear la orden");
      const { orderId } = await orderRes.json();

      // 2. Crear preferencia de pago
      const payRes = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!payRes.ok) throw new Error("Error al iniciar el pago");
      const { checkoutUrl } = await payRes.json();

      // 3. Redirigir a MercadoPago
      window.location.href = checkoutUrl;
    } catch {
      alert("Ocurrió un error. Por favor intentá de nuevo.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-14 animate-pulse">
        <div className="h-10 bg-[var(--ivory-dark)] w-48 mb-10" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-5 md:px-8 py-20 text-center">
        <p className="font-serif text-2xl font-light text-[var(--espresso)] mb-4">
          No hay productos en el carrito
        </p>
        <Link href="/productos" className="text-sm text-[var(--camel)] underline">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 md:py-14">
      <Link
        href="/carrito"
        className="inline-flex items-center gap-2 text-sm text-[var(--brown)] hover:text-[var(--espresso)] mb-8 transition-colors"
      >
        <ArrowLeft size={14} />
        Volver al carrito
      </Link>

      <h1 className="font-serif text-3xl md:text-4xl font-light text-[var(--espresso)] mb-10">
        Finalizar compra
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-3 gap-10 md:gap-16">
          {/* Formulario */}
          <div className="md:col-span-2 space-y-8">
            {/* Datos personales */}
            <div>
              <h2 className="font-serif text-xl font-light text-[var(--espresso)] mb-5 pb-2 border-b border-[var(--border)]">
                Datos de contacto
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--brown)] mb-1.5">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Juan García"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--brown)] mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="juan@email.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--brown)] mb-1.5">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>
              </div>
            </div>

            {/* Dirección de envío */}
            <div>
              <h2 className="font-serif text-xl font-light text-[var(--espresso)] mb-5 pb-2 border-b border-[var(--border)]">
                Dirección de envío
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--brown)] mb-1.5">
                    Calle y número *
                  </label>
                  <input
                    type="text"
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="Av. Corrientes 1234, piso 3"
                  />
                  {errors.street && (
                    <p className="text-xs text-red-600 mt-1">{errors.street}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.1em] text-[var(--brown)] mb-1.5">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="Buenos Aires"
                    />
                    {errors.city && (
                      <p className="text-xs text-red-600 mt-1">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-[0.1em] text-[var(--brown)] mb-1.5">
                      Código postal *
                    </label>
                    <input
                      type="text"
                      value={form.zip}
                      onChange={(e) => setForm({ ...form, zip: e.target.value })}
                      placeholder="1043"
                    />
                    {errors.zip && (
                      <p className="text-xs text-red-600 mt-1">{errors.zip}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-[0.1em] text-[var(--brown)] mb-1.5">
                    Provincia *
                  </label>
                  <select
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen del pedido */}
          <div>
            <div className="bg-[var(--ivory-dark)] p-6 sticky top-24">
              <h2 className="font-serif text-lg font-light text-[var(--espresso)] mb-5">
                Tu pedido
              </h2>

              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[var(--brown)] leading-tight">
                      {item.variant.product.name}
                      <br />
                      <span className="text-xs capitalize">
                        {item.variant.color} · {item.variant.size} · ×{item.quantity}
                      </span>
                    </span>
                    <span className="text-[var(--espresso)] shrink-0 ml-2">
                      {formatPrice(Number(item.variant.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--border)] pt-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--brown)]">Subtotal</span>
                  <span className="font-serif text-lg text-[var(--espresso)]">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="text-xs text-[var(--brown)] mt-1">
                  + envío a calcular
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                loading={submitting}
                className="w-full"
              >
                <Lock size={14} />
                Pagar con MercadoPago
              </Button>

              <p className="text-[10px] text-[var(--brown)] text-center mt-3 leading-relaxed">
                Al continuar aceptás nuestras condiciones de compra.
                Pago seguro con cifrado SSL.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
