import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { uploadImage } from "../api";

export default function Upload() {
  const nav = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const onFile = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const send = async () => {
    if (!file) return alert("Выберите файл");
    if (!token) return nav("/login");

    setLoading(true);
    try {
      const resp = await uploadImage(file, token);
      if (!resp.ok) throw new Error("Ошибка сервера");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      nav("/result", { state: { processedUrl: url } });
    } catch (err: any) {
      alert(err.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <h2 style={{ textAlign: "center", color: "#2E8B57" }}>Загрузка изображения</h2>

        <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0] || null)} />

        {preview && <img src={preview} alt="preview" style={{ maxWidth: "100%", marginTop: 12, borderRadius: 8 }} />}

        <div style={{ marginTop: 14 }}>
          <Button onClick={send} style={{ opacity: loading ? 0.7 : 1 }}>{loading ? "Обработка..." : "Обработать"}</Button>
        </div>
      </Card>
    </div>
  );
}
