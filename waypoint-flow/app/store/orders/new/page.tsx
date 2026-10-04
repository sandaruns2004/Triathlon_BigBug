"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, envelope, submit, BrowserApiError } from "@/lib/mobile/browser";
import { Search, ShoppingCart, Package, Snowflake, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";

interface Product {
  productId: string;
  name: string;
  unit: string;
  weightKg: number;
  volumeM3: number;
  temperature: string;
  maxQuantity: number;
  available: boolean;
}

interface Catalogue {
  revision: number;
  products: Product[];
  outlet: { outletId: string; name: string; brand: string };
  serviceOptions: { cutoff: string; version: number; serviceDates: string[] };
}

export default function NewOrderPage() {
  const router = useRouter();
  const request = useRef<any>();

  const [catalogue, setCatalogue] = useState<Catalogue>();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "info">("info");
  const [canCorrect, setCanCorrect] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("store/catalogue")
      .then((d: Catalogue) => {
        setCatalogue(d);
        setDate(d.serviceOptions.serviceDates[0] ?? "");
        setLoading(false);
      })
      .catch((e: Error) => {
        setMessage(e.message);
        setMessageType("error");
        setLoading(false);
      });
  }, []);

  const filteredProducts = catalogue?.products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const totalUnits = Object.values(cart).reduce((n, q) => n + q, 0);
  const cartProducts = catalogue?.products.filter((p) => (cart[p.productId] ?? 0) > 0) ?? [];
  const totalWeight = cartProducts.reduce((n, p) => n + p.weightKg * (cart[p.productId] ?? 0), 0);
  const totalVolume = cartProducts.reduce((n, p) => n + p.volumeM3 * (cart[p.productId] ?? 0), 0);
  const hasChilled = cartProducts.some((p) => ["reefer", "chilled", "frozen"].includes(p.temperature));

  async function save() {
    if (busy || !catalogue || !date) return;
    if (totalUnits === 0) {
      setMessage("Add at least one product before submitting.");
      setMessageType("error");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      request.current ??= envelope(
        "store_order_created",
        {
          requestedDate: date,
          catalogueRevision: catalogue.revision,
          serviceOptionsVersion: catalogue.serviceOptions.version,
          note: "",
          lines: catalogue.products
            .filter((p) => (cart[p.productId] ?? 0) > 0)
            .map((p) => ({ productId: p.productId, quantity: cart[p.productId], unit: p.unit })),
        }
      );
      const receipt = await submit(request.current);
      router.push("/store/orders/" + receipt.orderId);
    } catch (e) {
      setCanCorrect(e instanceof BrowserApiError && (e as BrowserApiError).httpStatus === 422);
      setMessage((e as Error).message);
      setMessageType("error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-wp-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-wp-muted text-sm">Loading catalogue…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Page header ── */}
      <div className="px-8 pt-8 pb-4 border-b border-wp-border bg-wp-canvas">
        <div className="flex items-start justify-between max-w-screen-xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-wp-ink">Create order</h1>
            <p className="text-sm text-wp-muted mt-1">
              {catalogue?.outlet.name} · {catalogue?.outlet.brand} Brand
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-wp-muted">Order cut-off</p>
            <p className="text-sm font-semibold text-wp-ink">{catalogue?.serviceOptions.cutoff} Asia/Colombo</p>
          </div>
        </div>

        {/* Date selector */}
        <div className="max-w-screen-xl mx-auto mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-wp-ink">
            Requested date
            <select
              disabled={busy || !!request.current}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="ml-2 border border-wp-border rounded-md px-3 py-2 text-sm bg-white text-wp-ink focus:outline-none focus:ring-2 focus:ring-wp-green"
            >
              {catalogue?.serviceOptions.serviceDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* ── Error / info banner ── */}
      {message && (
        <div className={`mx-8 mt-4 max-w-screen-xl mx-auto px-4 py-3 rounded-card flex items-start gap-3 text-sm ${
          messageType === "error"
            ? "bg-red-50 border border-red-200 text-red-700"
            : "bg-wp-pale border border-green-200 text-wp-success"
        }`}>
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            {message}
            {canCorrect && (
              <button
                disabled={busy}
                onClick={() => {
                  request.current = undefined;
                  setCanCorrect(false);
                  setMessage("Review the catalogue and date, then resubmit.");
                  setMessageType("info");
                }}
                className="ml-4 underline font-medium hover:no-underline"
              >
                Start correction
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Two-pane body ── */}
      <div className="flex-1 flex min-h-0 max-w-screen-xl mx-auto w-full px-8 py-6 gap-6">

        {/* LEFT: Product catalogue */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search bar */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wp-muted" />
            <input
              placeholder="Search catalogue…"
              aria-label="Search catalogue"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-wp-border rounded-card text-sm bg-white text-wp-ink placeholder:text-wp-muted focus:outline-none focus:ring-2 focus:ring-wp-green"
            />
          </div>

          {/* Products list */}
          {filteredProducts.length === 0 ? (
            <div className="card-panel flex flex-col items-center justify-center p-12 text-center border-dashed border-2 text-wp-muted">
              <Package size={40} className="mb-3 text-wp-border" />
              <p className="font-medium text-wp-ink">No products found</p>
              <p className="text-sm mt-1">{search ? "Try a different search term." : "No catalogue items available for your outlet."}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const qty = cart[p.productId] ?? 0;
                return (
                  <div
                    key={p.productId}
                    className={`card-panel p-4 flex items-center gap-4 transition-colors ${qty > 0 ? "border-wp-green bg-wp-pale" : "hover:border-wp-green/40"}`}
                  >
                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-wp-ink text-sm truncate">{p.name}</p>
                        {p.temperature === "reefer" && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            <Snowflake size={10} /> CHILLED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-wp-muted mt-0.5">
                        {p.unit} · {p.weightKg} kg/unit · max {p.maxQuantity.toLocaleString()}
                      </p>
                    </div>

                    {/* Quantity stepper */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        disabled={busy || !!request.current || qty === 0}
                        onClick={() => setCart({ ...cart, [p.productId]: Math.max(0, qty - 1) })}
                        className="w-8 h-8 rounded-md border border-wp-border text-wp-muted hover:border-wp-green hover:text-wp-green disabled:opacity-30 font-bold text-lg leading-none flex items-center justify-center transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={p.maxQuantity}
                        step={1}
                        value={qty}
                        disabled={busy || !!request.current}
                        onChange={(e) => setCart({ ...cart, [p.productId]: Math.max(0, Math.min(p.maxQuantity, Number(e.target.value))) })}
                        className="w-16 text-center border border-wp-border rounded-md py-1.5 text-sm font-mono tabular-nums bg-white focus:outline-none focus:ring-2 focus:ring-wp-green"
                      />
                      <button
                        disabled={busy || !!request.current || qty >= p.maxQuantity}
                        onClick={() => setCart({ ...cart, [p.productId]: Math.min(p.maxQuantity, qty + 1) })}
                        className="w-8 h-8 rounded-md border border-wp-border text-wp-muted hover:border-wp-green hover:text-wp-green disabled:opacity-30 font-bold text-lg leading-none flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Order summary */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          <div className="card-panel p-5 flex flex-col gap-4 sticky top-6">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-wp-green" />
              <h2 className="font-semibold text-wp-ink">Order summary</h2>
            </div>

            {cartProducts.length === 0 ? (
              <p className="text-sm text-wp-muted py-4 text-center border-dashed border-2 rounded-card">
                Add products from the catalogue
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {cartProducts.map((p) => (
                  <div key={p.productId} className="flex items-center justify-between text-sm">
                    <span className="text-wp-ink truncate flex-1 mr-2">{p.name}</span>
                    <span className="font-mono tabular-nums text-wp-muted shrink-0">× {cart[p.productId]}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-wp-border pt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-wp-muted">Total units</span>
                <span className="font-semibold tabular-nums text-wp-ink">{totalUnits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-wp-muted">Est. weight</span>
                <span className="font-semibold tabular-nums text-wp-ink">{totalWeight.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-wp-muted">Est. volume</span>
                <span className="font-semibold tabular-nums text-wp-ink">{totalVolume.toFixed(3)} m³</span>
              </div>
              {hasChilled && (
                <div className="flex items-center gap-1.5 mt-1 text-blue-600 bg-blue-50 rounded-md px-2.5 py-2">
                  <Snowflake size={14} />
                  <span className="text-xs font-medium">Requires chilled vehicle</span>
                </div>
              )}
            </div>

            <div className="border-t border-wp-border pt-3 text-xs text-wp-muted">
              Submission is a request subject to fleet planning. Confirmed ETA appears only once a route is published.
            </div>

            {request.current && !canCorrect && (
              <p className="text-xs text-wp-muted bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Retrying with the same request ID to prevent duplicate orders.
              </p>
            )}

            <button
              disabled={busy || !catalogue || !date || totalUnits === 0}
              onClick={save}
              className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {busy ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
              ) : (
                <><CheckCircle2 size={16} /> Review · submit request</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
