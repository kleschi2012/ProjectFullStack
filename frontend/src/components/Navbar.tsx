import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const nav = useNavigate();
  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };

  const start = () => nav(token ? "/upload" : "/login");

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(12px)",
        background: "rgba(248,250,252,0.75)",
        borderBottom: "1px solid rgba(15,23,42,0.06)",
      }}
    >
      <div
        className="page"
        style={{ padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,#0ea5e9,#0bd2a3)", display: "grid", placeItems: "center", color: "#0f172a", fontWeight: 800 }}>
              DC
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>DataCleaner</div>
              <div style={{ fontSize: 12, color: "#4b5563" }}>сокрытие номеров автомобилей</div>
            </div>
          </Link>

          <nav style={{ display: "flex", gap: 14, alignItems: "center", marginLeft: 10 }}>
            <Link to="/" style={{ color: "#0f172a", fontWeight: 600 }}>Главная</Link>
            <Link to="/upload" style={{ color: "#4b5563" }}>Загрузка</Link>
            <Link to="/result" style={{ color: "#4b5563" }}>Результат</Link>
          </nav>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {!token ? (
            <>
              <Link to="/login" style={{ color: "#0f172a", fontWeight: 600 }}>Вход</Link>
              <Link
                to="/register"
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(15,23,42,0.12)",
                  fontWeight: 600,
                }}
              >
                Регистрация
              </Link>
            </>
          ) : (
            <>
              <button
                onClick={start}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(14,165,233,0.3)",
                  background: "rgba(14,165,233,0.08)",
                  color: "#0f172a",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Начать
              </button>
              <button
                onClick={logout}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(239,68,68,0.22)",
                  background: "rgba(239,68,68,0.08)",
                  color: "#b91c1c",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Выйти
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
