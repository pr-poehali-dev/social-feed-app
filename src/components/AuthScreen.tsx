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
      const result = mode === "register"
        ? await authRegister(name, username, password)
        : await authLogin(username, password);
      onAuth(result.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60 transition-colors";

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(var(--background))" }}>
      {/* Левая декоративная панель (только десктоп) */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: "hsl(var(--card))", borderRight: "1px solid hsl(var(--border))" }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 30% 50%, hsl(var(--primary)) 0%, transparent 60%)" }} />
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: "hsl(var(--primary))" }}>
          <Icon name="Zap" size={30} color="white" />
        </div>
        <h1 className="text-3xl font-bold mb-3 text-center">{document.title.split("–")[0].trim()}</h1>
        <p className="text-muted-foreground text-center max-w-xs text-sm leading-relaxed">
          Общайтесь, делитесь мыслями и находите интересных людей
        </p>
        <div className="mt-10 flex flex-col gap-3 w-full max-w-xs">
          {["Лента постов", "Личные сообщения", "Подписки и профили"].map((f) => (
            <div key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "hsla(214,89%,60%,0.15)" }}>
                <Icon name="Check" size={12} color="hsl(var(--primary))" />
              </div>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Правая форма */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Мобильное лого */}
        <div className="lg:hidden flex flex-col items-center mb-10 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "hsl(var(--primary))" }}>
            <Icon name="Zap" size={26} color="white" />
          </div>
          <h1 className="text-2xl font-bold">{document.title.split("–")[0].trim()}</h1>
        </div>

        <div className="w-full max-w-sm animate-slide-up">
          <h2 className="text-xl font-bold mb-1">
            {mode === "login" ? "Добро пожаловать!" : "Создать аккаунт"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "login" ? "Войдите в свой аккаунт" : "Заполните данные для регистрации"}
          </p>

          {/* Переключатель */}
          <div className="flex p-1 rounded-xl mb-6" style={{ background: "hsl(var(--secondary))" }}>
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: mode === m ? "hsl(var(--card))" : "transparent",
                  color: mode === m ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.2)" : "none",
                }}>
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === "register" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Имя и фамилия</label>
                <input className={inputClass} placeholder="Иван Петров"
                  value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Логин</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <input className={`${inputClass} pl-8`} placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  autoComplete="username" autoCapitalize="none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Пароль</label>
              <input type="password" className={inputClass}
                placeholder={mode === "register" ? "минимум 6 символов" : "••••••••"}
                value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "register" ? "new-password" : "current-password"} />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                style={{ background: "hsla(0,72%,58%,0.12)", color: "hsl(0,72%,68%)" }}>
                <Icon name="AlertCircle" size={14} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="mt-1 w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
              {loading
                ? <Icon name="Loader2" size={16} className="animate-spin" />
                : mode === "login" ? "Войти" : "Создать аккаунт"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
