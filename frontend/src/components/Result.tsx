import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { fetchProcessed } from "../api";

type ProcessedFile = {
  name: string;
  url: string;
  path?: string;
  mtime: number;
};

export default function Result() {
  const loc = useLocation();
  const nav = useNavigate();
  const processedUrlFromState = (loc.state as any)?.processedUrl as string | undefined;
  const token = localStorage.getItem("token") || undefined;

  const [items, setItems] = useState<ProcessedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");
      setLoading(true);
      try {
        const res = await fetchProcessed(token);
        if (!res.ok) {
          throw new Error("Не удалось получить список файлов");
        }
        const data = await res.json();
        const files: ProcessedFile[] = data?.files || [];
        const merged = [...files];
        if (processedUrlFromState && !merged.some((f) => f.url === processedUrlFromState)) {
          merged.unshift({ name: "Последний результат", url: processedUrlFromState, mtime: Date.now() / 1000 });
        }
        setItems(merged);
      } catch (err: any) {
        setError(err.message || "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, nav, processedUrlFromState]);

  const hasItems = items.length > 0;

  return (
    <div className="page" style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ color: "#0ea5e9", fontWeight: 700 }}>Шаг 2</div>
          <h2 style={{ margin: "6px 0 0" }}>Ваши обработанные изображения</h2>
          <p style={{ margin: 0, color: "#4b5563" }}>Все загруженные файлы сохраняются и доступны ниже.</p>
        </div>
        <Button onClick={() => nav("/upload")} style={{ paddingInline: 18 }}>
          Загрузить новое
        </Button>
      </div>

      {error && (
        <Card>
          <div style={{ color: "#b91c1c" }}>{error}</div>
        </Card>
      )}

      {loading && (
        <Card>
          <div>Загружаем список обработанных файлов...</div>
        </Card>
      )}

      {!loading && !hasItems && (
        <div style={{ width: "100%", maxWidth: 420 }}>
          <Card>
            <h3 style={{ marginTop: 0 }}>Нет обработанных файлов</h3>
            <p style={{ color: "#4b5563" }}>Загрузите изображение, чтобы увидеть результаты.</p>
            <Button onClick={() => nav("/upload")}>Перейти к загрузке</Button>
          </Card>
        </div>
      )}

      {!loading && hasItems && (
        <Card>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
              {items.map((file) => {
                const isAbsolute = file.url?.startsWith("http");
                const displayUrl = isAbsolute ? file.url : `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}${file.path || file.url}`;
                return (
                <div
                  key={displayUrl}
                  style={{
                    border: "1px solid rgba(15,23,42,0.08)",
                    borderRadius: 12,
                    overflow: "hidden",
                    display: "grid",
                    gridTemplateRows: "1fr auto",
                    background: "#fff",
                  }}
                >
                  <img src={displayUrl} alt={file.name} style={{ width: "100%", display: "block", objectFit: "cover" }} />
                  <div style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ color: "#0f172a", fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file.name}
                    </div>
                    <a href={displayUrl} download={file.name} style={{ textDecoration: "none" }}>
                      <Button style={{ padding: "6px 10px", fontSize: 14 }}>Скачать</Button>
                    </a>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
