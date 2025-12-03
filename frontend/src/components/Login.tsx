import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { loginUser } from "../api";

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginUser(username.trim(), password.trim());
      if (res.error) {
        setError(res.error);
        return;
      }
      if (!res.token) {
        setError("Сервер вернул некорректный ответ");
        return;
      }
      localStorage.setItem("token", res.token);
      nav("/upload");
    } catch (err: any) {
      setError(err.message || "Не удалось войти");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: "grid", placeItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <Card>
          <h2 style={{ textAlign: "center", margin: "0 0 6px" }}>Войти в аккаунт</h2>
          <p style={{ textAlign: "center", color: "#4b5563", marginTop: 0 }}>
            Доступ к загрузке и обработке изображений после авторизации.
          </p>
          {error && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>}
          <form onSubmit={submit}>
            <Input placeholder="Логин" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Входим..." : "Войти"}
            </Button>
          </form>

          <p style={{ textAlign: "center", color: "#4b5563", marginTop: 12 }}>
            Ещё нет аккаунта?{" "}
            <Link to="/register" style={{ fontWeight: 700, color: "#0ea5e9" }}>
              Зарегистрироваться
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
