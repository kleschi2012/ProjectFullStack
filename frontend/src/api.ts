const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type ProcessedFile = {
  name: string;
  url: string;
  path?: string;
  size?: number;
  mtime?: number;
};

export async function registerUser(username: string, password: string) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function loginUser(username: string, password: string) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function uploadImage(file: File, token: string) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/process-image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    const err = new Error(data?.detail || data?.error || "Авторизация недействительна, войдите снова.") as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Ошибка сервера: ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  if (!data?.file) {
    throw new Error("Сервер не вернул путь к обработанному файлу");
  }

  return data.file as ProcessedFile;
}

export async function fetchProcessed(token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/processed-files`, { headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data?.error || "Не удалось получить список файлов") as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return (data?.files ?? []) as ProcessedFile[];
}
