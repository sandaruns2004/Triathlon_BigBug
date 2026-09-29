"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Store, AlertTriangle, Phone, FileSignature, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DriverStopPage() {
  const params = useParams();
  const router = useRouter();
  const [stop, setStop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignature, setShowSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch(`/api/loader/stops/${params.id}`) // We can reuse a generic stop endpoint if it exists, or fetch via a new driver endpoint
      .then(res => res.json())
      .then(data => {
        setStop(data.stop);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [params.id]);

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleConfirmDelivery = async () => {
    setIsSubmitting(true);
    // In a real app we'd save the canvas data URL
    try {
      await fetch(`/api/driver/stops/${params.id}/deliver`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: "base64..." }) // Mock payload
      });
      router.push("/driver");
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-wp-muted">Loading stop details...</div>;
  if (!stop) return <div className="p-8 text-center text-red-600">Stop not found.</div>;

  return (
    <div className="flex flex-col h-full bg-wp-pale pb-20">
      {/* Header */}
      <header className="bg-wp-ink text-white p-4 sticky top-0 z-10 shadow-sm flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-white/70 hover:text-white">
          <ChevronLeft size={24} />
        </button>
        <div>
          <div className="text-xs text-white/70 uppercase tracking-wider font-bold">Stop {stop.stopOrder}</div>
          <h1 className="font-bold truncate max-w-[280px]">{stop.outletName}</h1>
        </div>
      </header>

      <div className="p-4 space-y-4 flex-1">
        {/* Stop Info */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-wp-border">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-wp-pale flex items-center justify-center text-wp-action flex-shrink-0">
              <Store size={20} />
            </div>
            <div>
              <h2 className="font-bold text-wp-ink text-lg">{stop.outletName}</h2>
              <p className="text-sm text-wp-muted flex items-center gap-1 mt-1">
                <MapPin size={14} /> {stop.address || "Address not available"}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="flex-1 bg-wp-pale text-wp-ink font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm">
              <Navigation size={16} className="text-wp-action" /> Navigate
            </button>
            <button className="flex-1 bg-wp-pale text-wp-ink font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm">
              <Phone size={16} className="text-wp-action" /> Call Store
            </button>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-wp-border">
          <h3 className="text-sm font-bold text-wp-muted uppercase tracking-wider mb-4">Delivery Details</h3>
          
          <div className="flex justify-between items-center py-3 border-b border-wp-border">
            <span className="text-wp-ink font-medium">Total Weight</span>
            <span className="font-bold text-wp-ink">{stop.expectedKg} kg</span>
          </div>
          
          <div className="py-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="block text-amber-800 text-sm mb-1">Constraints</strong>
                <p className="text-xs text-amber-700/80">Park in designated unloading bay only. Call manager if bay is occupied.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-wp-border shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {!showSignature ? (
          <button 
            onClick={() => setShowSignature(true)}
            className="w-full btn btn-primary py-4 text-base shadow-lg active:scale-95 flex justify-center items-center gap-2"
          >
            <FileSignature size={20} /> Collect Signature & Complete
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-wp-ink">Store Manager Signature</h3>
              <button onClick={handleClearSignature} className="text-xs font-semibold text-wp-action">Clear</button>
            </div>
            
            <div className="bg-wp-pale rounded-lg border border-wp-border h-32 relative overflow-hidden">
              {/* Very basic canvas for illustration. In a real app we'd use a react-signature-canvas lib */}
              <canvas 
                ref={canvasRef}
                className="w-full h-full cursor-crosshair touch-none"
                onPointerDown={(e) => {
                  const ctx = canvasRef.current?.getContext("2d");
                  if (ctx) {
                    ctx.beginPath();
                    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                  }
                }}
                onPointerMove={(e) => {
                  if (e.buttons !== 1) return;
                  const ctx = canvasRef.current?.getContext("2d");
                  if (ctx) {
                    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                    ctx.stroke();
                  }
                }}
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                <FileSignature size={48} />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowSignature(false)}
                className="flex-1 btn btn-outline py-3"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelivery}
                disabled={isSubmitting}
                className="flex-1 btn bg-wp-green text-white hover:bg-wp-green/90 py-3 shadow-lg flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Saving..." : <><CheckCircle2 size={18} /> Confirm</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
