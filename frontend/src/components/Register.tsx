import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { registerUser } from "../api";

export default function Register() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim() || !password.trim()) {
      setError("Заполните логин и пароль");
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser(username.trim(), password.trim());
      if (res.error) {
        setError(res.error);
        return;
      }
      setSuccess("Регистрация успешна! Теперь можно войти.");
      setTimeout(() => nav("/login"), 900);
    } catch (err: any) {
      setError(err.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: "grid", placeItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <Card>
          <h2 style={{ textAlign: "center", margin: "0 0 6px" }}>Создать аккаунт</h2>
          <p style={{ textAlign: "center", color: "#4b5563", marginTop: 0 }}>
            Зарегистрируйтесь, чтобы получать доступ к обработке изображений.
          </p>
          {error && <div style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div>}
          {success && <div style={{ color: "#0f766e", marginBottom: 12 }}>{success}</div>}

          <form onSubmit={submit}>
            <Input placeholder="Логин" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input placeholder="Повторите пароль" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <Button type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Создаём..." : "Зарегистрироваться"}
            </Button>
          </form>

          <p style={{ textAlign: "center", color: "#4b5563", marginTop: 12 }}>
            Уже есть аккаунт?{" "}
            <Link to="/login" style={{ fontWeight: 700, color: "#0ea5e9" }}>
              Войти
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
