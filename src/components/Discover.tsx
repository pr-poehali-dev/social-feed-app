import { useState, useEffect, useCallback } from "react";
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";
import { fetchUsers, followUser, unfollowUser, DiscoverUser } from "@/lib/api";

interface DiscoverProps {
  onUserClick: (userId: string) => void;
  onMessage: (userId: string) => void;
}

export default function Discover({ onUserClick, onMessage }: DiscoverProps) {
  const [list, setList] = useState<DiscoverUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    const users = await fetchUsers(q || undefined);
    setList(users);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  const handleFollow = async (id: string, isFollowing: boolean) => {
    setList((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, isFollowing: !isFollowing, followers: isFollowing ? u.followers - 1 : u.followers + 1 }
          : u
      )
    );
    if (isFollowing) {
      await unfollowUser(id);
    } else {
      await followUser(id);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full bg-secondary border border-border rounded-full pl-9 pr-4 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40 transition-colors"
            placeholder="Найти людей..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono-plex">
          {loading ? "Загрузка..." : search ? `Результаты: ${list.length}` : `Все пользователи · ${list.length}`}
        </p>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-secondary animate-pulse" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3 w-32 bg-secondary rounded animate-pulse" />
                <div className="h-2 w-20 bg-secondary rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {!loading && list.map((user, i) => (
        <div
          key={user.id}
          className="flex items-center gap-3 p-4 border-b border-border hover:bg-white/[0.02] transition-colors animate-slide-up"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <button onClick={() => onUserClick(user.id)}>
            <Avatar initials={user.avatar} />
          </button>
          <div className="flex-1 min-w-0">
            <button onClick={() => onUserClick(user.id)} className="text-left">
              <p className="text-sm font-medium hover:text-primary transition-colors">{user.name}</p>
              <p className="text-xs text-muted-foreground font-mono-plex">@{user.username}</p>
            </button>
            {user.bio && <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">{user.bio}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onMessage(user.id)}
              className="w-7 h-7 rounded-full flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
            >
              <Icon name="MessageCircle" size={13} />
            </button>
            <button
              onClick={() => handleFollow(user.id, user.isFollowing)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: user.isFollowing ? "transparent" : "hsl(var(--primary))",
                color: user.isFollowing ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))",
                border: user.isFollowing ? "1px solid hsl(var(--border))" : "none",
              }}
            >
              {user.isFollowing ? "Отписаться" : "Подписаться"}
            </button>
          </div>
        </div>
      ))}

      {!loading && list.length === 0 && (
        <div className="p-8 text-center text-sm text-muted-foreground">
          {search ? "Никого не найдено" : "Пока нет других пользователей"}
        </div>
      )}
    </div>
  );
}
