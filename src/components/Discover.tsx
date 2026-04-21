import { useState } from "react";
import { users } from "@/data/mockData";
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";

interface DiscoverProps {
  onUserClick: (userId: string) => void;
  onMessage: (userId: string) => void;
}

export default function Discover({ onUserClick, onMessage }: DiscoverProps) {
  const [list, setList] = useState(users);
  const [search, setSearch] = useState("");

  const filtered = list.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleFollow = (id: string) => {
    setList((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, isFollowing: !u.isFollowing, followers: u.isFollowing ? u.followers - 1 : u.followers + 1 }
          : u
      )
    );
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
          {search ? `Результаты: ${filtered.length}` : "Все пользователи"}
        </p>
      </div>

      {/* Users */}
      {filtered.map((user, i) => (
        <div
          key={user.id}
          className="flex items-center gap-3 p-4 border-b border-border hover:bg-white/[0.02] transition-colors animate-slide-up"
          style={{ animationDelay: `${i * 50}ms` }}
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
              onClick={() => handleFollow(user.id)}
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

      {filtered.length === 0 && (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Никого не найдено
        </div>
      )}
    </div>
  );
}
