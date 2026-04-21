import { useState, useEffect } from "react";
import Feed from "@/components/Feed";
import ProfileView from "@/components/ProfileView";
import Messages from "@/components/Messages";
import Discover from "@/components/Discover";
import AuthScreen from "@/components/AuthScreen";
import Icon from "@/components/ui/icon";
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <span className="text-2xl font-semibold font-mono-plex" style={{ color: "hsl(var(--primary))" }}>
          void
        </span>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuth={setUser} />;
  }

  const navItems: { key: Tab; icon: string; label: string }[] = [
    { key: "feed", icon: "Home", label: "Лента" },
    { key: "discover", icon: "Compass", label: "Люди" },
    { key: "messages", icon: "MessageCircle", label: "Сообщения" },
    { key: "profile", icon: "User", label: "Профиль" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Top bar */}
      <header
        className="fixed top-0 left-0 right-0 z-20 border-b border-border backdrop-blur-sm"
        style={{ background: "hsla(0, 0%, 5%, 0.85)" }}
      >
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
          <span
            className="text-base font-semibold font-mono-plex tracking-tight"
            style={{ color: "hsl(var(--primary))" }}
          >
            void
          </span>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground transition-colors text-xs flex items-center gap-1.5"
          >
            <Icon name="LogOut" size={14} />
            <span className="font-mono-plex">выйти</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full pt-12 pb-14">
        <div className="min-h-[calc(100vh-104px)]">
          {tab === "feed" && <Feed onUserClick={openProfile} currentUser={user} />}

          {tab === "discover" && (
            <Discover onUserClick={openProfile} onMessage={openMessage} />
          )}

          {tab === "messages" && (
            <div className="h-[calc(100vh-104px)] flex flex-col">
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
              onBack={() => {
                setTab("feed");
                setProfileId(null);
              }}
              currentUser={user}
            />
          )}
        </div>
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-border backdrop-blur-sm"
        style={{ background: "hsla(0, 0%, 5%, 0.9)" }}
      >
        <div className="max-w-lg mx-auto flex">
          {navItems.map(({ key, icon, label }) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                onClick={() => {
                  if (key === "profile") setProfileId(null);
                  if (key !== "messages") setMessageUserId(null);
                  setTab(key);
                }}
                className="flex-1 flex flex-col items-center gap-0.5 py-3 transition-all"
                style={{
                  color: isActive
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted-foreground))",
                }}
              >
                <Icon name={icon} size={18} />
                <span className="text-[10px] font-mono-plex">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}