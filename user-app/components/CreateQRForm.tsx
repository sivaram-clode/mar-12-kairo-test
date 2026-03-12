"use client";

import { useState, FormEvent } from "react";
import { createQRCode, QRCode } from "@/lib/api";

interface Props {
  onCreated: (qr: QRCode) => void;
}

export default function CreateQRForm({ onCreated }: Props) {
  const [label, setLabel] = useState("");
  const [destUrl, setDestUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await createQRCode(label, destUrl);
      onCreated(data);
      setLabel("");
      setDestUrl("");
      setOpen(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to create QR code";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
      >
        + New QR Code
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow rounded-xl p-6 space-y-4 border border-indigo-100"
    >
      <h2 className="font-semibold text-gray-800">Create New QR Code</h2>

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="create-label" className="block text-sm font-medium text-gray-700 mb-1">
          Label <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="create-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="My promotion QR"
        />
      </div>

      <div>
        <label htmlFor="create-url" className="block text-sm font-medium text-gray-700 mb-1">
          Destination URL <span className="text-red-500">*</span>
        </label>
        <input
          id="create-url"
          type="url"
          required
          value={destUrl}
          onChange={(e) => setDestUrl(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="https://example.com"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          {loading ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(""); }}
          className="border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
