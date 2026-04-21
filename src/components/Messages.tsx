import { useState } from "react";
import { conversations, users, currentUser } from "@/data/mockData";
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";

interface MessagesProps {
  initialUserId?: string | null;
  onUserClick: (userId: string) => void;
}

export default function Messages({ initialUserId, onUserClick }: MessagesProps) {
  const [activeConv, setActiveConv] = useState<string | null>(initialUserId || null);
  const [convs, setConvs] = useState(conversations);
  const [input, setInput] = useState("");

  const getUser = (id: string) => users.find((u) => u.id === id) || users[0];

  const activeMessages = convs.find((c) => c.userId === activeConv)?.messages || [];

  const sendMessage = () => {
    if (!input.trim() || !activeConv) return;
    setConvs((prev) =>
      prev.map((c) =>
        c.userId === activeConv
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: `m_${Date.now()}`,
                  fromId: "me",
                  toId: activeConv,
                  text: input.trim(),
                  timestamp: "сейчас",
                  isRead: false,
                },
              ],
            }
          : c
      )
    );
    setInput("");
  };

  if (activeConv) {
    const user = getUser(activeConv);
    return (
      <div className="flex flex-col h-full animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0">
          <button
            onClick={() => setActiveConv(null)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="ArrowLeft" size={18} />
          </button>
          <button onClick={() => onUserClick(activeConv)} className="flex items-center gap-2">
            <Avatar initials={user.avatar} size="sm" />
            <div>
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs text-muted-foreground font-mono-plex">@{user.username}</p>
            </div>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {activeMessages.map((msg) => {
            const isMe = msg.fromId === "me";
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: isMe ? "hsl(var(--primary))" : "hsl(var(--secondary))",
                    color: isMe ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                    borderBottomRightRadius: isMe ? "4px" : undefined,
                    borderBottomLeftRadius: !isMe ? "4px" : undefined,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex gap-2 items-center">
            <input
              className="flex-1 bg-secondary border border-border rounded-full px-4 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40 transition-colors"
              placeholder="Сообщение..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              <Icon name="Send" size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold">Сообщения</h2>
      </div>
      {convs.map(({ userId, messages }) => {
        const user = getUser(userId);
        const last = messages[messages.length - 1];
        const unread = messages.filter((m) => !m.isRead && m.fromId !== "me").length;
        return (
          <button
            key={userId}
            onClick={() => setActiveConv(userId)}
            className="w-full flex items-center gap-3 p-4 border-b border-border hover:bg-white/[0.02] transition-colors text-left"
          >
            <div className="relative">
              <Avatar initials={user.avatar} size="md" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-medium"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                  {unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-0.5">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground">{last.timestamp}</span>
              </div>
              <p className={`text-xs truncate ${unread > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                {last.fromId === "me" ? "Вы: " : ""}{last.text}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
