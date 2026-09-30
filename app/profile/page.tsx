"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/app-shell";
import { createClient } from "../../lib/supabase/client";

type Profile = {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  avatar_url: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [lastLogin, setLastLogin] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();

    if (!supabase) {
      setError(
        "Supabase is not configured. Please check the environment variables."
      );
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Unable to identify the logged-in user.");
      setLoading(false);
      return;
    }

    setLastLogin(user.last_sign_in_at || null);

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, email, mobile, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    if (data) {
      const profileData = data as Profile;

      setProfile(profileData);
      setName(profileData.name || "");
      setEmail(profileData.email || user.email || "");
      setMobile(profileData.mobile || "");
      setAvatarUrl(profileData.avatar_url || "");
    } else {
      setName(user.user_metadata?.name || "");
      setEmail(user.email || "");
    }

    setLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    setError("");
    setMessage("");

    const supabase = createClient();

    if (!supabase) {
      setError("Supabase is not configured.");
      setSaving(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("You must be logged in to update your profile.");
      setSaving(false);
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMobile = mobile.trim();

    if (!cleanName) {
      setError("Please enter your full name.");
      setSaving(false);
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        name: cleanName,
        email: cleanEmail,
        mobile: cleanMobile,
      })
      .eq("id", user.id);

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    if (cleanEmail !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: cleanEmail,
      });

      if (emailError) {
        setError(emailError.message);
        setSaving(false);
        return;
      }

      setMessage(
        "Profile saved. Supabase may ask you to confirm the new email address."
      );
    } else {
      setMessage("Profile updated successfully.");
    }

    setProfile((current) =>
      current
        ? {
            ...current,
            name: cleanName,
            email: cleanEmail,
            mobile: cleanMobile,
          }
        : current
    );

    setSaving(false);
  }

  async function uploadAvatar() {
    if (!avatarFile) {
      setError("Please choose an image first.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    const supabase = createClient();

    if (!supabase) {
      setError("Supabase is not configured.");
      setUploading(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("You must be logged in to upload a profile picture.");
      setUploading(false);
      return;
    }

    if (!avatarFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      setUploading(false);
      return;
    }

    if (avatarFile.size > 5 * 1024 * 1024) {
      setError("Profile picture must be smaller than 5 MB.");
      setUploading(false);
      return;
    }

    const extension =
      avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";

    const filePath = `${user.id}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: signedData, error: signedError } =
      await supabase.storage
        .from("avatars")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    if (signedError || !signedData?.signedUrl) {
      setError(
        signedError?.message || "Unable to create avatar URL."
      );
      setUploading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: signedData.signedUrl,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setUploading(false);
      return;
    }

    setAvatarUrl(signedData.signedUrl);
    setAvatarFile(null);
    setMessage("Profile picture updated successfully.");

    setUploading(false);
  }

  async function changePassword() {
    setError("");
    setMessage("");

    if (!newPassword || !confirmPassword) {
      setError("Please enter the new password twice.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setChangingPassword(true);

    const supabase = createClient();

    if (!supabase) {
      setError("Supabase is not configured.");
      setChangingPassword(false);
      return;
    }

    const { error: passwordError } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    if (passwordError) {
      setError(passwordError.message);
      setChangingPassword(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setMessage("Password changed successfully.");

    setChangingPassword(false);
  }

  function getInitials(value: string) {
    if (!value) return "U";

    return value
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function formatLastLogin(value: string | null) {
    if (!value) return "Not available";

    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (loading) {
    return (
      <AppShell>
        <div className="app-page">
          <div className="empty-state">
            <h3>Loading profile...</h3>
            <p>Please wait while we load your account.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="app-page">
        <div className="page-header">
          <div>
            <p className="eyebrow">GLOBAL FINANCE</p>

            <h1>My Profile</h1>

            <p className="page-description">
              Your personal account information and security settings.
            </p>
          </div>
        </div>

        {error && (
          <div className="profile-message profile-error">
            {error}
          </div>
        )}

        {message && (
          <div className="profile-message profile-success">
            {message}
          </div>
        )}

        <div className="profile-layout">
          {/* PROFILE PICTURE */}
          <section className="profile-card">
            <div className="profile-card-header">
              <div>
                <h2>Profile Picture</h2>

                <p>
                  Upload a clear profile picture for your account.
                </p>
              </div>
            </div>

            <div className="profile-avatar-section">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="profile-avatar-image"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {getInitials(name)}
                </div>
              )}

              <div className="profile-avatar-controls">
                <label className="file-button">
                  Choose Image

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      setAvatarFile(
                        event.target.files?.[0] || null
                      );
                    }}
                    hidden
                  />
                </label>

                {avatarFile && (
                  <span className="selected-file">
                    {avatarFile.name}
                  </span>
                )}

                <button
                  type="button"
                  className="primary-button"
                  onClick={uploadAvatar}
                  disabled={!avatarFile || uploading}
                >
                  {uploading
                    ? "Uploading..."
                    : "Upload Picture"}
                </button>
              </div>
            </div>
          </section>

          {/* PERSONAL INFORMATION */}
          <section className="profile-card">
            <div className="profile-card-header">
              <div>
                <h2>Personal Information</h2>

                <p>
                  Update the information connected to your account.
                </p>
              </div>
            </div>

            <div className="profile-form">
              <label>
                Full Name

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter your full name"
                />
              </label>

              <label>
                Email Address

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email"
                />
              </label>

              <label>
                Mobile Number

                <input
                  type="tel"
                  value={mobile}
                  onChange={(event) =>
                    setMobile(event.target.value)
                  }
                  placeholder="+91..."
                />
              </label>

              <button
                type="button"
                className="primary-button"
                onClick={saveProfile}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </section>

          {/* SECURITY */}
          <section className="profile-card">
            <div className="profile-card-header">
              <div>
                <h2>Security</h2>

                <p>
                  Change your password to keep your account secure.
                </p>
              </div>
            </div>

            <div className="profile-form">
              <label>
                New Password

                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(event.target.value)
                  }
                  placeholder="Minimum 8 characters"
                />
              </label>

              <label>
                Confirm New Password

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Enter password again"
                />
              </label>

              <button
                type="button"
                className="primary-button"
                onClick={changePassword}
                disabled={changingPassword}
              >
                {changingPassword
                  ? "Changing Password..."
                  : "Change Password"}
              </button>
            </div>
          </section>

          {/* ACCOUNT ACTIVITY */}
          <section className="profile-card">
            <div className="profile-card-header">
              <div>
                <h2>Account Activity</h2>

                <p>
                  Information about your latest authenticated
                  session.
                </p>
              </div>
            </div>

            <div className="account-activity">
              <div>
                <span>Account Name</span>
                <strong>{name || "Not available"}</strong>
              </div>

              <div>
                <span>Account Email</span>
                <strong>{email || "Not available"}</strong>
              </div>

              <div>
                <span>Last Login</span>
                <strong>
                  {formatLastLogin(lastLogin)}
                </strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
