import { useState, useEffect } from "react";
import { users as mockUsers } from "@/data/mockData";
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";
import EditProfileModal from "./EditProfileModal";
import { AuthUser, FullProfile, fetchMyProfile, deletePost } from "@/lib/api";

interface ProfileViewProps {
  userId: string;
  onMessage: (userId: string) => void;
  onBack: () => void;
  currentUser?: AuthUser;
  onProfileUpdate?: (updated: Partial<AuthUser>) => void;
}

export default function ProfileView({ userId, onMessage, onBack, currentUser, onProfileUpdate }: ProfileViewProps) {
  const isMe = userId === "me" || (currentUser && String(currentUser.id) === userId);

  // Профиль
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Посты (мок пока нет реального API постов)
  const [posts, setPosts] = useState<{ id: string; content: string; timestamp: string; likes: number; comments: number }[]>([]);

  useEffect(() => {
    setLoading(true);
    if (isMe && currentUser) {
      fetchMyProfile().then((p) => {
        if (p) setProfile(p);
        else setProfile({
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          bio: currentUser.bio || "",
          avatar: currentUser.avatar,
          avatarUrl: "",
          bannerUrl: "",
          followers: currentUser.followers,
          following: currentUser.following,
          posts: currentUser.posts,
        });
        setLoading(false);
      });
    } else {
      // Для чужого профиля — из мок-данных или базовых данных
      const mockUser = mockUsers.find((u) => u.id === userId);
      if (mockUser) {
        setProfile({
          id: Number(mockUser.id),
          name: mockUser.name,
          username: mockUser.username,
          bio: mockUser.bio,
          avatar: mockUser.avatar,
          avatarUrl: "",
          bannerUrl: "",
          followers: mockUser.followers,
          following: mockUser.following,
          posts: mockUser.posts,
        });
        setIsFollowing(mockUser.isFollowing || false);
      }
      setLoading(false);
    }
  }, [userId, isMe, currentUser]);

  const handleEditSave = (updated: Partial<FullProfile>) => {
    setProfile((prev) => prev ? { ...prev, ...updated } : prev);
    if (onProfileUpdate) {
      onProfileUpdate({
        name: updated.name,
        bio: updated.bio,
        avatar: updated.avatar,
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    const ok = await deletePost(postId);
    if (ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleFollow = () => {
    setIsFollowing((v) => !v);
    setProfile((prev) => prev ? {
      ...prev,
      followers: isFollowing ? prev.followers - 1 : prev.followers + 1
    } : prev);
  };

  if (loading) {
    return (
      <div className="flex flex-col animate-fade-in">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={18} />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <div className="w-16 h-16 rounded-full bg-secondary animate-pulse" />
          <div className="h-4 w-32 bg-secondary rounded animate-pulse" />
          <div className="h-3 w-24 bg-secondary rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="animate-fade-in">
      {/* Шапка навигации */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 z-10 backdrop-blur-sm"
        style={{ background: "hsla(216,18%,13%,0.9)" }}>
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="ArrowLeft" size={18} />
        </button>
        <div>
          <p className="text-sm font-semibold leading-tight">{profile.name}</p>
          <p className="text-xs text-muted-foreground">@{profile.username}</p>
        </div>
      </div>

      {/* Баннер */}
      <div className="relative h-32 sm:h-44"
        style={{ background: profile.bannerUrl ? undefined : "hsl(var(--secondary))" }}>
        {profile.bannerUrl
          ? <img src={profile.bannerUrl} alt="banner" className="w-full h-full object-cover" />
          : <div className="w-full h-full"
              style={{ background: "linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--muted)) 100%)" }} />
        }
      </div>

      {/* Аватар + кнопки */}
      <div className="px-4 pb-4 border-b border-border">
        <div className="flex items-end justify-between -mt-8 mb-3">
          {/* Аватар */}
          <div className="w-16 h-16 rounded-full overflow-hidden border-4 flex-shrink-0"
            style={{ borderColor: "hsl(var(--card))" }}>
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              : <Avatar initials={profile.avatar} size="lg" accent={!!isMe} />
            }
          </div>

          {/* Кнопки */}
          <div className="flex gap-2 mt-2">
            {isMe ? (
              <button onClick={() => setShowEdit(true)}
                className="px-4 py-1.5 rounded-full text-sm font-medium border border-border hover:bg-secondary transition-all"
                style={{ color: "hsl(var(--foreground))" }}>
                Редактировать
              </button>
            ) : (
              <>
                <button onClick={() => onMessage(userId)}
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all">
                  <Icon name="MessageCircle" size={15} />
                </button>
                <button onClick={handleFollow}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: isFollowing ? "transparent" : "hsl(var(--primary))",
                    color: isFollowing ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))",
                    border: isFollowing ? "1px solid hsl(var(--border))" : "none",
                  }}>
                  {isFollowing ? "Отписаться" : "Подписаться"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Инфо */}
        <h2 className="text-base font-bold mb-0.5">{profile.name}</h2>
        <p className="text-sm text-muted-foreground mb-2">@{profile.username}</p>
        {profile.bio && <p className="text-sm leading-relaxed mb-3">{profile.bio}</p>}

        {/* Статистика */}
        <div className="flex gap-5">
          <button className="flex items-center gap-1 hover:underline">
            <span className="text-sm font-bold">{profile.followers.toLocaleString("ru")}</span>
            <span className="text-xs text-muted-foreground">подписчиков</span>
          </button>
          <button className="flex items-center gap-1 hover:underline">
            <span className="text-sm font-bold">{profile.following}</span>
            <span className="text-xs text-muted-foreground">подписок</span>
          </button>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold">{profile.posts}</span>
            <span className="text-xs text-muted-foreground">постов</span>
          </div>
        </div>
      </div>

      {/* Посты */}
      <div>
        {posts.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "hsl(var(--secondary))" }}>
              <Icon name="FileText" size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Нет постов</p>
            {isMe && <p className="text-xs text-muted-foreground mt-1">Поделитесь чем-нибудь в ленте</p>}
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="p-4 border-b border-border group">
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm leading-relaxed flex-1">{post.content}</p>
                {isMe && (
                  <button onClick={() => handleDeletePost(post.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0">
                    <Icon name="Trash2" size={14} />
                  </button>
                )}
              </div>
              <div className="flex gap-4 mt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Icon name="Heart" size={12} />{post.likes}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Icon name="MessageCircle" size={12} />{post.comments}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{post.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модал редактирования */}
      {showEdit && profile && (
        <EditProfileModal
          profile={profile}
          onSave={handleEditSave}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}
