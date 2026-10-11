"use client";
import {useCallback, useEffect, useState} from "react";
import Link from "next/link";
import {api} from "@/lib/mobile/browser";

type Update = {notificationId:string;entityId:string;message:string;createdAt:string;sequence:number;read:boolean};
export default function StoreUpdatesPage() {
  const [updates,setUpdates] = useState<Update[]>([]);
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [cursor,setCursor] = useState<string|null>(null);
  const [hasMore,setHasMore] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const result = await api("notifications");
      setUpdates(result.notifications);
      setCursor(result.cursor);
      setHasMore(result.hasMore);
      setError("");
    } catch(e) {setError((e as Error).message);}
    finally {setLoading(false);}
  },[]);
  useEffect(() => {void refresh();},[refresh]);
  async function more() {
    if(busy || !cursor) return;
    setBusy(true);
    try {
      const result = await api("notifications?after="+encodeURIComponent(cursor));
      setUpdates(old => [...new Map([...old,...result.notifications].map((n:Update) => [n.notificationId,n])).values()]);
      setCursor(result.cursor);setHasMore(result.hasMore);setError("");
    } catch(e) {setError((e as Error).message);}
    finally {setBusy(false);}
  }
  async function markRead(id:string) {
    if(busy) return;
    setBusy(true);
    try {
      await api("notifications/"+encodeURIComponent(id)+"/read",{method:"POST",body:"{}"});
      setUpdates(old => old.map(n => n.notificationId === id ? {...n,read:true} : n));setError("");
    } catch(e) {setError((e as Error).message);}
    finally {setBusy(false);}
  }
  return <div className="flex-1 overflow-y-auto px-[22px] pt-[10px] pb-[24px]">
    <h1 className="text-[28px] font-semibold my-4">Store updates</h1>
    <p className="text-sm text-wp-muted mb-4">Committed updates for your outlet. Refresh to check for new activity.</p>
    <button onClick={refresh} disabled={busy} className="btn btn-outline mb-4">Refresh updates</button>
    {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
    {loading ? <p>Loading updates…</p> : updates.length === 0 ? <p>No updates for your outlet yet.</p> :
      [...updates].sort((a,b) => b.sequence-a.sequence).map(n => <section key={n.notificationId} className="card-panel p-4 mb-4">
        <p className="font-semibold">{n.message}</p>
        <p className="text-sm text-wp-muted">{new Date(n.createdAt).toLocaleString("en-GB",{timeZone:"Asia/Colombo"})} · {n.read ? "Read" : "New"}</p>
        <Link href="/store/orders" className="text-wp-action">View your orders</Link>
        {!n.read && <button disabled={busy} onClick={() => markRead(n.notificationId)} className="btn btn-outline ml-3">Mark read</button>}
      </section>)}
    {hasMore && <button disabled={busy} onClick={more} className="btn btn-outline">Load more updates</button>}
  </div>;
}
