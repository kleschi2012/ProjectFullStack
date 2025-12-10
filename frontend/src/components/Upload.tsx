import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { uploadImage } from "../api";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  const onFile = (f: File | null) => {
    setError("");
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const send = async () => {
    setError("");
    if (!file) {
      setError("Выберите изображение");
      return;
    }
    if (!token) {
      setError("Нужна авторизация. Войдите ещё раз.");
      return;
    }

    setLoading(true);
    try {
      const fileInfo = await uploadImage(file, token);
      navigate("/result", { state: { lastFile: fileInfo } });
    } catch (err: any) {
      setError(err?.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, color: "#0ea5e9", marginBottom: 6 }}>Шаг 1</div>
          <h2 style={{ margin: 0 }}>Загрузите изображение для обработки</h2>
          <p style={{ margin: "4px 0 0", color: "#4b5563" }}>Мы распознаём номера автомобилей и замазываем цифры.</p>
        </div>
        <Button onClick={() => navigate("/result")} style={{ background: "rgba(14,165,233,0.12)", boxShadow: "none" }}>
          Посмотреть результат
        </Button>
      </div>

      <Card>
        <div style={{ display: "grid", gap: 14 }}>
          <label
            htmlFor="file-input"
            style={{
              border: "1px dashed rgba(15,23,42,0.16)",
              borderRadius: 14,
              padding: "18px",
              textAlign: "center",
              background: "rgba(248,250,252,0.9)",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Перетащите файл или выберите его</div>
            <div style={{ color: "#4b5563" }}>Поддерживаются изображения с номерами авто и документами</div>
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => onFile(e.target.files ? e.target.files[0] : null)}
          />

          {file && (
            <div style={{ color: "#0f172a", fontWeight: 600 }}>
              Вы выбрали: <span style={{ color: "#0ea5e9" }}>{file.name}</span>
            </div>
          )}

          {preview && (
            <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(15,23,42,0.08)" }}>
              <img src={preview} alt="preview" style={{ width: "100%", display: "block" }} />
            </div>
          )}

          {error && <div style={{ color: "#b91c1c" }}>{error}</div>}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button onClick={send} disabled={loading || !file} style={{ paddingInline: 20 }}>
              {loading ? "Обрабатываем..." : "Обработать"}
            </Button>
            <span style={{ alignSelf: "center", color: "#4b5563" }}>Файлы сохраняются и доступны на странице «Результат».</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
