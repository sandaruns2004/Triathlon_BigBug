"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, PackageCheck, AlertCircle, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock product catalogue
const CATALOGUE = [
  { id: "P001", name: "Fresh Milk 1L", category: "Dairy", weightKg: 1.05, volumeM3: 0.002, price: 500, stock: "high" },
  { id: "P002", name: "Yoghurt Cup 80g (x6)", category: "Dairy", weightKg: 0.5, volumeM3: 0.001, price: 360, stock: "high" },
  { id: "P003", name: "Cheese Block 200g", category: "Dairy", weightKg: 0.2, volumeM3: 0.0005, price: 800, stock: "medium" },
  { id: "P004", name: "Premium Ice Cream 1L", category: "Frozen", weightKg: 1.1, volumeM3: 0.003, price: 1200, stock: "low" },
  { id: "P005", name: "Orange Juice 1L", category: "Beverages", weightKg: 1.05, volumeM3: 0.002, price: 450, stock: "high" },
  { id: "P006", name: "Flavored Milk 200ml (x6)", category: "Beverages", weightKg: 1.25, volumeM3: 0.0025, price: 600, stock: "high" },
];

export default function NewOrderPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const filteredCatalogue = CATALOGUE.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const updateCart = (productId: string, delta: number) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      const newCart = { ...prev };
      if (next === 0) delete newCart[productId];
      else newCart[productId] = next;
      return newCart;
    });
  };

  const cartItems = Object.keys(cart).map(id => {
    const product = CATALOGUE.find(p => p.id === id)!;
    return { ...product, qty: cart[id] };
  });

  const totalWeight = cartItems.reduce((sum, item) => sum + (item.weightKg * item.qty), 0);
  const totalVolume = cartItems.reduce((sum, item) => sum + (item.volumeM3 * item.qty), 0);
  const totalValue = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const handleSubmit = async () => {
    if (totalItems === 0) return;
    setSubmitting(true);
    
    try {
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems,
          totalWeight: Number(totalWeight.toFixed(2)),
          totalVolume: Number(totalVolume.toFixed(4)),
          tempRequirement: cartItems.some(i => i.category === "Frozen") ? "frozen" : 
                           cartItems.some(i => i.category === "Dairy") ? "chilled" : "ambient"
        })
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/store/orders/${data.orderId}`);
      }
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
      {/* ── Left Pane: Catalogue ── */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl shadow-sm border border-wp-border overflow-hidden">
        <div className="p-4 border-b border-wp-border bg-wp-pale/50 flex-shrink-0">
          <h2 className="text-lg font-bold text-wp-ink mb-3">Product Catalogue</h2>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-wp-muted" />
            <input 
              type="text" 
              placeholder="Search products or categories..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-wp-border rounded-lg bg-white focus:outline-none focus:border-wp-action transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredCatalogue.map(product => {
            const qty = cart[product.id] || 0;
            return (
              <div key={product.id} className="flex items-center justify-between p-4 rounded-lg border border-wp-border hover:border-wp-action/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-wp-muted bg-wp-pale px-2 py-0.5 rounded">
                      {product.category}
                    </span>
                    {product.stock === "low" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertCircle size={10} /> Low Stock
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-wp-ink">{product.name}</h3>
                  <p className="text-sm text-wp-muted">Rs. {product.price.toFixed(2)} • {product.weightKg}kg</p>
                </div>
                
                <div className="flex items-center gap-3">
                  {qty > 0 && (
                    <button 
                      onClick={() => updateCart(product.id, -1)}
                      className="w-8 h-8 rounded-full bg-wp-pale text-wp-ink flex items-center justify-center hover:bg-wp-border transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                  )}
                  <span className={cn("font-bold w-6 text-center", qty > 0 ? "text-wp-ink text-lg" : "text-wp-muted")}>
                    {qty}
                  </span>
                  <button 
                    onClick={() => updateCart(product.id, 1)}
                    className="w-8 h-8 rounded-full bg-wp-action text-white flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredCatalogue.length === 0 && (
            <div className="text-center py-12 text-wp-muted">No products found matching "{search}"</div>
          )}
        </div>
      </div>

      {/* ── Right Pane: Order Summary ── */}
      <div className="w-full lg:w-[380px] flex flex-col bg-wp-ink text-white rounded-xl shadow-lg overflow-hidden flex-shrink-0 h-[500px] lg:h-auto">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5 flex-shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart size={20} className="text-wp-green" />
            Order Draft
          </h2>
          <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs font-bold">
            {totalItems} items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-white/50 space-y-3">
              <PackageCheck size={48} className="opacity-20" />
              <p>Add products from the catalogue to build your restock order.</p>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.id} className="flex justify-between items-start text-sm border-b border-white/10 pb-3 last:border-0">
                <div className="flex-1 pr-4">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-white/50 mt-0.5">Rs. {item.price} × {item.qty}</div>
                </div>
                <div className="font-bold">Rs. {(item.price * item.qty).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-5 bg-white/5 border-t border-white/10 space-y-3 flex-shrink-0">
            <div className="flex justify-between text-sm text-white/70">
              <span>Total Weight</span>
              <span>{totalWeight.toFixed(2)} kg</span>
            </div>
            <div className="flex justify-between text-sm text-white/70">
              <span>Total Volume</span>
              <span>{totalVolume.toFixed(3)} m³</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
              <span>Est. Total</span>
              <span className="text-wp-green">Rs. {totalValue.toLocaleString()}</span>
            </div>
            
            <button 
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-4 btn bg-wp-green text-white hover:bg-wp-green/90 py-3 text-base shadow-lg active:scale-[0.98]"
            >
              {submitting ? "Submitting..." : "Submit Order to Depot"}
            </button>
            <p className="text-center text-[10px] text-white/40 mt-2">
              Order will be scheduled for tomorrow's dispatch.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
