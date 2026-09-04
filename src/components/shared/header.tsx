"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Menu,
  X,
  Bell,
  Search,
  User,
  Workflow,
  CheckSquare,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface SearchResults {
  workflows: {
    id: string;
    title: string;
    description: string;
    stage: string;
    team: string;
    priority: string;
  }[];
  tasks: {
    id: string;
    title: string;
    completed: boolean;
    workflowId: string;
    workflow: { title: string };
  }[];
  comments: {
    id: string;
    body: string;
    workflowId: string;
    workflow: { title: string };
  }[];
}

interface SearchMenuItem {
  id: string;
  href: string;
}

// ── Colors ──────────────────────────────────────────────────────────────
// Primary    : #29d3aa (Emerald Green)
// Secondary  : #7c6cff (Purple)
// Dark BG    : #0f1117
// Surface    : rgba(255,255,255,0.04)
// Border     : rgba(255,255,255,0.08)
// Text       : #f3f7f6
// Muted      : #9baaa6

const STAGE_COLORS: Record<string, string> = {
  TODO: "bg-white/10 text-[#9baaa6]",
  IN_PROGRESS: "bg-[#29d3aa]/20 text-[#29d3aa]",
  REVIEW: "bg-[#fcc419]/20 text-[#fcc419]",
  DONE: "bg-[#7c6cff]/20 text-[#7c6cff]",
  BLOCKED: "bg-[#ff6b6b]/20 text-[#ff6b6b]",
};

const STAGE_LABELS: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done",
  BLOCKED: "Blocked",
};

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#29d3aa]/20 text-white rounded px-0.5 not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const userName = session?.user?.name || "Team Member";
  const userEmail = session?.user?.email || "";
  const userInitial = userName?.charAt(0).toUpperCase() || "T";

  // ── Notifications ──────────────────────────────────────────────────────
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.filter((n: { read: boolean }) => !n.read).length);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchUnread();
    const iv = setInterval(fetchUnread, 30000);
    return () => clearInterval(iv);
  }, []);

  // ── Search ─────────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSearch = () => {
    setQuery("");
    setResults(null);
    setShowDrop(false);
    setActiveSearchIndex(-1);
  };

  const closeSearch = () => {
    setShowDrop(false);
    setActiveSearchIndex(-1);
  };

  const navigate = (href: string) => {
    clearSearch();
    router.push(href);
  };

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setShowDrop(false);
      setActiveSearchIndex(-1);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error();
      const data: SearchResults = await res.json();
      const resultCount =
        data.workflows.length + data.tasks.length + data.comments.length;
      setResults(data);
      setShowDrop(true);
      setActiveSearchIndex(resultCount > 0 ? 0 : -1);
    } catch {
      setResults(null);
      setActiveSearchIndex(-1);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    setActiveSearchIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(v), 300);
  };

  const totalResults = results
    ? results.workflows.length + results.tasks.length + results.comments.length
    : 0;

  const searchItems: SearchMenuItem[] = results
    ? [
        ...results.workflows.map((w) => ({
          id: `search-workflow-${w.id}`,
          href: `/workflows/${w.id}`,
        })),
        ...results.tasks.map((t) => ({
          id: `search-task-${t.id}`,
          href: `/workflows/${t.workflowId}`,
        })),
        ...results.comments.map((c) => ({
          id: `search-comment-${c.id}`,
          href: `/workflows/${c.workflowId}`,
        })),
      ]
    : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      closeSearch();
      return;
    }

    if (e.key === "ArrowDown") {
      if (searchItems.length === 0) return;
      e.preventDefault();
      if (!showDrop) setShowDrop(true);
      setActiveSearchIndex((current) =>
        current < searchItems.length - 1 ? current + 1 : 0,
      );
      return;
    }

    if (e.key === "ArrowUp") {
      if (searchItems.length === 0) return;
      e.preventDefault();
      if (!showDrop) setShowDrop(true);
      setActiveSearchIndex((current) =>
        current > 0 ? current - 1 : searchItems.length - 1,
      );
      return;
    }

    if (e.key === "Enter" && showDrop && activeSearchIndex >= 0) {
      const item = searchItems[activeSearchIndex];
      if (!item) return;
      e.preventDefault();
      navigate(item.href);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        closeSearch();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  let renderedSearchIndex = -1;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-white/5 bg-[#0f1117]/80 backdrop-blur-xl px-4 md:px-6">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0 text-white/50 hover:text-white hover:bg-white/5 rounded-full"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Logo */}
      <Link
        href="/dashboard"
        className="hidden lg:flex items-center gap-2 shrink-0"
        aria-label="Go to FlowOS home"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#29d3aa] to-[#14a882] text-white font-bold text-sm">
          F
        </div>
        <span className="font-semibold text-lg text-white">
          Flow<span className="text-[#29d3aa]">OS</span>
        </span>
      </Link>

      {/* Search */}
      <div className="flex-1 flex items-center justify-center px-2 md:px-4">
        <div className="relative w-full max-w-md" ref={wrapperRef}>
          {searching ? (
            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#29d3aa] animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          )}
          <Input
            placeholder="Search workflows, tasks, or teams..."
            className="w-full pl-10 pr-8 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#29d3aa]/50 rounded-full"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            role="combobox"
            aria-expanded={showDrop}
            aria-controls="global-search-results"
            aria-activedescendant={
              activeSearchIndex >= 0
                ? searchItems[activeSearchIndex]?.id
                : undefined
            }
            onFocus={() => {
              if (query.length >= 2 && results && totalResults > 0)
                setShowDrop(true);
            }}
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Dropdown */}
          {showDrop && results && (
            <div
              id="global-search-results"
              role="listbox"
              className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[420px] overflow-y-auto backdrop-blur-xl"
            >
              {totalResults === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[#9baaa6]">
                  No results for{" "}
                  <span className="font-medium text-white">"{query}"</span>
                </div>
              ) : (
                <>
                  {/* Workflows */}
                  {results.workflows.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center gap-1.5">
                        <Workflow className="w-3 h-3 text-[#29d3aa]" />
                        <span className="text-xs font-semibold text-[#9baaa6] uppercase tracking-wide">
                          Workflows
                        </span>
                      </div>
                      {results.workflows.map((w) => {
                        const itemIndex = ++renderedSearchIndex;
                        const isActive = activeSearchIndex === itemIndex;

                        return (
                          <button
                            key={w.id}
                            id={`search-workflow-${w.id}`}
                            role="option"
                            aria-selected={isActive}
                            tabIndex={-1}
                            onMouseEnter={() => setActiveSearchIndex(itemIndex)}
                            onClick={() => navigate(`/workflows/${w.id}`)}
                            className={`w-full text-left px-4 py-3 transition-colors border-b border-white/5 flex items-center gap-3 ${
                              isActive ? "bg-white/10" : "hover:bg-white/5"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                <Highlight text={w.title} query={query} />
                              </p>
                              <p className="text-xs text-[#9baaa6] mt-0.5">
                                {w.team}
                              </p>
                            </div>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STAGE_COLORS[w.stage] ?? "bg-white/10 text-[#9baaa6]"}`}
                            >
                              {STAGE_LABELS[w.stage] ?? w.stage}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Tasks */}
                  {results.tasks.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-white/5 border-b border-t border-white/5 flex items-center gap-1.5">
                        <CheckSquare className="w-3 h-3 text-[#29d3aa]" />
                        <span className="text-xs font-semibold text-[#9baaa6] uppercase tracking-wide">
                          Tasks
                        </span>
                      </div>
                      {results.tasks.map((t) => {
                        const itemIndex = ++renderedSearchIndex;
                        const isActive = activeSearchIndex === itemIndex;

                        return (
                          <button
                            key={t.id}
                            id={`search-task-${t.id}`}
                            role="option"
                            aria-selected={isActive}
                            tabIndex={-1}
                            onMouseEnter={() => setActiveSearchIndex(itemIndex)}
                            onClick={() => navigate(`/workflows/${t.workflowId}`)}
                            className={`w-full text-left px-4 py-3 transition-colors border-b border-white/5 flex items-center gap-3 ${
                              isActive ? "bg-white/10" : "hover:bg-white/5"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${t.completed ? "line-through text-[#9baaa6]" : "text-white"}`}
                              >
                                <Highlight text={t.title} query={query} />
                              </p>
                              <p className="text-xs text-[#9baaa6] mt-0.5">
                                in {t.workflow.title}
                              </p>
                            </div>
                            {t.completed && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#29d3aa]/20 text-[#29d3aa] shrink-0">
                                Done
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Comments */}
                  {results.comments.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-white/5 border-b border-t border-white/5 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-[#29d3aa]" />
                        <span className="text-xs font-semibold text-[#9baaa6] uppercase tracking-wide">
                          Comments
                        </span>
                      </div>
                      {results.comments.map((c) => {
                        const itemIndex = ++renderedSearchIndex;
                        const isActive = activeSearchIndex === itemIndex;

                        return (
                          <button
                            key={c.id}
                            id={`search-comment-${c.id}`}
                            role="option"
                            aria-selected={isActive}
                            tabIndex={-1}
                            onMouseEnter={() => setActiveSearchIndex(itemIndex)}
                            onClick={() => navigate(`/workflows/${c.workflowId}`)}
                            className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 ${
                              isActive ? "bg-white/10" : "hover:bg-white/5"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">
                                <Highlight text={c.body} query={query} />
                              </p>
                              <p className="text-xs text-[#9baaa6] mt-0.5">
                                in {c.workflow.title}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-4 py-2.5 bg-white/5 border-t border-white/5">
                    <button
                      onClick={() =>
                        navigate(
                          `/workflows?search=${encodeURIComponent(query)}`,
                        )
                      }
                      className="text-xs text-[#29d3aa] hover:text-[#14a882] font-medium transition-colors"
                    >
                      See all results for "{query}" →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Theme Toggle */}
        <ThemeToggle />

        <Link href="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-white/50 hover:text-white hover:bg-white/5 rounded-full"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#29d3aa] text-xs text-white font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full hover:bg-white/5 p-0"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-r from-[#29d3aa] to-[#7c6cff] text-white font-semibold text-sm">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-[#1a1a2e] border border-white/10 backdrop-blur-xl text-white min-w-[200px]"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-white font-semibold">{userName}</span>
                <span className="text-xs text-[#9baaa6]">{userEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="text-[#9baaa6] hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white cursor-pointer"
            >
              <User className="h-4 w-4 text-[#29d3aa]" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="text-[#9baaa6] hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white cursor-pointer"
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/team")}
              className="text-[#9baaa6] hover:text-white hover:bg-white/5 focus:bg-white/5 focus:text-white cursor-pointer"
            >
              Team
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-[#ff6b6b] hover:text-white hover:bg-[#ff6b6b]/10 focus:bg-[#ff6b6b]/10 focus:text-white cursor-pointer"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
