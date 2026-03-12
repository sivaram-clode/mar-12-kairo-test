"use client";

import useSWR from "swr";
import { useState } from "react";
import { api, User } from "@/lib/api";

export default function UsersPage() {
  const { data: users, error, isLoading, mutate } = useSWR<User[]>("users", api.getUsers);
  const [toggling, setToggling] = useState<number | null>(null);

  async function handleToggle(user: User) {
    setToggling(user.id);
    try {
      await api.toggleUser(user.id, !user.is_active);
      mutate();
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Users</h1>

      {isLoading && <p className="text-gray-400">Loading users…</p>}
      {error && <p className="text-red-500">Failed to load users.</p>}

      {users && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["ID", "Name", "Email", "QR Codes", "Status", "Joined", "Action"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{u.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.qr_count ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(u)}
                      disabled={toggling === u.id}
                      className={`text-xs px-3 py-1 rounded font-medium transition ${
                        u.is_active
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      } disabled:opacity-50`}
                    >
                      {toggling === u.id ? "…" : u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
