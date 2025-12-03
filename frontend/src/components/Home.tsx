import React from "react";
import Card from "../ui/Card";

export default function Home() {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <h1 style={{ color: "#2E8B57", marginTop: 0 }}>Очистка персональных данных</h1>
        <p style={{ color: "#374151", fontSize: 16 }}>
          Сервис автоматически распознаёт паспортные данные и номера автомобилей на фотографиях и аккуратно скрывает их.
        </p>

        <div style={{ marginTop: 20 }}>
          <a href="/upload" style={{ display: "inline-block", background: "#2ecc71", color: "#fff", padding: "10px 16px", borderRadius: 8, textDecoration: "none" }}>
            Начать обработку
          </a>
        </div>
      </Card>
    </div>
  );
}