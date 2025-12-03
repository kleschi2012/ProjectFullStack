import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const BACKEND = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
  const navigate = useNavigate();

  const onFile = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const send = async () => {
    if (!file) {
      alert("Пожалуйста, выберите файл.");
      return;
    }

    setLoading(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const resp = await fetch(`${BACKEND}/process-image`, {
        method: "POST",
        body: form,
      });

      if (!resp.ok) throw new Error("Ошибка сервера: " + resp.status);

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);

      // ✅ Переход на страницу /result и передача ссылки на обработанное изображение
      navigate("/result", { state: { processedUrl: url } });
    } catch (err: any) {
      alert("Ошибка: " + (err.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px" }}>
      <h2>Загрузка и обработка изображения</h2>
      <p>
        Загрузите фото, чтобы система автоматически замазала лица и номера
        автомобилей.
      </p>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => onFile(e.target.files ? e.target.files[0] : null)}
      />

      {preview && (
        <div style={{ marginTop: 20 }}>
          <h4>Оригинал:</h4>
          <img
            src={preview}
            alt="preview"
            style={{
              maxWidth: "100%",
              border: "1px solid #ccc",
              borderRadius: "4px",
              marginTop: "8px",
            }}
          />
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button
          onClick={send}
          disabled={!file || loading}
          style={{
            padding: "10px 20px",
            background: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Обработка..." : "Отправить на сервер"}
        </button>
      </div>
    </div>
  );
}


