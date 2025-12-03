import { Link, useNavigate } from "react-router-dom";
import React from "react";

export default function Navbar() {
  const nav = useNavigate();
  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login");
  };

  return (
    <header style={{ background: "#fff", borderBottom: "1px solid #e6e6e6" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, color: "#2E8B57" }}>DataCleaner</h2>
          <nav style={{ display: "flex", gap: 12 }}>
            <Link to="/" style={{ color: "#2E8B57", textDecoration: "none", fontWeight: 500 }}>Главная</Link>
            <Link to="/upload" style={{ color: "#555", textDecoration: "none" }}>Загрузка</Link>
            <Link to="/result" style={{ color: "#555", textDecoration: "none" }}>Результат</Link>
          </nav>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {!token ? (
            <>
              <Link to="/login" style={{ color: "#2E8B57", textDecoration: "none", fontWeight: 600 }}>Вход</Link>
              <Link to="/register" style={{ color: "#2E8B57", textDecoration: "none", fontWeight: 600 }}>Регистрация</Link>
            </>
          ) : (
            <>
              <button onClick={() => nav("/upload")} style={{ background: "transparent", border: "1px solid #2ecc71", padding: "6px 12px", borderRadius: 8, color: "#2E8B57", cursor: "pointer" }}>Мой кабинет</button>
              <button onClick={logout} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer" }}>Выйти</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}







