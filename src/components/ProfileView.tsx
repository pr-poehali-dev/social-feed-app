import { useState } from "react";
import { users, currentUser as mockCurrentUser, posts } from "@/data/mockData";
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";
import { AuthUser } from "@/lib/api";

interface ProfileViewProps {
  userId: string;
  onMessage: (userId: string) => void;
  onBack: () => void;
  currentUser?: AuthUser;
}

export default function ProfileView({ userId, onMessage, onBack, currentUser }: ProfileViewProps) {
  const me = currentUser || mockCurrentUser;
  const isMe = userId === "me";
  const rawUser = isMe ? me : users.find((u) => u.id === userId);
  const [user, setUser] = useState(rawUser ? { ...rawUser } : null);

  if (!user) return null;

  const userPosts = posts.filter((p) => p.userId === userId);

  const handleFollow = () => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            isFollowing: !prev.isFollowing,
            followers: prev.isFollowing ? prev.followers - 1 : prev.followers + 1,
          }
        : prev
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icon name="ArrowLeft" size={18} />
        </button>
        <span className="text-sm font-medium">{user.name}</span>
      </div>

      {/* Profile header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <Avatar initials={user.avatar} size="lg" accent={isMe} />
          {!isMe && (
            <div className="flex gap-2">
              <button
                onClick={() => onMessage(userId)}
                className="px-3 py-1.5 rounded-full text-xs border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
              >
                <Icon name="MessageCircle" size={13} className="inline mr-1" />
                Написать
              </button>
              <button
                onClick={handleFollow}
                className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: user.isFollowing ? "transparent" : "hsl(var(--primary))",
                  color: user.isFollowing ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))",
                  border: user.isFollowing ? "1px solid hsl(var(--border))" : "none",
                }}
              >
                {user.isFollowing ? "Отписаться" : "Подписаться"}
              </button>
            </div>
          )}
        </div>

        <h2 className="text-base font-semibold mb-0.5">{user.name}</h2>
        <p className="text-xs text-muted-foreground font-mono-plex mb-3">@{user.username}</p>
        {user.bio && <p className="text-sm text-foreground/80 mb-4">{user.bio}</p>}

        <div className="flex gap-5">
          {[
            { label: "постов", value: user.posts },
            { label: "подписчиков", value: user.followers.toLocaleString("ru") },
            { label: "подписок", value: user.following },
          ].map(({ label, value }) => (
            <div key={label}>
              <span className="text-sm font-semibold">{value}</span>
              <span className="text-xs text-muted-foreground ml-1">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div>
        {userPosts.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Нет постов</div>
        ) : (
          userPosts.map((post) => (
            <div key={post.id} className="p-4 border-b border-border">
              <p className="text-sm leading-relaxed text-foreground/90 mb-2">{post.content}</p>
              <div className="flex gap-4">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Icon name="Heart" size={12} />
                  {post.likes}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Icon name="MessageCircle" size={12} />
                  {post.comments}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{post.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}