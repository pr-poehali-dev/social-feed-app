import { useState, useEffect } from "react";
import Feed from "@/components/Feed";
import ProfileView from "@/components/ProfileView";
import Messages from "@/components/Messages";
import Discover from "@/components/Discover";
import AuthScreen from "@/components/AuthScreen";
import Icon from "@/components/ui/icon";
import Avatar from "@/components/Avatar";
import { authMe, authLogout, AuthUser } from "@/lib/api";

type Tab = "feed" | "discover" | "messages" | "profile";

export default function Index() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("feed");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [messageUserId, setMessageUserId] = useState<string | null>(null);

  useEffect(() => {
    authMe().then((u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await authLogout();
    setUser(null);
    setTab("feed");
  };

  const openProfile = (userId: string) => {
    setProfileId(userId);
    setTab("profile");
  };

  const openMessage = (userId: string) => {
    setMessageUserId(userId);
    setTab("messages");
  };

  const switchTab = (key: Tab) => {
    if (key === "profile") setProfileId(null);
    if (key !== "messages") setMessageUserId(null);
    setTab(key);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Icon name="Zap" size={20} color="white" />
          </div>
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuth={setUser} />;
  }

  const navItems: { key: Tab; icon: string; label: string }[] = [
    { key: "feed",      icon: "Home",          label: "Лента" },
    { key: "discover",  icon: "Compass",       label: "Люди" },
    { key: "messages",  icon: "MessageCircle", label: "Сообщения" },
    { key: "profile",   icon: "User",          label: "Профиль" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(var(--background))" }}>

      {/* ── Боковая навигация (десктоп / планшет) ── */}
      <aside className="hidden sm:flex flex-col fixed left-0 top-0 h-full w-16 lg:w-60 z-30 border-r border-border py-4 px-2 lg:px-4 justify-between"
        style={{ background: "hsl(var(--card))" }}>
        <div className="flex flex-col gap-1">
          {/* Лого */}
          <div className="flex items-center gap-3 px-2 py-3 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(var(--primary))" }}>
              <Icon name="Zap" size={16} color="white" />
            </div>
            <span className="hidden lg:block text-base font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
              {(document.title || "Void").split(" ")[0]}
            </span>
          </div>

          {navItems.map(({ key, icon, label }) => {
            const isActive = tab === key;
            return (
              <button key={key} onClick={() => switchTab(key)}
                className="flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all font-medium text-sm"
                style={{
                  background: isActive ? "hsla(214,89%,60%,0.12)" : "transparent",
                  color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                }}>
                <Icon name={icon} size={20} />
                <span className="hidden lg:block">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Профиль внизу боковой панели */}
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer hover:bg-secondary transition-all"
          onClick={() => switchTab("profile")}>
          <Avatar initials={user.avatar} size="sm" accent />
          <div className="hidden lg:block min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            className="hidden lg:flex ml-auto text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="LogOut" size={15} />
          </button>
        </div>
      </aside>

      {/* ── Основной контент ── */}
      <main className="flex-1 sm:ml-16 lg:ml-60 flex flex-col min-h-screen">

        {/* Мобильный хедер */}
        <header className="sm:hidden sticky top-0 z-20 border-b border-border backdrop-blur-md px-4 h-14 flex items-center justify-between"
          style={{ background: "hsla(216,18%,13%,0.9)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--primary))" }}>
            <Icon name="Zap" size={14} color="white" />
          </div>
          <span className="text-sm font-bold">{navItems.find(n => n.key === tab)?.label}</span>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="LogOut" size={16} />
          </button>
        </header>

        {/* Контент страниц */}
        <div className="flex-1 max-w-2xl w-full mx-auto pb-20 sm:pb-4">
          {tab === "feed" && <Feed onUserClick={openProfile} currentUser={user} />}

          {tab === "discover" && (
            <Discover onUserClick={openProfile} onMessage={openMessage} />
          )}

          {tab === "messages" && (
            <div className="h-[calc(100vh-56px)] sm:h-screen flex flex-col">
              <Messages
                initialUserId={messageUserId}
                onUserClick={openProfile}
                currentUserId={String(user.id)}
              />
            </div>
          )}

          {tab === "profile" && (
            <ProfileView
              userId={profileId || "me"}
              onMessage={openMessage}
              onBack={() => { setTab("feed"); setProfileId(null); }}
              currentUser={user}
            />
          )}
        </div>
      </main>

      {/* ── Мобильная нижняя навигация ── */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border"
        style={{ background: "hsl(var(--card))" }}>
        <div className="flex">
          {navItems.map(({ key, icon }) => {
            const isActive = tab === key;
            return (
              <button key={key} onClick={() => switchTab(key)}
                className="flex-1 flex flex-col items-center py-3 transition-all"
                style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                <Icon name={icon} size={22} />
                {isActive && (
                  <div className="w-1 h-1 rounded-full mt-1" style={{ background: "hsl(var(--primary))" }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
