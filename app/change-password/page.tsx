"use client";

import { useState } from "react";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      setMessage("Password updated successfully.");
    } else {
      const text = await res.text();
      setMessage(text || "Failed to change password.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow space-y-4">
      <h1 className="text-xl font-semibold">Change Password</h1>
      {message && <p className="text-sm text-red-500">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="Current password"
          className="w-full border px-4 py-2 rounded"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="New password"
          className="w-full border px-4 py-2 rounded"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
