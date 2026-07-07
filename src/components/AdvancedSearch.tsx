// components/AdvancedSearch.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  X,
  ChevronDown,
  Calendar,
  Users,
  Tag,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Image,
  File,
  FileArchive,
  Bookmark,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SearchFilter = {
  field: string;
  operator: string;
  value: string;
};

interface AdvancedSearchProps {
  onSearch: (query: string, filters: SearchFilter[]) => void;
  onClose: () => void;
  isOpen: boolean;
}

const SEARCH_FIELDS = [
  { value: "title", label: "Title" },
  { value: "description", label: "Description" },
  { value: "team", label: "Team" },
  { value: "assignee", label: "Assignee" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "tags", label: "Tags" },
  { value: "progress", label: "Progress" },
  { value: "dueDate", label: "Due Date" },
  { value: "createdAt", label: "Created" },
  { value: "content", label: "File Content" },
];

const OPERATORS = [
  { value: "contains", label: "Contains" },
  { value: "equals", label: "Equals" },
  { value: "startsWith", label: "Starts With" },
  { value: "endsWith", label: "Ends With" },
  { value: "gt", label: "Greater Than" },
  { value: "lt", label: "Less Than" },
  { value: "between", label: "Between" },
];

const STATUS_OPTIONS = [
  "To Do",
  "In Progress",
  "Review",
  "Completed",
  "Blocked",
];
const PRIORITY_OPTIONS = ["HIGH", "MEDIUM", "LOW"];
const TEAM_OPTIONS = ["Engineering", "Design", "Sales", "Operations"];

export function AdvancedSearch({
  onSearch,
  onClose,
  isOpen,
}: AdvancedSearchProps) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilter[]>([
    { field: "title", operator: "contains", value: "" },
  ]);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load saved searches
  useEffect(() => {
    const saved = localStorage.getItem("flowos-saved-searches");
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const addFilter = () => {
    setFilters([
      ...filters,
      { field: "title", operator: "contains", value: "" },
    ]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: string, value: string) => {
    const updated = [...filters];
    updated[index] = { ...updated[index], [field]: value };
    setFilters(updated);
  };

  const handleSearch = () => {
    const validFilters = filters.filter((f) => f.value.trim());
    onSearch(query, validFilters);
    onClose();
  };

  const saveSearch = () => {
    const searchString = JSON.stringify({ query, filters });
    const updated = [...savedSearches, searchString];
    setSavedSearches(updated);
    localStorage.setItem("flowos-saved-searches", JSON.stringify(updated));
    setShowSavedSearches(false);
  };

  const loadSavedSearch = (index: number) => {
    try {
      const parsed = JSON.parse(savedSearches[index]);
      setQuery(parsed.query || "");
      setFilters(
        parsed.filters || [{ field: "title", operator: "contains", value: "" }],
      );
      setShowSavedSearches(false);
    } catch {}
  };

  const getFieldLabel = (field: string) => {
    return SEARCH_FIELDS.find((f) => f.value === field)?.label || field;
  };

  const getOperatorLabel = (operator: string) => {
    return OPERATORS.find((o) => o.value === operator)?.label || operator;
  };

  // Render value input based on field type
  const renderValueInput = (filter: SearchFilter, index: number) => {
    const field = filter.field;

    if (field === "status") {
      return (
        <select
          value={filter.value}
          onChange={(e) => updateFilter(index, "value", e.target.value)}
          className="flex-1 min-w-[100px] border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-[#10b981]"
        >
          <option value="">Select status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      );
    }

    if (field === "priority") {
      return (
        <select
          value={filter.value}
          onChange={(e) => updateFilter(index, "value", e.target.value)}
          className="flex-1 min-w-[100px] border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-[#10b981]"
        >
          <option value="">Select priority</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      );
    }

    if (field === "team") {
      return (
        <select
          value={filter.value}
          onChange={(e) => updateFilter(index, "value", e.target.value)}
          className="flex-1 min-w-[100px] border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-[#10b981]"
        >
          <option value="">Select team</option>
          {TEAM_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      );
    }

    if (field === "progress" || field === "dueDate" || field === "createdAt") {
      return (
        <Input
          type={field === "progress" ? "number" : "date"}
          value={filter.value}
          onChange={(e) => updateFilter(index, "value", e.target.value)}
          placeholder={`Enter ${getFieldLabel(field)}`}
          className="flex-1 min-w-[100px] bg-background border-border text-foreground"
        />
      );
    }

    return (
      <Input
        type="text"
        value={filter.value}
        onChange={(e) => updateFilter(index, "value", e.target.value)}
        placeholder={`Enter ${getFieldLabel(field)}`}
        className="flex-1 min-w-[100px] bg-background border-border text-foreground"
      />
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40">
      <div
        ref={modalRef}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-[#10b981]" />
            <h2 className="text-lg font-bold text-foreground">
              Advanced Search
            </h2>
            <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
              {filters.filter((f) => f.value.trim()).length} filters
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
              title="Saved searches"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Saved searches dropdown */}
        {showSavedSearches && savedSearches.length > 0 && (
          <div className="px-6 py-3 border-b border-border bg-muted/10">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Saved Searches
            </p>
            <div className="flex flex-wrap gap-2">
              {savedSearches.map((search, i) => {
                try {
                  const parsed = JSON.parse(search);
                  const label =
                    parsed.query ||
                    Object.values(parsed.filters || {})
                      .map((f: any) => f.value)
                      .filter(Boolean)
                      .join(", ");
                  return (
                    <button
                      key={i}
                      onClick={() => loadSavedSearch(i)}
                      className="text-xs px-3 py-1.5 bg-muted/30 hover:bg-muted/50 rounded-full text-foreground transition-colors flex items-center gap-1.5"
                    >
                      <Search className="w-3 h-3" />
                      {label.substring(0, 30)}
                    </button>
                  );
                } catch {
                  return null;
                }
              })}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Quick search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across all workflows and documents..."
              className="pl-9 bg-background border-border text-foreground"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>or refine with filters</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Filters */}
          {filters.map((filter, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-muted/10 rounded-lg border border-border/50"
            >
              {/* Field */}
              <select
                value={filter.field}
                onChange={(e) => updateFilter(index, "field", e.target.value)}
                className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-[#10b981]"
              >
                {SEARCH_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              {/* Operator */}
              <select
                value={filter.operator}
                onChange={(e) =>
                  updateFilter(index, "operator", e.target.value)
                }
                className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background text-foreground focus:ring-2 focus:ring-[#10b981]"
              >
                {OPERATORS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              {/* Value */}
              {renderValueInput(filter, index)}

              {/* Actions */}
              <button
                onClick={() => removeFilter(index)}
                className="text-muted-foreground hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={addFilter}
            className="text-sm text-[#10b981] hover:text-[#0d8a6a] transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add filter
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between bg-muted/5">
          <div className="flex items-center gap-2">
            <button
              onClick={saveSearch}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              disabled={!query && filters.every((f) => !f.value.trim())}
            >
              <Bookmark className="w-3.5 h-3.5" /> Save Search
            </button>
            <button
              onClick={() => {
                setQuery("");
                setFilters([
                  { field: "title", operator: "contains", value: "" },
                ]);
              }}
              className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSearch}
              className="bg-[#0f1f3d] hover:bg-[#10b981] dark:bg-[#10b981] dark:hover:bg-[#0f1f3d] text-white"
            >
              <Search className="w-4 h-4 mr-1.5" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
