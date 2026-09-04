"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string | null;
  htmlLink: string | null;
  location: string | null;
};

type CalendarResponse = {
  connected: boolean;
  googleEmail?: string;
  events: CalendarEvent[];
};

function formatEventTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-ZA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GoogleCalendarCard() {
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/google/calendar/events")
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load calendar");
        return res.json();
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setError("Calendar unavailable");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="card-depth p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-accent" />
            Google Calendar
          </h2>
          {data?.googleEmail && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {data.googleEmail}
            </p>
          )}
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <a href="/api/google/calendar/connect">Connect</a>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading calendar
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !data?.connected ? (
        <p className="text-sm text-muted-foreground">
          Connect Google Calendar to show upcoming events here.
        </p>
      ) : data.events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming events.</p>
      ) : (
        <div className="space-y-2">
          {data.events.map((event) => (
            <a
              key={event.id}
              href={event.htmlLink ?? "#"}
              target={event.htmlLink ? "_blank" : undefined}
              rel={event.htmlLink ? "noreferrer" : undefined}
              className="block rounded-lg border border-border bg-muted/30 p-3 transition hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {event.summary}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatEventTime(event.start)}
                  </p>
                  {event.location && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {event.location}
                    </p>
                  )}
                </div>
                {event.htmlLink && (
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
