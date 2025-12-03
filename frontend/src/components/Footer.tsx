export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(15,23,42,0.06)", background: "rgba(255,255,255,0.9)", marginTop: "auto" }}>
      <div className="page" style={{ padding: "18px 0", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#4b5563", fontSize: 14, gap: 10, flexWrap: "wrap" }}>
        <span>© {new Date().getFullYear()} DataCleaner. Защита персональных данных.</span>
        <span style={{ color: "#0ea5e9", fontWeight: 600 }}>Сделано для безопасной загрузки ваших фото.</span>
      </div>
    </footer>
  );
}
