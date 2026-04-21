import { useState, useEffect, useRef } from "react";
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";
import { fetchComments, addComment, deleteComment, Comment } from "@/lib/api";

interface CommentsPanelProps {
  postId: string;
  commentsCount: number;
  onCountChange: (delta: number) => void;
  onUserClick: (userId: string) => void;
}

export default function CommentsPanel({ postId, commentsCount, onCountChange, onUserClick }: CommentsPanelProps) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchComments(postId).then((data) => {
      setComments(data);
      setLoading(false);
    });
  }, [open, postId]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    const comment = await addComment(postId, text);
    if (comment) {
      setComments((prev) => [...prev, comment]);
      onCountChange(1);
    }
    setSending(false);
  };

  const handleDelete = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    onCountChange(-1);
    await deleteComment(commentId);
  };

  return (
    <div>
      {/* Кнопка раскрытия */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all"
        style={{ color: open ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
      >
        <Icon name="MessageCircle" size={15} className={open ? "fill-current opacity-80" : ""} />
        <span>{commentsCount}</span>
      </button>

      {/* Панель комментариев */}
      {open && (
        <div className="mt-3 pt-3 border-t border-border animate-fade-in">
          {/* Список */}
          {loading && (
            <div className="flex flex-col gap-2 mb-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary animate-pulse flex-shrink-0" />
                  <div className="flex-1 h-8 bg-secondary rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {!loading && comments.length === 0 && (
            <p className="text-xs text-muted-foreground mb-3 pl-1">Будьте первым, кто напишет комментарий</p>
          )}

          {!loading && comments.map((c) => (
            <div key={c.id} className="flex gap-2 mb-2.5 group">
              <button onClick={() => onUserClick(c.userId)} className="flex-shrink-0 mt-0.5">
                {c.authorAvatarUrl
                  ? <img src={c.authorAvatarUrl} className="w-7 h-7 rounded-full object-cover border border-border" />
                  : <Avatar initials={c.authorAvatar || c.authorName.slice(0, 2).toUpperCase()} size="sm" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <div className="inline-block rounded-2xl rounded-tl-sm px-3 py-2 max-w-full"
                  style={{ background: "hsl(var(--secondary))" }}>
                  <button onClick={() => onUserClick(c.userId)}
                    className="text-xs font-semibold hover:underline block leading-tight mb-0.5">
                    {c.authorName}
                  </button>
                  <p className="text-sm leading-snug break-words">{c.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 pl-1">
                  <span className="text-[11px] text-muted-foreground">{c.timestamp}</span>
                  {c.isOwn && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                      <Icon name="Trash2" size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Ввод */}
          <div className="flex gap-2 items-center mt-1">
            <input
              ref={inputRef}
              className="flex-1 bg-secondary border border-border rounded-full px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40 transition-colors"
              placeholder="Написать комментарий..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              maxLength={1000}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
              {sending
                ? <Icon name="Loader2" size={13} className="animate-spin" />
                : <Icon name="Send" size={13} />
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
