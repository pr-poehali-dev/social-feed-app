import { useState, useEffect, useCallback } from "react";
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";
import CommentsPanel from "./CommentsPanel";
import { AuthUser, FeedPost, fetchFeed, createPost, likePost, deletePostApi } from "@/lib/api";

interface FeedProps {
  onUserClick: (userId: string) => void;
  currentUser?: AuthUser;
}

export default function Feed({ onUserClick, currentUser }: FeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const me = currentUser;

  const loadFeed = useCallback(async () => {
    const data = await fetchFeed();
    setPosts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  if (!me) return null;

  const handleLike = async (postId: string) => {
    // Оптимистичное обновление
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
    await likePost(postId);
  };

  const handlePost = async () => {
    if (!newPost.trim() || posting) return;
    setPosting(true);
    const post = await createPost(newPost.trim());
    if (post) {
      setPosts((prev) => [post, ...prev]);
      setNewPost("");
    }
    setPosting(false);
  };

  const handleDelete = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await deletePostApi(postId);
  };

  return (
    <div className="flex flex-col">

      {/* Compose */}
      <div className="m-3 rounded-2xl border border-border p-4" style={{ background: "hsl(var(--card))" }}>
        <div className="flex gap-3">
          <button onClick={() => onUserClick("me")} className="flex-shrink-0">
            <Avatar initials={me.avatar || me.name.slice(0, 2).toUpperCase()} accent />
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
              <p className="text-xs text-muted-foreground">{newPost.length > 0 ? `${newPost.length}/2000` : ""}</p>
              <button
                onClick={handlePost}
                disabled={!newPost.trim() || posting}
                className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all disabled:opacity-40 flex items-center gap-2"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                {posting && <Icon name="Loader2" size={14} className="animate-spin" />}
                Опубликовать
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Загрузка */}
      {loading && (
        <div className="flex flex-col gap-2 px-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border p-4" style={{ background: "hsl(var(--card))" }}>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary animate-pulse flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2 pt-1">
                  <div className="h-3 w-32 bg-secondary rounded animate-pulse" />
                  <div className="h-3 w-full bg-secondary rounded animate-pulse" />
                  <div className="h-3 w-3/4 bg-secondary rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Пустая лента */}
      {!loading && posts.length === 0 && (
        <div className="m-3 rounded-2xl border border-border p-8 text-center"
          style={{ background: "hsl(var(--card))" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "hsl(var(--secondary))" }}>
            <Icon name="Rss" size={22} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">Лента пуста</p>
          <p className="text-xs text-muted-foreground">Напишите первый пост!</p>
        </div>
      )}

      {/* Posts */}
      {posts.map((post, i) => {
        const isOwn = post.userId === String(me.id);
        const avatarInitials = post.authorAvatar || post.authorName.slice(0, 2).toUpperCase();

        return (
          <div
            key={post.id}
            className="mx-3 mb-2 rounded-2xl border border-border p-4 card-hover animate-fade-in group"
            style={{ background: "hsl(var(--card))", animationDelay: `${Math.min(i * 35, 300)}ms` }}
          >
            <div className="flex gap-3">
              <button onClick={() => onUserClick(post.userId)} className="flex-shrink-0">
                {post.authorAvatarUrl
                  ? <img src={post.authorAvatarUrl} alt={post.authorName}
                      className="w-10 h-10 rounded-full object-cover border border-border" />
                  : <Avatar initials={avatarInitials} />
                }
              </button>
              <div className="flex-1 min-w-0">
                {/* Шапка */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <button onClick={() => onUserClick(post.userId)}
                    className="font-semibold text-sm hover:underline leading-tight">
                    {post.authorName}
                  </button>
                  <span className="text-xs text-muted-foreground">@{post.authorUsername}</span>
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
                <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>

                {/* Действия */}
                <div className="flex items-center gap-1 -ml-1.5 mb-1">
                  <button onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all group/like"
                    style={{ color: post.isLiked ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                    <Icon name="Heart" size={15}
                      className={`transition-transform group-hover/like:scale-110 ${post.isLiked ? "fill-current" : ""}`} />
                    <span>{post.likes}</span>
                  </button>
                  <CommentsPanel
                    postId={post.id}
                    commentsCount={post.comments}
                    onCountChange={(delta) => setPosts((prev) =>
                      prev.map((p) => p.id === post.id ? { ...p, comments: p.comments + delta } : p)
                    )}
                    onUserClick={onUserClick}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}