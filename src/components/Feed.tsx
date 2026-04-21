import { useState } from "react";
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";
import { AuthUser } from "@/lib/api";

interface Post {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  comments: number;
}

interface FeedProps {
  onUserClick: (userId: string) => void;
  currentUser?: AuthUser;
}

export default function Feed({ onUserClick, currentUser }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");

  const me = currentUser;
  if (!me) return null;

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
    const post: Post = {
      id: `p_${Date.now()}`,
      userId: String(me.id),
      content: newPost.trim(),
      timestamp: "только что",
      likes: 0,
      isLiked: false,
      comments: 0,
    };
    setPosts([post, ...posts]);
    setNewPost("");
  };

  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="flex flex-col">

      {/* Compose */}
      <div className="m-3 rounded-2xl border border-border p-4" style={{ background: "hsl(var(--card))" }}>
        <div className="flex gap-3">
          <button onClick={() => onUserClick("me")} className="flex-shrink-0">
            {me.avatar
              ? <Avatar initials={me.avatar} accent />
              : <div className="w-10 h-10 rounded-full bg-secondary" />
            }
          </button>
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
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                Опубликовать
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Пустая лента */}
      {posts.length === 0 && (
        <div className="m-3 rounded-2xl border border-border p-8 text-center"
          style={{ background: "hsl(var(--card))" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "hsl(var(--secondary))" }}>
            <Icon name="Rss" size={22} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">Лента пуста</p>
          <p className="text-xs text-muted-foreground">Напишите первый пост или подпишитесь на людей</p>
        </div>
      )}

      {/* Posts */}
      {posts.map((post, i) => {
        const isOwn = post.userId === String(me.id) || post.userId === "me";
        return (
          <div
            key={post.id}
            className="mx-3 mb-2 rounded-2xl border border-border p-4 card-hover animate-fade-in group"
            style={{ background: "hsl(var(--card))", animationDelay: `${i * 35}ms` }}
          >
            <div className="flex gap-3">
              <button onClick={() => onUserClick(post.userId)} className="flex-shrink-0">
                <Avatar initials={me.avatar} accent />
              </button>
              <div className="flex-1 min-w-0">
                {/* Шапка */}
                <div className="flex items-center gap-2 mb-1.5">
                  <button onClick={() => onUserClick(post.userId)}
                    className="font-semibold text-sm hover:underline leading-tight">
                    {me.name}
                  </button>
                  <span className="text-xs text-muted-foreground">@{me.username}</span>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-xs text-muted-foreground">{post.timestamp}</span>
                  {isOwn && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Icon name="Trash2" size={13} />
                    </button>
                  )}
                </div>

                {/* Текст */}
                <p className="text-sm leading-relaxed mb-3">{post.content}</p>

                {/* Действия */}
                <div className="flex items-center gap-1 -ml-1.5">
                  <button onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all group/like"
                    style={{ color: post.isLiked ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                    <Icon name="Heart" size={15}
                      className={`transition-transform group-hover/like:scale-110 ${post.isLiked ? "fill-current" : ""}`} />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                    <Icon name="MessageCircle" size={15} />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all ml-auto">
                    <Icon name="Share2" size={15} />
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
