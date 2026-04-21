import { useState } from "react";
import { posts as initialPosts, users, currentUser } from "@/data/mockData";
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";

interface FeedProps {
  onUserClick: (userId: string) => void;
}

export default function Feed({ onUserClick }: FeedProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [newPost, setNewPost] = useState("");

  const getUser = (id: string) => {
    if (id === "me") return currentUser;
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
    <div className="flex flex-col gap-0">
      {/* Compose */}
      <div className="border-b border-border p-4 pb-4">
        <div className="flex gap-3">
          <Avatar initials={currentUser.avatar} accent />
          <div className="flex-1 flex flex-col gap-3">
            <textarea
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-sm leading-relaxed min-h-[56px]"
              placeholder="Что происходит?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) handlePost();
              }}
            />
            <div className="flex justify-end">
              <button
                onClick={handlePost}
                disabled={!newPost.trim()}
                className="px-4 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-30"
                style={{
                  background: newPost.trim() ? "hsl(var(--primary))" : "hsl(var(--secondary))",
                  color: newPost.trim() ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
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
            className="border-b border-border p-4 hover:bg-white/[0.02] transition-colors animate-fade-in"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex gap-3">
              <button onClick={() => onUserClick(post.userId)}>
                <Avatar initials={user.avatar} accent={post.userId === "me"} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <button
                    onClick={() => onUserClick(post.userId)}
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    {user.name}
                  </button>
                  <span className="text-xs text-muted-foreground font-mono-plex">@{user.username}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{post.timestamp}</span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 mb-3">{post.content}</p>
                <div className="flex gap-5">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 text-xs transition-all group"
                    style={{ color: post.isLiked ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
                  >
                    <Icon
                      name="Heart"
                      size={14}
                      className={`transition-transform group-hover:scale-110 ${post.isLiked ? "fill-current" : ""}`}
                    />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="MessageCircle" size={14} />
                    <span>{post.comments}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto">
                    <Icon name="Share2" size={14} />
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
