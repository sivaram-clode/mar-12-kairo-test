"use client";

import { useState } from "react";
import { QRCode, updateQRCode, deleteQRCode, getQRImageUrl } from "@/lib/api";
import Link from "next/link";

interface Props {
  qr: QRCode;
  onUpdated: (updated: QRCode) => void;
  onDeleted: (id: number) => void;
}

export default function QRCard({ qr, onUpdated, onDeleted }: Props) {
  const [editing, setEditing] = useState(false);
  const [destUrl, setDestUrl] = useState(qr.destination_url);
  const [label, setLabel] = useState(qr.label || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const { data } = await updateQRCode(qr.id, {
        destination_url: destUrl,
        label: label || undefined,
      });
      onUpdated(data);
      setEditing(false);
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this QR code?")) return;
    try {
      await deleteQRCode(qr.id);
      onDeleted(qr.id);
    } catch {
      alert("Failed to delete");
    }
  };

  const handleDownload = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(getQRImageUrl(qr.id), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { alert("Image not available"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${qr.label || qr.code}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          {editing ? (
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm w-48"
              placeholder="Label"
            />
          ) : (
            <p className="font-semibold text-gray-800">{qr.label || <span className="text-gray-400 italic">No label</span>}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">Code: {qr.code.slice(0, 8)}…</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            qr.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {qr.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Destination URL */}
      {editing ? (
        <input
          value={destUrl}
          onChange={(e) => setDestUrl(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
          placeholder="Destination URL"
        />
      ) : (
        <a
          href={qr.destination_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 hover:underline truncate"
        >
          {qr.destination_url}
        </a>
      )}

      {error && <p className="text-red-600 text-xs">{error}</p>}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1 rounded-lg"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setEditing(false); setDestUrl(qr.destination_url); setLabel(qr.label || ""); }}
              className="text-sm border border-gray-300 px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="text-sm border border-gray-300 px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={handleDownload}
              className="text-sm border border-gray-300 px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Download PNG
            </button>
            <Link
              href={`/dashboard/${qr.id}/stats`}
              className="text-sm border border-gray-300 px-3 py-1 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Stats
            </Link>
            <button
              onClick={handleDelete}
              className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
