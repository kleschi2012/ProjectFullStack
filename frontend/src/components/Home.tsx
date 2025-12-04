import { Link, useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import Card from "../ui/Card";

export default function Home() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleStart = () => navigate(token ? "/upload" : "/login");

  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", gap: 28, minHeight: "calc(100vh - 160px)" }}>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 28,
          alignItems: "center",
          paddingTop: 10,
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(14,165,233,0.12)", padding: "8px 12px", borderRadius: 12, color: "#0369a1", fontWeight: 700, letterSpacing: 0.2 }}>
            AI Blur · моментальная защита
          </div>
          <h1 style={{ margin: "14px 0 8px", fontSize: 44, lineHeight: 1.1 }}>
            Скрываем номера авто и паспортные данные на ваших фото в пару кликов
          </h1>
          <p style={{ color: "#4b5563", fontSize: 17, maxWidth: 620 }}>
            Загрузите изображение, и сервис автоматически найдёт чувствительные зоны и замажет их. Безопасно для документов, удобно для отчётов и объявлений.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18, flexWrap: "wrap" }}>
            <Button onClick={handleStart} style={{ paddingInline: 18 }}>
              Начать обработку
            </Button>
            <Link to="/register" style={{ fontWeight: 700, color: "#0f172a" }}>
              Ещё не зарегистрированы? Зарегистрироваться →
            </Link>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 18, color: "#4b5563", fontWeight: 600, flexWrap: "wrap" }}>
            <span style={{ padding: "10px 12px", background: "rgba(11,210,163,0.12)", borderRadius: 12, color: "#0f766e" }}>Доступно после входа</span>
            <span>Сохраняем исходное качество · Без ручного редактирования</span>
          </div>
        </div>

        <div>
          <Card>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ borderRadius: 14, background: "linear-gradient(145deg, #0ea5e9, #0bd2a3)", padding: 16, color: "#0f172a", fontWeight: 700 }}>
                Автообнаружение данных
              </div>
              <div
                style={{
                  background: "#0b172a",
                  borderRadius: 16,
                  padding: 16,
                  color: "#e5e7eb",
                  position: "relative",
                  overflow: "hidden",
                  minHeight: 240,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 12,
                    borderRadius: 14,
                    border: "1px dashed rgba(255,255,255,0.3)",
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 26,
                      left: 34,
                      width: 120,
                      height: 48,
                      background: "rgba(14,165,233,0.28)",
                      borderRadius: 10,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 40,
                      right: 48,
                      width: 90,
                      height: 32,
                      background: "rgba(11,210,163,0.35)",
                      borderRadius: 8,
                    }}
                  />
                  <div style={{ position: "absolute", bottom: 14, left: 14, color: "#9ca3af", fontSize: 13 }}>
                    Пример: зоны на фото будут размыты
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
        {[
          { title: "Паспортные данные", text: "Распознаём и скрываем номера, ФИО, серию и номер паспорта." },
          { title: "Номера автомобилей", text: "Определяем автомобильные номера на фото и замазываем их автоматически." },
          { title: "Готово за секунды", text: "Пара кликов: загрузка → обработка → результат без фотошопа." },
        ].map((item) => (
          <Card key={item.title}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>{item.title}</h3>
            <p style={{ margin: 0, color: "#4b5563" }}>{item.text}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
