"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRef, useState } from "react";
import { Input, Label } from "@/components/ui/field";
import { canOptimizeImage } from "@/lib/images";

type Profile = {
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
};

export function ProfileSettings({ initial }: { initial: Profile }) {
  const router = useRouter();
  const { update } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initial.name ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [image, setImage] = useState(initial.image);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [clearImage, setClearImage] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  function onPickFile(next: File | null) {
    setFile(next);
    setClearImage(false);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next) : null);
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setProfileError(null);
    setProfileMsg(null);
    setSavingProfile(true);

    try {
      const form = new FormData();
      form.set("name", name);
      form.set("phone", phone);
      if (clearImage) form.set("clearImage", "1");
      if (file) form.set("image", file);

      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Could not update profile");
      }

      setImage(data.image ?? null);
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";

      await update({
        user: {
          name: data.name,
          image: data.image,
        },
      });
      setProfileMsg("Profile saved.");
      router.refresh();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMsg(null);
    setSavingPassword(true);

    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Could not change password");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg("Password updated.");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Could not change password",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  const displayImage = preview ?? (!clearImage ? image : null);

  return (
    <div className="mt-10 space-y-8">
      <section className="rounded-petal border border-stone bg-white p-5 sm:p-6">
        <h2 className="font-display text-2xl text-ink">Profile settings</h2>
        <p className="mt-1 text-sm text-ink/60">
          Update your name, phone, and profile photo.
        </p>

        <form onSubmit={saveProfile} className="mt-6 space-y-5" noValidate>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-stone/40">
              {displayImage ? (
                <Image
                  src={displayImage}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized={!canOptimizeImage(displayImage)}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-ink/40">
                  Photo
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="block w-full text-sm text-ink/70 file:mr-3 file:rounded-lg file:border-0 file:bg-burgundy file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ivory hover:file:bg-burgundy-deep"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              {(image || preview) && !clearImage && (
                <button
                  type="button"
                  className="text-sm text-burgundy hover:underline"
                  onClick={() => {
                    onPickFile(null);
                    setClearImage(true);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              value={initial.email}
              disabled
              className="bg-stone/20 text-ink/60"
            />
          </div>

          <div>
            <Label htmlFor="profile-name" required>
              Name
            </Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div>
            <Label htmlFor="profile-phone">Phone</Label>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="03XX XXXXXXX"
            />
          </div>

          {profileError && (
            <p role="alert" className="text-sm text-burgundy">
              {profileError}
            </p>
          )}
          {profileMsg && (
            <p className="text-sm text-sage" role="status">
              {profileMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-lg bg-burgundy px-4 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-burgundy-deep disabled:opacity-60"
          >
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      <section className="rounded-petal border border-stone bg-white p-5 sm:p-6">
        <h2 className="font-display text-2xl text-ink">Change password</h2>
        <p className="mt-1 text-sm text-ink/60">
          Use a strong password you don&apos;t reuse elsewhere.
        </p>

        <form onSubmit={savePassword} className="mt-6 space-y-5" noValidate>
          <div>
            <Label htmlFor="current-password" required>
              Current password
            </Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="new-password" required>
              New password
            </Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div>
            <Label htmlFor="confirm-password" required>
              Confirm new password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {passwordError && (
            <p role="alert" className="text-sm text-burgundy">
              {passwordError}
            </p>
          )}
          {passwordMsg && (
            <p className="text-sm text-sage" role="status">
              {passwordMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-lg bg-burgundy px-4 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-burgundy-deep disabled:opacity-60"
          >
            {savingPassword ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
