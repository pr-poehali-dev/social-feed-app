import { useState } from "react";
import { posts as initialPosts, users, currentUser as mockCurrentUser } from "@/data/mockData";
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";
import { AuthUser } from "@/lib/api";

interface FeedProps {
  onUserClick: (userId: string) => void;
  currentUser?: AuthUser;
}

export default function Feed({ onUserClick, currentUser }: FeedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [newPost, setNewPost] = useState("");

  const me = currentUser || mockCurrentUser;

  const getUser = (id: string) => {
    if (id === "me") return me;
    return users.find((u) => u.id === id) || users[0];
  };

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post = {
      id: `p_${Date.now()}`,
      userId: "me",
      content: newPost.trim(),
      timestamp: "только что",
      likes: 0,
      isLiked: false,
      comments: 0,
    };
    setPosts([post, ...posts]);
    setNewPost("");
  };

  return (
    <div className="flex flex-col">

      {/* Compose — карточка как в VK */}
      <div className="m-3 rounded-2xl border border-border p-4" style={{ background: "hsl(var(--card))" }}>
        <div className="flex gap-3">
          <Avatar initials={me.avatar} accent />
          <div className="flex-1 flex flex-col gap-3">
            <textarea
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-sm leading-relaxed min-h-[64px]"
              placeholder="Что у вас нового?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handlePost(); }}
            />
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex gap-2 text-muted-foreground">
                <button className="p-1.5 rounded-lg hover:bg-secondary hover:text-primary transition-all">
                  <Icon name="Image" size={16} />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-secondary hover:text-primary transition-all">
                  <Icon name="Smile" size={16} />
                </button>
              </div>
              <button
                onClick={handlePost}
                disabled={!newPost.trim()}
                className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all disabled:opacity-40"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                Опубликовать
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.map((post, i) => {
        const user = getUser(post.userId);
        return (
          <div
            key={post.id}
            className="mx-3 mb-2 rounded-2xl border border-border p-4 card-hover animate-fade-in cursor-pointer"
            style={{ background: "hsl(var(--card))", animationDelay: `${i * 35}ms` }}
          >
            <div className="flex gap-3">
              <button onClick={() => onUserClick(post.userId)} className="flex-shrink-0">
                <Avatar initials={user.avatar} accent={post.userId === "me"} />
              </button>
              <div className="flex-1 min-w-0">
                {/* Шапка поста */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <button
                    onClick={() => onUserClick(post.userId)}
                    className="font-semibold text-sm hover:underline transition-all leading-tight"
                  >
                    {user.name}
                  </button>
                  <span className="text-xs text-muted-foreground">@{user.username}</span>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-xs text-muted-foreground ml-auto">{post.timestamp}</span>
                </div>

                {/* Текст */}
                <p className="text-sm leading-relaxed mb-3" style={{ color: "hsl(var(--foreground))" }}>
                  {post.content}
                </p>

                {/* Действия */}
                <div className="flex items-center gap-1 -ml-1.5">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all group"
                    style={{ color: post.isLiked ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
                  >
                    <Icon
                      name="Heart"
                      size={15}
                      className={`transition-transform group-hover:scale-110 ${post.isLiked ? "fill-current" : ""}`}
                    />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                    <Icon name="MessageCircle" size={15} />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all ml-auto">
                    <Icon name="Share2" size={15} />
                    <span className="hidden sm:inline">Поделиться</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
