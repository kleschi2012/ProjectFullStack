import React from "react";

export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        maxWidth: 740,
        margin: "24px auto",
        padding: 24,
        borderRadius: 12,
        background: "#fff",
        boxShadow: "0 6px 20px rgba(15, 23, 42, 0.06)",
      }}
    >
      {children}
    </div>
  );
}