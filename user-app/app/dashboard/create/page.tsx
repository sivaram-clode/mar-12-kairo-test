"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AuthGuard from "@/components/AuthGuard";
import { createQRCode } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function CreateQRContent() {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdQR, setCreatedQR] = useState<{
    id: string;
    short_code: string;
    label: string;
  } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!label.trim()) {
      setError("Label is required");
      return;
    }

    if (!destinationUrl.trim()) {
      setError("Destination URL is required");
      return;
    }

    try {
      new URL(destinationUrl);
    } catch {
      setError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setLoading(true);

    try {
      const data = await createQRCode(label, destinationUrl);
      setCreatedQR(data.qr_code || data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create QR code");
    } finally {
      setLoading(false);
    }
  };

  if (createdQR) {
    const qrImageUrl = `${API_BASE_URL}/qr/${createdQR.short_code}/image`;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
          <div className="mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">QR Code Created!</h2>
            <p className="text-gray-600">{createdQR.label}</p>
          </div>

          <div className="my-6 border border-gray-200 rounded-lg p-4 inline-block">
            <Image
              src={qrImageUrl}
              alt="Generated QR Code"
              width={200}
              height={200}
              className="mx-auto"
              unoptimized
            />
          </div>

          <div className="space-y-3">
            <a
              href={qrImageUrl}
              download={`qr-${createdQR.short_code}.png`}
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700"
            >
              Download QR PNG
            </a>
            <Link
              href={`/dashboard/${createdQR.id}`}
              className="block w-full bg-gray-100 text-gray-800 py-2 px-4 rounded-md font-medium hover:bg-gray-200"
            >
              View Details
            </Link>
            <Link
              href="/dashboard"
              className="block w-full text-blue-600 hover:underline text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create QR Code</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="create-qr-form">
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded" role="alert">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700">
                Label <span className="text-red-500">*</span>
              </label>
              <input
                id="label"
                name="label"
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="My QR Code"
                data-testid="label-input"
              />
            </div>

            <div>
              <label htmlFor="destinationUrl" className="block text-sm font-medium text-gray-700">
                Destination URL <span className="text-red-500">*</span>
              </label>
              <input
                id="destinationUrl"
                name="destinationUrl"
                type="url"
                required
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com"
                data-testid="url-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="create-submit-button"
            >
              {loading ? "Creating..." : "Create QR Code"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function CreateQRPage() {
  return (
    <AuthGuard>
      <CreateQRContent />
    </AuthGuard>
  );
}
