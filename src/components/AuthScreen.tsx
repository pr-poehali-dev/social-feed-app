import { useState } from "react";
import { authLogin, authRegister, AuthUser } from "@/lib/api";
import Icon from "@/components/ui/icon";

interface AuthScreenProps {
  onAuth: (user: AuthUser) => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let result;
      if (mode === "register") {
        result = await authRegister(name, username, password);
      } else {
        result = await authLogin(username, password);
      }
      onAuth(result.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Logo */}
      <div className="mb-10 text-center animate-fade-in">
        <span
          className="text-4xl font-semibold font-mono-plex tracking-tight"
          style={{ color: "hsl(var(--primary))" }}
        >
          void
        </span>
        <p className="text-xs text-muted-foreground mt-2 tracking-widest uppercase font-mono-plex">
          социальная сеть
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm animate-slide-up"
        style={{ animationDelay: "80ms" }}
      >
        {/* Tabs */}
        <div className="flex mb-6 border-b border-border">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className="flex-1 pb-3 text-sm font-medium transition-all relative"
              style={{
                color: mode === m ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              }}
            >
              {m === "login" ? "Войти" : "Регистрация"}
              {mode === m && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: "hsl(var(--primary))" }}
                />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "register" && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-mono-plex">
                Имя
              </label>
              <input
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
                placeholder="Алекс Орлов"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-mono-plex">
              Логин
            </label>
            <input
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-colors font-mono-plex"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
              autoComplete="username"
              autoCapitalize="none"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-mono-plex">
              Пароль
            </label>
            <input
              type="password"
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
              placeholder={mode === "register" ? "минимум 6 символов" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          </div>

          {error && (
            <p className="text-xs py-2 px-3 rounded-lg"
              style={{ background: "hsla(0, 62%, 50%, 0.1)", color: "hsl(0, 62%, 65%)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            {loading ? (
              <Icon name="Loader2" size={16} className="animate-spin" />
            ) : mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
      </div>

      <p className="mt-8 text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: "200ms" }}>
        void · {new Date().getFullYear()}
      </p>
    </div>
  );
}
