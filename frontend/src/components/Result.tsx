import { useLocation, useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";

export default function Result() {
  const loc = useLocation();
  const nav = useNavigate();
  const processedUrl = (loc.state as any)?.processedUrl as string | undefined;

  if (!processedUrl) {
    return (
      <div className="page" style={{ display: "grid", placeItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <Card>
            <h3 style={{ marginTop: 0 }}>Нет данных для отображения</h3>
            <p style={{ color: "#4b5563" }}>Загрузите изображение, чтобы увидеть результат обработки.</p>
            <Button onClick={() => nav("/upload")}>Перейти к загрузке</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ color: "#0ea5e9", fontWeight: 700 }}>Шаг 2</div>
          <h2 style={{ margin: "6px 0 0" }}>Ваше изображение готово</h2>
          <p style={{ margin: 0, color: "#4b5563" }}>Размытие применено к распознанным номерам и паспортным данным.</p>
        </div>
        <Button onClick={() => nav("/upload")} style={{ paddingInline: 18 }}>
          Загрузить другое
        </Button>
      </div>

      <Card>
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(15,23,42,0.08)" }}>
            <img src={processedUrl} alt="processed" style={{ width: "100%", display: "block" }} />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href={processedUrl} download="processed.png" style={{ textDecoration: "none" }}>
              <Button>Скачать файл</Button>
            </a>
            <Button onClick={() => nav("/upload")} style={{ background: "#0f172a", color: "#fff" }}>
              Новое изображение
            </Button>
          </div>
          <p style={{ color: "#4b5563", margin: 0 }}>Файл не сохраняется на сервере, сохраните его локально.</p>
        </div>
      </Card>
    </div>
  );
}

