import React from "react";

export default function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        margin: "0 auto",
        padding: 24,
        borderRadius: 18,
        background: "rgba(255,255,255,0.9)",
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 24px 70px rgba(15, 23, 42, 0.08)",
        backdropFilter: "blur(8px)",
      }}
    >
      {children}
    </div>
  );
}
