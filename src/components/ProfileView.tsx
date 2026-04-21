import { useState, useEffect } from "react";
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";
import EditProfileModal from "./EditProfileModal";
import { AuthUser, FullProfile, FeedPost, fetchMyProfile, fetchPublicProfile, fetchUserPosts, deletePostApi, likePost } from "@/lib/api";

interface ProfileViewProps {
  userId: string;
  onMessage: (userId: string) => void;
  onBack: () => void;
  currentUser?: AuthUser;
  onProfileUpdate?: (updated: Partial<AuthUser>) => void;
}

export default function ProfileView({ userId, onMessage, onBack, currentUser, onProfileUpdate }: ProfileViewProps) {
  const isMe = userId === "me" || (currentUser && String(currentUser.id) === userId);
  const realUserId = isMe ? String(currentUser?.id || "") : userId;

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Загрузка профиля
  useEffect(() => {
    setLoading(true);
    setLoadingPosts(true);
    setPosts([]);

    if (isMe && currentUser) {
      fetchMyProfile().then((p) => {
        setProfile(p || {
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
      // Чужой профиль — загружаем из API
      fetchPublicProfile(userId).then((p) => {
        if (p) {
          setProfile({
            id: Number(p.id),
            name: p.name,
            username: p.username,
            bio: p.bio,
            avatar: p.avatar,
            avatarUrl: p.avatarUrl,
            bannerUrl: p.bannerUrl,
            followers: p.followers,
            following: p.following,
            posts: p.posts,
          });
          setIsFollowing(p.isFollowing);
        }
        setLoading(false);
      });
    }

    // Посты пользователя
    fetchUserPosts(realUserId).then((data) => {
      setPosts(data);
      setLoadingPosts(false);
    });
  }, [userId]);

  const handleEditSave = (updated: Partial<FullProfile>) => {
    setProfile((prev) => prev ? { ...prev, ...updated } : prev);
    if (onProfileUpdate) onProfileUpdate({ name: updated.name, bio: updated.bio, avatar: updated.avatar });
  };

  const handleDeletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await deletePostApi(postId);
  };

  const handleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
    await likePost(postId);
  };

  const handleFollow = () => {
    setIsFollowing((v) => !v);
    setProfile((prev) => prev ? {
      ...prev,
      followers: isFollowing ? prev.followers - 1 : prev.followers + 1,
    } : prev);
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="ArrowLeft" size={18} />
          </button>
        </div>
        <div className="h-32 bg-secondary animate-pulse" />
        <div className="p-4 flex flex-col gap-3">
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
      {/* Шапка */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 z-10 backdrop-blur-sm"
        style={{ background: "hsla(216,18%,13%,0.9)" }}>
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="ArrowLeft" size={18} />
        </button>
        <div>
          <p className="text-sm font-semibold leading-tight">{profile.name}</p>
          <p className="text-xs text-muted-foreground">{posts.length} постов</p>
        </div>
      </div>

      {/* Баннер */}
      <div className="relative h-32 sm:h-44">
        {profile.bannerUrl
          ? <img src={profile.bannerUrl} alt="banner" className="w-full h-full object-cover" />
          : <div className="w-full h-full"
              style={{ background: "linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--muted)) 100%)" }} />
        }
      </div>

      {/* Аватар + кнопки */}
      <div className="px-4 pb-4 border-b border-border">
        <div className="flex items-start justify-between mb-3" style={{ marginTop: "-32px" }}>
          <div className="w-16 h-16 rounded-full overflow-hidden border-4 flex-shrink-0 relative z-10"
            style={{ borderColor: "hsl(var(--background))" }}>
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
              : <Avatar initials={profile.avatar || profile.name.slice(0, 2).toUpperCase()} size="lg" accent={!!isMe} />
            }
          </div>
          <div className="flex gap-2 mt-10">
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

        <h2 className="text-base font-bold mb-0.5">{profile.name}</h2>
        <p className="text-sm text-muted-foreground mb-2">@{profile.username}</p>
        {profile.bio && <p className="text-sm leading-relaxed mb-3">{profile.bio}</p>}

        <div className="flex gap-5">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold">{profile.followers.toLocaleString("ru")}</span>
            <span className="text-xs text-muted-foreground">подписчиков</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold">{profile.following}</span>
            <span className="text-xs text-muted-foreground">подписок</span>
          </div>
        </div>
      </div>

      {/* Посты */}
      <div>
        {loadingPosts && (
          <div className="flex flex-col gap-0">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 border-b border-border flex flex-col gap-2">
                <div className="h-3 w-full bg-secondary rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-secondary rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {!loadingPosts && posts.length === 0 && (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "hsl(var(--secondary))" }}>
              <Icon name="FileText" size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Нет постов</p>
            {isMe && <p className="text-xs text-muted-foreground mt-1">Поделитесь чем-нибудь в ленте</p>}
          </div>
        )}

        {posts.map((post) => (
          <div key={post.id} className="p-4 border-b border-border group hover:bg-white/[0.02] transition-colors">
            <div className="flex justify-between items-start gap-2 mb-2">
              <p className="text-sm leading-relaxed flex-1 whitespace-pre-wrap">{post.content}</p>
              {isMe && (
                <button onClick={() => handleDeletePost(post.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0">
                  <Icon name="Trash2" size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 -ml-1.5">
              <button onClick={() => handleLike(post.id)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all"
                style={{ color: post.isLiked ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                <Icon name="Heart" size={13} className={post.isLiked ? "fill-current" : ""} />
                <span>{post.likes}</span>
              </button>
              <button className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground">
                <Icon name="MessageCircle" size={13} />
                <span>{post.comments}</span>
              </button>
              <span className="text-xs text-muted-foreground ml-auto">{post.timestamp}</span>
            </div>
          </div>
        ))}
      </div>

      {showEdit && profile && (
        <EditProfileModal profile={profile} onSave={handleEditSave} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
}