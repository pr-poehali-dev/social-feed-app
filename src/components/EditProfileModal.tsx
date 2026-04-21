import { useState, useRef } from "react";
import { updateProfile, uploadAvatar, uploadBanner, FullProfile } from "@/lib/api";
import Avatar from "./Avatar";
import Icon from "@/components/ui/icon";

interface EditProfileModalProps {
  profile: FullProfile;
  onSave: (updated: Partial<FullProfile>) => void;
  onClose: () => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EditProfileModal({ profile, onSave, onClose }: EditProfileModalProps) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl || "");
  const [bannerPreview, setBannerPreview] = useState(profile.bannerUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setUploadingAvatar(true);
    try {
      const b64 = await fileToBase64(file);
      const res = await uploadAvatar(b64, file.type);
      if (res.ok && res.url) setAvatarPreview(res.url);
      else setError(res.error || "Ошибка загрузки аватара");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setBannerPreview(preview);
    setUploadingBanner(true);
    try {
      const b64 = await fileToBase64(file);
      const res = await uploadBanner(b64, file.type);
      if (res.ok && res.url) setBannerPreview(res.url);
      else setError(res.error || "Ошибка загрузки баннера");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Введите имя"); return; }
    setSaving(true);
    setError("");
    const res = await updateProfile(name.trim(), bio.trim());
    setSaving(false);
    if (!res.ok) { setError(res.error || "Ошибка сохранения"); return; }
    onSave({
      name: name.trim(),
      bio: bio.trim(),
      avatar: res.avatar || profile.avatar,
      avatarUrl: avatarPreview,
      bannerUrl: bannerPreview,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-in"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>

        {/* Шапка */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <Icon name="X" size={18} />
          </button>
          <span className="text-sm font-semibold">Редактировать профиль</span>
          <button onClick={handleSave} disabled={saving || uploadingAvatar || uploadingBanner}
            className="text-sm font-semibold px-4 py-1.5 rounded-full transition-all disabled:opacity-50"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
            {saving ? "..." : "Сохранить"}
          </button>
        </div>

        {/* Баннер */}
        <div className="relative h-28 cursor-pointer group" onClick={() => bannerRef.current?.click()}
          style={{ background: bannerPreview ? undefined : "hsl(var(--secondary))" }}>
          {bannerPreview
            ? <img src={bannerPreview} alt="banner" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Icon name="Image" size={24} />
              </div>
          }
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {uploadingBanner
              ? <Icon name="Loader2" size={20} color="white" className="animate-spin" />
              : <><Icon name="Camera" size={20} color="white" /><span className="text-white text-sm">Изменить баннер</span></>
            }
          </div>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
        </div>

        {/* Аватар поверх баннера */}
        <div className="px-4 -mt-8 mb-3 flex items-end">
          <div className="relative cursor-pointer group" onClick={() => avatarRef.current?.click()}>
            <div className="w-16 h-16 rounded-full overflow-hidden border-4"
              style={{ borderColor: "hsl(var(--card))" }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                : <Avatar initials={profile.avatar} size="lg" accent />
              }
            </div>
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingAvatar
                ? <Icon name="Loader2" size={14} color="white" className="animate-spin" />
                : <Icon name="Camera" size={14} color="white" />
              }
            </div>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </div>

        {/* Поля */}
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Имя</label>
            <input
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{name.length}/100</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">О себе</label>
            <textarea
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 transition-colors resize-none"
              placeholder="Расскажите о себе..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{bio.length}/300</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
              style={{ background: "hsla(0,72%,58%,0.12)", color: "hsl(0,72%,68%)" }}>
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
