"use client";

import { useEffect, useState } from "react";
import { listQRCodes, QRCode } from "@/lib/api";
import CreateQRForm from "@/components/CreateQRForm";
import QRCard from "@/components/QRCard";

export default function DashboardPage() {
  const [qrs, setQrs] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listQRCodes()
      .then((r) => setQrs(r.data))
      .catch(() => setError("Failed to load QR codes"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (qr: QRCode) => setQrs((prev) => [qr, ...prev]);
  const handleUpdated = (updated: QRCode) =>
    setQrs((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  const handleDeleted = (id: number) => setQrs((prev) => prev.filter((q) => q.id !== id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My QR Codes</h1>
        <CreateQRForm onCreated={handleCreated} />
      </div>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : qrs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔲</p>
          <p className="text-lg font-medium">No QR codes yet</p>
          <p className="text-sm">Create your first one above!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {qrs.map((qr) => (
            <QRCard
              key={qr.id}
              qr={qr}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
