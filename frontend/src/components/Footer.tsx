import React from "react";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #e6e6e6", background: "#fff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 14, textAlign: "center", color: "#6b7280" }}>
        © {new Date().getFullYear()} DataCleaner — очистка персональных данных
      </div>
    </footer>
  );
}
  
  