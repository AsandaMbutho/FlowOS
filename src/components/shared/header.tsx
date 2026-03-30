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

// ── Brand colours ──────────────────────────────────────────────────────────
// Primary Navy  : #0D1B4B
// Teal Accent   : #00C48C
// Dark Surface  : #0A1628
// Light BG      : #F4F4F5
// Body Text     : #4B5563
// ---------------------------------------------------------------------------

const STAGE_COLORS: Record<string, string> = {
  TODO: "bg-[#F4F4F5] text-[#4B5563]",
  IN_PROGRESS: "bg-[#d0f5ea] text-[#0D1B4B]",
  REVIEW: "bg-yellow-100 text-yellow-700",
  DONE: "bg-[#00C48C]/20 text-[#0D1B4B]",
  BLOCKED: "bg-red-100 text-red-700",
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
      <mark className="bg-[#00C48C]/20 text-[#0D1B4B] rounded px-0.5 not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const router = useRouter();

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
    const iv = setInterval(fetchUnread, 30_000);
    return () => clearInterval(iv);
  }, []);

  // ── Search ─────────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setShowDrop(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error();
      const data: SearchResults = await res.json();
      setResults(data);
      setShowDrop(true);
    } catch {
      setResults(null);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(v), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowDrop(false);
      setQuery("");
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const clearSearch = () => {
    setQuery("");
    setResults(null);
    setShowDrop(false);
  };
  const navigate = (href: string) => {
    clearSearch();
    router.push(href);
  };
  const totalResults = results
    ? results.workflows.length + results.tasks.length + results.comments.length
    : 0;

  return (
    // ── Header bar: white with navy bottom border ──────────────────────
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-[#0D1B4B]/10 bg-white px-4 md:px-6">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0 text-[#0D1B4B] hover:bg-[#0D1B4B]/5"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Logo — navy background, teal "M" initial vibe */}
      <div className="hidden lg:flex items-center gap-2 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0D1B4B] text-white font-bold text-sm">
          F
        </div>
        <span className="font-semibold text-lg text-[#0D1B4B]">FlowOS</span>
      </div>

      {/* Search */}
      <div className="flex-1 flex items-center justify-center px-2 md:px-4">
        <div className="relative w-full max-w-md" ref={wrapperRef}>
          {searching ? (
            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#00C48C] animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4B5563]" />
          )}
          <Input
            placeholder="Search workflows, tasks, or teams..."
            className="w-full pl-10 pr-8 border-[#0D1B4B]/20 focus-visible:ring-[#00C48C] focus-visible:border-[#00C48C]"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.length >= 2 && results && totalResults > 0)
                setShowDrop(true);
            }}
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#0D1B4B]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Dropdown */}
          {showDrop && results && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#0D1B4B]/10 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[420px] overflow-y-auto">
              {totalResults === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[#4B5563]">
                  No results for{" "}
                  <span className="font-medium text-[#0D1B4B]">"{query}"</span>
                </div>
              ) : (
                <>
                  {/* Workflows */}
                  {results.workflows.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-[#F4F4F5] border-b border-[#0D1B4B]/10 flex items-center gap-1.5">
                        <Workflow className="w-3 h-3 text-[#00C48C]" />
                        <span className="text-xs font-semibold text-[#0D1B4B] uppercase tracking-wide">
                          Workflows
                        </span>
                      </div>
                      {results.workflows.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => navigate(`/workflows/${w.id}`)}
                          className="w-full text-left px-4 py-3 hover:bg-[#00C48C]/5 transition-colors border-b border-[#0D1B4B]/5 flex items-center gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#0D1B4B] truncate">
                              <Highlight text={w.title} query={query} />
                            </p>
                            <p className="text-xs text-[#4B5563] mt-0.5">
                              {w.team}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STAGE_COLORS[w.stage] ?? "bg-[#F4F4F5] text-[#4B5563]"}`}
                          >
                            {STAGE_LABELS[w.stage] ?? w.stage}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tasks */}
                  {results.tasks.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-[#F4F4F5] border-b border-t border-[#0D1B4B]/10 flex items-center gap-1.5">
                        <CheckSquare className="w-3 h-3 text-[#00C48C]" />
                        <span className="text-xs font-semibold text-[#0D1B4B] uppercase tracking-wide">
                          Tasks
                        </span>
                      </div>
                      {results.tasks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => navigate(`/workflows/${t.workflowId}`)}
                          className="w-full text-left px-4 py-3 hover:bg-[#00C48C]/5 transition-colors border-b border-[#0D1B4B]/5 flex items-center gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${t.completed ? "line-through text-[#4B5563]" : "text-[#0D1B4B]"}`}
                            >
                              <Highlight text={t.title} query={query} />
                            </p>
                            <p className="text-xs text-[#4B5563] mt-0.5">
                              in {t.workflow.title}
                            </p>
                          </div>
                          {t.completed && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#00C48C]/20 text-[#0D1B4B] shrink-0">
                              Done
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Comments */}
                  {results.comments.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-[#F4F4F5] border-b border-t border-[#0D1B4B]/10 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-[#00C48C]" />
                        <span className="text-xs font-semibold text-[#0D1B4B] uppercase tracking-wide">
                          Comments
                        </span>
                      </div>
                      {results.comments.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => navigate(`/workflows/${c.workflowId}`)}
                          className="w-full text-left px-4 py-3 hover:bg-[#00C48C]/5 transition-colors flex items-start gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#0D1B4B] truncate">
                              <Highlight text={c.body} query={query} />
                            </p>
                            <p className="text-xs text-[#4B5563] mt-0.5">
                              in {c.workflow.title}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-4 py-2.5 bg-[#F4F4F5] border-t border-[#0D1B4B]/10">
                    <button
                      onClick={() =>
                        navigate(
                          `/workflows?search=${encodeURIComponent(query)}`,
                        )
                      }
                      className="text-xs text-[#00C48C] hover:text-[#0D1B4B] hover:underline font-medium transition-colors"
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
        <Link href="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-[#0D1B4B] hover:bg-[#0D1B4B]/5"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#00C48C] text-xs text-white font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full hover:bg-[#0D1B4B]/5"
            >
              <Avatar className="h-8 w-8">
                {/* Avatar uses navy-to-teal gradient matching the brand */}
                <AvatarFallback className="bg-gradient-to-br from-[#0D1B4B] to-[#00C48C] text-white font-semibold">
                  A
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-[#0D1B4B]/10">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-[#0D1B4B] font-semibold">Asanda</span>
                <span className="text-xs text-[#4B5563]">
                  asanda@flowos.com
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#0D1B4B]/10" />
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="text-[#0D1B4B] hover:bg-[#00C48C]/10 focus:bg-[#00C48C]/10 cursor-pointer"
            >
              <User className="mr-2 h-4 w-4 text-[#00C48C]" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="text-[#0D1B4B] hover:bg-[#00C48C]/10 focus:bg-[#00C48C]/10 cursor-pointer"
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/teams")}
              className="text-[#0D1B4B] hover:bg-[#00C48C]/10 focus:bg-[#00C48C]/10 cursor-pointer"
            >
              Team
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#0D1B4B]/10" />
            <DropdownMenuItem className="text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
