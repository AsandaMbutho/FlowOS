"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Users,
  Bell,
  Plug,
  Camera,
  Check,
  Trash2,
  Mail,
  MessageSquare,
  Monitor,
  AlertCircle,
  Shield,
  Clock,
  Globe,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DbUser {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "MANAGER" | "USER";
  avatar: string | null;
}

interface ProfileForm {
  name: string;
  email: string;
}

interface TeamForm {
  teamName: string;
  timezone: string;
  language: string;
  fiscalYear: string;
}

interface NotifSettings {
  emailWorkflow: boolean;
  emailMentions: boolean;
  emailWeeklyDigest: boolean;
  slackWorkflow: boolean;
  slackMentions: boolean;
  desktopAll: boolean;
  desktopUrgent: boolean;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  icon: string;
}

interface ToastState {
  message: string;
  type: "success" | "error";
}

// ─── Static initial values ─────────────────────────────────────────────────────

const INIT_TEAM: TeamForm = {
  teamName: "Media on Africa",
  timezone: "Africa/Johannesburg",
  language: "English",
  fiscalYear: "January",
};

const INIT_NOTIFS: NotifSettings = {
  emailWorkflow: true,
  emailMentions: true,
  emailWeeklyDigest: false,
  slackWorkflow: false,
  slackMentions: true,
  desktopAll: true,
  desktopUrgent: true,
};

const INIT_INTEGRATIONS: Integration[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Send workflow updates to Slack channels",
    connected: false,
    icon: "💬",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Link pull requests to workflow tasks",
    connected: true,
    icon: "🐙",
  },
  {
    id: "jira",
    name: "Jira",
    description: "Sync issues with Jira tickets",
    connected: false,
    icon: "🔷",
  },
  {
    id: "gdrive",
    name: "Google Drive",
    description: "Attach Drive files to workflow tasks",
    connected: true,
    icon: "📁",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Sync docs and wikis with workflows",
    connected: false,
    icon: "📝",
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Automate workflows with 5,000+ apps",
    connected: false,
    icon: "⚡",
  },
];

const TIMEZONES = [
  "Africa/Johannesburg",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
];
const LANGUAGES = [
  "English",
  "Afrikaans",
  "Zulu",
  "French",
  "Spanish",
  "German",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const ROLE_LABELS: Record<DbUser["role"], string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager / Supervisor",
  USER: "Team Member",
};

// ─── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
      >
        {toast.type === "success" ? (
          <Check className="w-3 h-3" />
        ) : (
          <X className="w-3 h-3" />
        )}
      </div>
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={onClose} className="text-white/50 hover:text-white ml-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-6 border-b border-border last:border-0 last:pb-0">
      <div className="mb-4">
        <h4 className="font-semibold text-foreground">{title}</h4>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  iconColor: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ─── Avatar initials ───────────────────────────────────────────────────────────

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0"
      style={{
        background: "linear-gradient(135deg, #0f1f3d 0%, #10b981 100%)",
      }}
    >
      {initials}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  // ── DB user state ────────────────────────────────────────────────────────
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // ── Profile form ─────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileForm>({ name: "", email: "" });
  const [savedProfile, setSavedProfile] = useState<ProfileForm>({
    name: "",
    email: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Team form ────────────────────────────────────────────────────────────
  const [team, setTeam] = useState<TeamForm>(INIT_TEAM);
  const [savedTeam, setSavedTeam] = useState<TeamForm>(INIT_TEAM);

  // ── Notification preferences ─────────────────────────────────────────────
  const [notifs, setNotifs] = useState<NotifSettings>(INIT_NOTIFS);

  // ── Integrations ─────────────────────────────────────────────────────────
  const [integrations, setIntegrations] =
    useState<Integration[]>(INIT_INTEGRATIONS);

  // ── Password form ────────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
    },
    [],
  );

  const profileDirty = JSON.stringify(profile) !== JSON.stringify(savedProfile);
  const teamDirty = JSON.stringify(team) !== JSON.stringify(savedTeam);

  // ── Load real user from DB on mount ───────────────────────────────────────
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/users/me");
        if (!res.ok) throw new Error("Failed to fetch user");
        const user: DbUser = await res.json();
        setDbUser(user);
        const p = { name: user.name ?? "", email: user.email };
        setProfile(p);
        setSavedProfile(p);
      } catch {
        showToast("Could not load your profile from the database", "error");
      } finally {
        setLoadingUser(false);
      }
    }
    fetchUser();
  }, [showToast]);

  // ── Save profile to DB ────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!dbUser) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/users/${dbUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, email: profile.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Failed to save profile", "error");
        return;
      }
      // Update local state to reflect DB truth
      setDbUser((prev) =>
        prev ? { ...prev, name: data.name, email: data.email } : prev,
      );
      setSavedProfile({ name: data.name ?? "", email: data.email });
      setProfile({ name: data.name ?? "", email: data.email });
      showToast("Profile saved successfully");
    } catch {
      showToast("Network error — could not save profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Save team settings (local only for now — no Team model in schema) ─────
  const handleSaveTeam = () => {
    setSavedTeam(team);
    showToast("Team settings updated");
  };

  // ── Save notification preferences (local — extend schema to persist) ──────
  const handleSaveNotifs = () => {
    showToast("Notification preferences saved");
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!dbUser) return;
    setPasswordError("");

    if (!passwordForm.current) {
      setPasswordError("Current password is required");
      return;
    }
    if (passwordForm.next.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError("Passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(`/api/users/${dbUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.next,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error ?? "Failed to update password");
        return;
      }
      setPasswordForm({ current: "", next: "", confirm: "" });
      showToast("Password changed successfully");
    } catch {
      setPasswordError("Network error — could not update password");
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Toggle integration ────────────────────────────────────────────────────
  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const next = { ...i, connected: !i.connected };
        showToast(
          next.connected ? `${i.name} connected` : `${i.name} disconnected`,
        );
        return next;
      }),
    );
  };

  const setNotif = (key: keyof NotifSettings) => (val: boolean) =>
    setNotifs((n) => ({ ...n, [key]: val }));

  const connectedCount = integrations.filter((i) => i.connected).length;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account, team, and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-1.5 text-xs"
          >
            <User className="w-3.5 h-3.5" /> Profile
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="flex items-center gap-1.5 text-xs"
          >
            <Users className="w-3.5 h-3.5" /> Team
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-1.5 text-xs"
          >
            <Bell className="w-3.5 h-3.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="flex items-center gap-1.5 text-xs"
          >
            <Plug className="w-3.5 h-3.5" /> Integrations
            {connectedCount > 0 && (
              <span className="ml-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {connectedCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="flex items-center gap-1.5 text-xs"
          >
            <Shield className="w-3.5 h-3.5" /> Security
          </TabsTrigger>
        </TabsList>

        {/* ── Profile tab ────────────────────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="p-6 space-y-6">
            {loadingUser ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading your profile…</span>
              </div>
            ) : (
              <>
                {/* Avatar */}
                <Section
                  title="Avatar"
                  description="Your profile picture across FlowOS"
                >
                  <div className="flex items-center gap-4">
                    <AvatarInitials
                      name={profile.name || dbUser?.email || "?"}
                    />
                    <div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Camera className="w-4 h-4" /> Upload photo
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG or GIF · Max 2MB
                      </p>
                    </div>
                  </div>
                </Section>

                {/* Role badge — read from DB */}
                <Section title="Account Role">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                        dbUser?.role === "MANAGER"
                          ? "bg-amber-100 text-amber-700"
                          : dbUser?.role === "ADMIN"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      {ROLE_LABELS[dbUser?.role ?? "USER"]}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Contact your admin to change your role
                    </p>
                  </div>
                </Section>

                {/* Personal info */}
                <Section title="Personal Information">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="name"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, name: e.target.value }))
                        }
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="email"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, email: e.target.value }))
                        }
                        placeholder="your@mediaonafrica.co.za"
                      />
                    </div>
                  </div>

                  {/* Note about phone/bio — not in schema yet */}
                  <div className="mt-4 p-3 bg-muted/50 border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Phone and bio fields require a schema migration to
                      persist. Run{" "}
                      <code className="bg-muted px-1 py-0.5 rounded font-mono">
                        npx prisma migrate dev
                      </code>{" "}
                      after adding{" "}
                      <code className="bg-muted px-1 py-0.5 rounded font-mono">
                        phone
                      </code>{" "}
                      and{" "}
                      <code className="bg-muted px-1 py-0.5 rounded font-mono">
                        bio
                      </code>{" "}
                      to the User model.
                    </p>
                  </div>
                </Section>

                {/* Save / discard */}
                <div className="flex items-center justify-between pt-2">
                  {profileDirty && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Unsaved changes
                    </p>
                  )}
                  <div className="ml-auto flex gap-3">
                    {profileDirty && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setProfile(savedProfile)}
                        disabled={savingProfile}
                      >
                        Discard
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={!profileDirty || savingProfile}
                      className="min-w-[120px]"
                      style={{ backgroundColor: "#0f1f3d", color: "#fff" }}
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                          Saving…
                        </>
                      ) : profileDirty ? (
                        "Save Changes"
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" /> Saved
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        {/* ── Team tab ───────────────────────────────────────────────────── */}
        <TabsContent value="team" className="space-y-4">
          <Card className="p-6 space-y-6">
            <Section
              title="Organisation Details"
              description="Settings that apply to your entire team"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Team Name
                  </Label>
                  <Input
                    value={team.teamName}
                    onChange={(e) =>
                      setTeam((t) => ({ ...t, teamName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Fiscal Year Start
                  </Label>
                  <select
                    value={team.fiscalYear}
                    onChange={(e) =>
                      setTeam((t) => ({ ...t, fiscalYear: e.target.value }))
                    }
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" /> Timezone
                  </Label>
                  <select
                    value={team.timezone}
                    onChange={(e) =>
                      setTeam((t) => ({ ...t, timezone: e.target.value }))
                    }
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Language
                  </Label>
                  <select
                    value={team.language}
                    onChange={(e) =>
                      setTeam((t) => ({ ...t, language: e.target.value }))
                    }
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Section>

            <Section
              title="Team Members"
              description="Members currently on your team"
            >
              {[
                {
                  name: "Themba",
                  role: "MANAGER",
                  email: "themba@mediaonafrica.co.za",
                  color: "from-blue-500 to-cyan-500",
                },
                {
                  name: "Asanda",
                  role: "ADMIN",
                  email: "asanda@mediaonafrica.co.za",
                  color: "from-purple-500 to-pink-500",
                },
                {
                  name: "Sizwe",
                  role: "USER",
                  email: "sizwe@mediaonafrica.co.za",
                  color: "from-green-500 to-teal-500",
                },
                {
                  name: "Shravan",
                  role: "USER",
                  email: "shravan@mediaonafrica.co.za",
                  color: "from-orange-500 to-red-500",
                },
              ].map((member) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full bg-gradient-to-r ${member.color} flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      member.role === "MANAGER"
                        ? "bg-amber-100 text-amber-700"
                        : member.role === "ADMIN"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {ROLE_LABELS[member.role as DbUser["role"]]}
                  </span>
                </div>
              ))}
            </Section>

            <div className="flex justify-end gap-3 pt-2">
              {teamDirty && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTeam(savedTeam)}
                >
                  Discard
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSaveTeam}
                disabled={!teamDirty}
                style={
                  teamDirty ? { backgroundColor: "#0f1f3d", color: "#fff" } : {}
                }
              >
                {teamDirty ? (
                  "Save Changes"
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" /> Saved
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ── Notifications tab ──────────────────────────────────────────── */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-6 space-y-6">
            <Section
              title="Email Notifications"
              description="Choose what updates arrive in your inbox"
            >
              <div className="divide-y divide-border">
                <ToggleRow
                  icon={Mail}
                  iconColor="bg-blue-100 text-blue-600"
                  label="Workflow updates"
                  description="When a workflow you own changes status"
                  checked={notifs.emailWorkflow}
                  onChange={setNotif("emailWorkflow")}
                />
                <ToggleRow
                  icon={AlertCircle}
                  iconColor="bg-purple-100 text-purple-600"
                  label="Mentions"
                  description="When someone @mentions you in a comment"
                  checked={notifs.emailMentions}
                  onChange={setNotif("emailMentions")}
                />
                <ToggleRow
                  icon={Clock}
                  iconColor="bg-green-100 text-green-600"
                  label="Weekly digest"
                  description="A summary of your team's activity every Monday"
                  checked={notifs.emailWeeklyDigest}
                  onChange={setNotif("emailWeeklyDigest")}
                />
              </div>
            </Section>
            <Section
              title="Slack Notifications"
              description="Push updates to your connected Slack workspace"
            >
              <div className="divide-y divide-border">
                <ToggleRow
                  icon={MessageSquare}
                  iconColor="bg-yellow-100 text-yellow-600"
                  label="Workflow updates"
                  description="Post to Slack when workflows change status"
                  checked={notifs.slackWorkflow}
                  onChange={setNotif("slackWorkflow")}
                />
                <ToggleRow
                  icon={MessageSquare}
                  iconColor="bg-yellow-100 text-yellow-600"
                  label="Mentions"
                  description="Notify in Slack when you're mentioned"
                  checked={notifs.slackMentions}
                  onChange={setNotif("slackMentions")}
                />
              </div>
            </Section>
            <Section
              title="Desktop Notifications"
              description="Browser push notifications"
            >
              <div className="divide-y divide-border">
                <ToggleRow
                  icon={Monitor}
                  iconColor="bg-muted text-muted-foreground"
                  label="All notifications"
                  description="Show a notification for every update"
                  checked={notifs.desktopAll}
                  onChange={setNotif("desktopAll")}
                />
                <ToggleRow
                  icon={AlertCircle}
                  iconColor="bg-red-100 text-red-500"
                  label="Urgent only"
                  description="Only show blocked or overdue alerts"
                  checked={notifs.desktopUrgent}
                  onChange={setNotif("desktopUrgent")}
                />
              </div>
            </Section>
            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                onClick={handleSaveNotifs}
                style={{ backgroundColor: "#0f1f3d", color: "#fff" }}
              >
                Save Preferences
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ── Integrations tab ───────────────────────────────────────────── */}
        <TabsContent value="integrations" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold">Connected Apps</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {connectedCount} of {integrations.length} connected
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className={`flex items-center justify-between p-4 border rounded-xl transition-colors ${
                    integration.connected
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                      : "bg-card border-border hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-xl shadow-sm">
                      {integration.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">
                          {integration.name}
                        </p>
                        {integration.connected && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Connected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={integration.connected ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleIntegration(integration.id)}
                    className={
                      integration.connected
                        ? "border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                        : "text-white"
                    }
                    style={
                      !integration.connected
                        ? { backgroundColor: "#0f1f3d" }
                        : {}
                    }
                  >
                    {integration.connected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* ── Security tab ───────────────────────────────────────────────── */}
        <TabsContent value="security" className="space-y-4">
          <Card className="p-6 space-y-6">
            <Section
              title="Change Password"
              description="Use a strong password of at least 8 characters"
            >
              <div className="space-y-3 max-w-md">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Current Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.current}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        current: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    New Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.next}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, next: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Confirm New Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.confirm}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        confirm: e.target.value,
                      }))
                    }
                  />
                </div>
                {/* Strength indicator */}
                {passwordForm.next.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i <=
                            (passwordForm.next.length >= 12
                              ? 4
                              : passwordForm.next.length >= 10
                                ? 3
                                : passwordForm.next.length >= 8
                                  ? 2
                                  : 1)
                              ? passwordForm.next.length >= 12
                                ? "bg-emerald-500"
                                : passwordForm.next.length >= 10
                                  ? "bg-amber-400"
                                  : "bg-red-400"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {passwordForm.next.length < 8
                        ? "Too short"
                        : passwordForm.next.length < 10
                          ? "Weak"
                          : passwordForm.next.length < 12
                            ? "Good"
                            : "Strong"}
                    </p>
                  </div>
                )}
                {passwordError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {passwordError}
                  </p>
                )}
                <Button
                  size="sm"
                  onClick={handleChangePassword}
                  disabled={savingPassword}
                  style={{ backgroundColor: "#0f1f3d", color: "#fff" }}
                  className="mt-1"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Updating…
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </Section>

            <Section
              title="Two-Factor Authentication"
              description="Add an extra layer of security to your account"
            >
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Authenticator App</p>
                    <p className="text-xs text-muted-foreground">
                      Use Google Authenticator or similar
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showToast("2FA setup coming soon")}
                >
                  Enable <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </Section>

            <Section
              title="Danger Zone"
              description="Irreversible actions — proceed with caution"
            >
              <div className="p-4 border border-red-200 rounded-xl bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      Delete Account
                    </p>
                    <p className="text-xs text-red-400 mt-0.5">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-100"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                  </Button>
                </div>
              </div>
            </Section>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-2xl shadow-2xl z-50 p-6 w-full max-w-sm">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-center">Delete Account?</h3>
            <p className="text-sm text-muted-foreground text-center mt-1 mb-5">
              This will permanently delete your account, workflows, and all
              data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  showToast("Account deletion requested");
                }}
              >
                Delete Forever
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
