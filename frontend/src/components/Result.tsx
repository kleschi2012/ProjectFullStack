import { useLocation, useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";

export default function Result() {
  const loc = useLocation();
  const nav = useNavigate();
  const processedUrl = (loc.state as any)?.processedUrl as string | undefined;

  if (!processedUrl) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <h3>Нет данных для отображения</h3>
          <Button onClick={() => nav("/upload")}>Перейти к загрузке</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <h2 style={{ textAlign: "center", color: "#2E8B57" }}>Результат обработки</h2>
        <div style={{ marginTop: 12 }}>
          <img src={processedUrl} alt="processed" style={{ width: "100%", borderRadius: 10 }} />
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
          <a href={processedUrl} download="processed.png" style={{ textDecoration: "none", flex: 1 }}>
            <Button>Скачать</Button>
          </a>
          <Button onClick={() => nav("/upload")} style={{ background: "#111", color: "#fff" }}>Новое</Button>
        </div>
      </Card>
    </div>
  );
}


