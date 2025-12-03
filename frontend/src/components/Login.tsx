import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { loginUser } from "../api";

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    const res = await loginUser(username, password);
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
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <h2 style={{ textAlign: "center", color: "#2E8B57" }}>Вход</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <form onSubmit={submit}>
          <Input placeholder="Логин" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit">Войти</Button>
        </form>
      </Card>
    </div>
  );
}

