import { useState, useEffect, useRef } from "react";
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  deleteMessage,
  Conversation,
  ChatMessage,
  OtherUser,
} from "@/lib/api";

interface MessagesProps {
  initialUserId?: string | null;
  onUserClick: (userId: string) => void;
  currentUserId?: string;
}

export default function Messages({ initialUserId, onUserClick, currentUserId }: MessagesProps) {
  const [activeUserId, setActiveUserId] = useState<string | null>(initialUserId || null);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [input, setInput] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Загружаем список диалогов
  useEffect(() => {
    setLoadingConvs(true);
    fetchConversations().then((data) => {
      setConvs(data);
      setLoadingConvs(false);
    });
  }, []);

  // Если передан initialUserId — сразу открываем чат
  useEffect(() => {
    if (initialUserId) {
      openChat(initialUserId);
    }
  }, [initialUserId]);

  // Загружаем сообщения при открытии чата
  const openChat = async (userId: string) => {
    setActiveUserId(userId);
    setLoadingMsgs(true);
    setMessages([]);
    const data = await fetchMessages(userId);
    setMessages(data.messages);
    setOtherUser(data.otherUser);
    setLoadingMsgs(false);
  };

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling новых сообщений каждые 3 сек когда чат открыт
  useEffect(() => {
    if (!activeUserId) return;
    const interval = setInterval(async () => {
      const data = await fetchMessages(activeUserId);
      setMessages(data.messages);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeUserId]);

  const handleSend = async () => {
    if (!input.trim() || !activeUserId) return;
    const text = input.trim();
    setInput("");

    // Оптимистично добавляем
    const optimistic: ChatMessage = {
      id: `tmp_${Date.now()}`,
      fromId: "me",
      toId: activeUserId,
      text,
      isRead: false,
      timestamp: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, optimistic]);

    const sent = await sendMessage(activeUserId, text);
    if (sent) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? sent : m))
      );
      // Обновляем список диалогов
      setConvs((prev) => {
        const exists = prev.find((c) => c.userId === activeUserId);
        if (exists) {
          return prev.map((c) =>
            c.userId === activeUserId
              ? { ...c, lastText: text, lastFromMe: true, lastTime: sent.timestamp }
              : c
          );
        }
        return prev;
      });
    }
  };

  if (activeUserId) {
    const user = otherUser || convs.find((c) => c.userId === activeUserId);
    const name = user ? ("name" in user ? user.name : (user as Conversation).name) : "...";
    const username = user ? ("username" in user ? user.username : (user as Conversation).username) : "";
    const avatar = user ? ("avatar" in user ? user.avatar : (user as Conversation).avatar) : "??";

    return (
      <div className="flex flex-col h-full animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0">
          <button
            onClick={() => { setActiveUserId(null); setMessages([]); setOtherUser(null); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="ArrowLeft" size={18} />
          </button>
          <button onClick={() => onUserClick(activeUserId)} className="flex items-center gap-2">
            <Avatar initials={avatar} size="sm" />
            <div>
              <p className="text-sm font-medium leading-none">{name}</p>
              {username && <p className="text-xs text-muted-foreground font-mono-plex">@{username}</p>}
            </div>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {loadingMsgs && (
            <div className="flex justify-center py-8">
              <Icon name="Loader2" size={18} className="animate-spin text-muted-foreground" />
            </div>
          )}
          {!loadingMsgs && messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
              Начните переписку
            </div>
          )}
          {messages.map((msg) => {
            const isMine = currentUserId
              ? msg.fromId === currentUserId || msg.id.startsWith("tmp_")
              : msg.fromId !== activeUserId;
            return (
              <div key={msg.id} className={`flex items-end gap-1.5 group ${isMine ? "justify-end" : "justify-start"}`}>
                {/* Кнопка удаления (только свои) */}
                {isMine && !msg.id.startsWith("tmp_") && (
                  <button
                    onClick={async () => {
                      const ok = await deleteMessage(msg.id);
                      if (ok) setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0 mb-1">
                    <Icon name="Trash2" size={12} />
                  </button>
                )}
                <div
                  className="max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: isMine ? "hsl(var(--primary))" : "hsl(var(--secondary))",
                    color: isMine ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                    borderBottomRightRadius: isMine ? "4px" : undefined,
                    borderBottomLeftRadius: !isMine ? "4px" : undefined,
                    opacity: msg.id.startsWith("tmp_") ? 0.7 : 1,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex gap-2 items-center">
            <input
              className="flex-1 bg-secondary border border-border rounded-full px-4 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/40 transition-colors"
              placeholder="Сообщение..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
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

      {loadingConvs && (
        <div className="flex flex-col">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-secondary animate-pulse" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3 w-32 bg-secondary rounded animate-pulse" />
                <div className="h-2 w-48 bg-secondary rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loadingConvs && convs.length === 0 && (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Пока нет переписок.<br />Найди человека в разделе «Люди» и напиши ему.
        </div>
      )}

      {convs.map((conv) => (
        <button
          key={conv.userId}
          onClick={() => openChat(conv.userId)}
          className="w-full flex items-center gap-3 p-4 border-b border-border hover:bg-white/[0.02] transition-colors text-left"
        >
          <div className="relative">
            <Avatar initials={conv.avatar} size="md" />
            {conv.unread > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-medium"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
              >
                {conv.unread}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-0.5">
              <span className="text-sm font-medium">{conv.name}</span>
              <span className="text-xs text-muted-foreground font-mono-plex">{conv.lastTime}</span>
            </div>
            <p className={`text-xs truncate ${conv.unread > 0 ? "text-foreground" : "text-muted-foreground"}`}>
              {conv.lastFromMe ? "Вы: " : ""}{conv.lastText}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}