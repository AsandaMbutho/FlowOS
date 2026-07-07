"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Package,
  Server,
  Users,
  GitBranch,
  UserCircle,
  BarChart3,
  Settings,
  Pencil,
  Check,
  X,
  LayoutDashboard,
  LogOut,
  Workflow,
  Kanban,
  FolderKanban,
  FileText,
  Folder,
  Globe,
  Shield,
  BarChart,
  Smartphone,
  Lightbulb,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  iconName: string;
  href: string;
  children?: Tab[];
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Workflow,
  Kanban,
  FolderKanban,
  FileText,
  Folder,
  Package,
  Server,
  Users,
  GitBranch,
  UserCircle,
  BarChart3,
  Settings,
  ChevronDown,
  Globe,
  Shield,
  BarChart,
  Smartphone,
  Lightbulb,
  Briefcase,
};

const DEFAULT_TABS: Tab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    iconName: "LayoutDashboard",
    href: "/dashboard",
  },
  {
    id: "workflows",
    label: "Workflows",
    iconName: "Workflow",
    href: "/workflows",
    children: [
      {
        id: "all-workflows",
        label: "All Workflows",
        iconName: "FolderKanban",
        href: "/workflows",
      },
      {
        id: "kanban",
        label: "Kanban Board",
        iconName: "Kanban",
        href: "/kanban",
      },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    iconName: "FileText",
    href: "/documents",
    children: [
      {
        id: "doc-flowos",
        label: "FlowOS",
        iconName: "Folder",
        href: "/documents?project=flowos",
      },
      {
        id: "doc-elearning",
        label: "E-Learning",
        iconName: "Folder",
        href: "/documents?project=elearning",
      },
      {
        id: "doc-cybersafe",
        label: "CyberSafe",
        iconName: "Folder",
        href: "/documents?project=cybersafe",
      },
      {
        id: "doc-crm",
        label: "CRM",
        iconName: "Folder",
        href: "/documents?project=crm",
      },
    ],
  },
  {
    id: "products",
    label: "Products",
    iconName: "Package",
    href: "/products",
    children: [
      {
        id: "prod-flowos",
        label: "FlowOS",
        iconName: "Package",
        href: "/products/flowos",
      },
      {
        id: "prod-elearning",
        label: "E-Learning",
        iconName: "Package",
        href: "/products/elearning",
      },
      {
        id: "prod-cybersafe",
        label: "CyberSafe",
        iconName: "Package",
        href: "/products/cybersafe",
      },
      {
        id: "prod-crm",
        label: "CRM",
        iconName: "Package",
        href: "/products/crm",
      },
    ],
  },
  {
    id: "services",
    label: "Services",
    iconName: "Server",
    href: "/services",
    children: [
      {
        id: "svc-webdev",
        label: "Web Development",
        iconName: "Globe",
        href: "/services/web-development",
      },
      {
        id: "svc-security",
        label: "Data Security & Compliance",
        iconName: "Shield",
        href: "/services/security-compliance",
      },
      {
        id: "svc-analytics",
        label: "Analytics & Insights",
        iconName: "BarChart",
        href: "/services/analytics-insights",
      },
      {
        id: "svc-mobile",
        label: "Mobile Solutions",
        iconName: "Smartphone",
        href: "/services/mobile-solutions",
      },
      {
        id: "svc-digital",
        label: "Digital Strategy",
        iconName: "Lightbulb",
        href: "/services/digital-strategy",
      },
      {
        id: "svc-consulting",
        label: "Consulting Services",
        iconName: "Briefcase",
        href: "/services/consulting",
      },
    ],
  },
  { id: "team", label: "Team", iconName: "UserCircle", href: "/team" },
  {
    id: "analytics",
    label: "Analytics",
    iconName: "BarChart3",
    href: "/analytics",
  },
  {
    id: "settings",
    label: "Settings",
    iconName: "Settings",
    href: "/settings",
  },
];

const TABS_STORAGE_KEY = "flowos-tabs-state";

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const [tabs, setTabs] = useState<Tab[]>(DEFAULT_TABS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(["workflows", "documents", "products", "services"]),
  );

  useEffect(() => {
    const savedTabs = localStorage.getItem(TABS_STORAGE_KEY);
    if (savedTabs !== null) {
      try {
        const parsed = JSON.parse(savedTabs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTabs(parsed);
        }
      } catch {
        // Use defaults
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const startEditing = (tab: Tab, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingId(tab.id);
    setEditValue(tab.label);
  };

  const saveEditing = () => {
    if (!editingId || !editValue.trim()) {
      setEditingId(null);
      return;
    }
    const updateTabs = (items: Tab[]): Tab[] => {
      return items.map((tab) => {
        if (tab.id === editingId) {
          return { ...tab, label: editValue.trim() };
        }
        if (tab.children) {
          return { ...tab, children: updateTabs(tab.children) };
        }
        return tab;
      });
    };
    setTabs(updateTabs(tabs));
    setEditingId(null);
    setEditValue("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEditing();
    }
    if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName];
    return IconComponent || LayoutDashboard;
  };

  const renderNavItem = (tab: Tab, depth: number = 0) => {
    const Icon = getIcon(tab.iconName);
    const isActive =
      pathname === tab.href || pathname?.startsWith(tab.href + "/");
    const hasChildren = tab.children && tab.children.length > 0;
    const isExpanded = expandedItems.has(tab.id);
    const isEditing = editingId === tab.id;

    if (hasChildren) {
      return (
        <div key={tab.id} className="mb-1">
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer hover:bg-white/5",
              isActive ? "text-[#29d3aa]" : "text-white/50 hover:text-white",
            )}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
            onClick={() => toggleExpand(tab.id)}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 text-sm font-medium">{tab.label}</span>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isExpanded ? "rotate-180" : "",
              )}
            />
          </div>
          {isExpanded && (
            <div className="ml-2 border-l border-white/10 pl-2">
              {tab.children?.map((child) => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    if (isEditing) {
      return (
        <div
          key={tab.id}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 border border-[#29d3aa]/30"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <Icon className="w-4 h-4 text-[#29d3aa] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEditing}
            className="flex-1 bg-transparent text-white text-sm outline-none min-w-0"
            placeholder="Tab name..."
          />
          <button
            onClick={saveEditing}
            className="p-0.5 text-green-400 hover:text-green-300 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={cancelEditing}
            className="p-0.5 text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    return (
      <Link
        key={tab.id}
        href={tab.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group relative",
          isActive
            ? "bg-gradient-to-r from-[#29d3aa]/20 to-transparent text-[#29d3aa]"
            : "text-white/50 hover:text-white hover:bg-white/5",
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-sm font-medium">{tab.label}</span>
        <button
          onClick={(e) => startEditing(tab, e)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/70 p-0.5"
          title="Rename"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </Link>
    );
  };

  if (!sidebarOpen) {
    return (
      <aside className="fixed left-0 top-0 z-40 h-screen w-16 bg-[#0f1f3d] border-r border-white/5 flex flex-col items-center py-4 transition-all duration-300">
        <button
          onClick={toggleSidebar}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors mb-4"
          title="Expand sidebar"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#29d3aa] to-[#14a882] flex items-center justify-center text-white font-bold text-sm mb-6">
          F
        </div>

        <nav className="flex-1 w-full space-y-1">
          {tabs.map((tab) => {
            const Icon = getIcon(tab.iconName);
            const isActive =
              pathname === tab.href || pathname?.startsWith(tab.href + "/");
            return (
              <Link
                key={tab.id}
                href={tab.href}
                title={tab.label}
                className={cn(
                  "w-full flex items-center justify-center h-10 rounded-lg transition-all relative group",
                  isActive
                    ? "bg-gradient-to-r from-[#29d3aa]/20 to-transparent text-[#29d3aa]"
                    : "text-white/40 hover:text-white hover:bg-white/5",
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="absolute left-full ml-2 px-2 py-1 bg-[#0f1f3d] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#0f1f3d] border-r border-white/5 flex flex-col py-4 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#29d3aa] to-[#14a882] flex items-center justify-center text-white font-bold text-sm">
            F
          </div>
          <span className="text-white font-semibold text-lg">
            Flow<span className="text-[#29d3aa]">OS</span>
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {tabs.map((tab) => renderNavItem(tab, 0))}
      </nav>

      {/* Footer */}
      <div className="px-4 pt-4 border-t border-white/5 mt-auto">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#29d3aa] to-[#7c6cff] flex items-center justify-center text-white text-xs font-semibold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">Asanda</p>
            <p className="text-xs text-white/40 truncate">Team Member</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-[#29d3aa] flex-shrink-0" />
        </div>
        <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors text-white/30 hover:text-white/60 mt-1">
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
