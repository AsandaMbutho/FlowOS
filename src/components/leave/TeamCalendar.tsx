"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

type AbsenceData = {
  [date: string]: Array<{
    name: string;
    type: string;
    halfDay: boolean;
    halfDayType?: "MORNING" | "AFTERNOON";
  }>;
};

const LEAVE_COLORS: Record<string, string> = {
  ANNUAL: "#3B82F6",
  SICK: "#EF4444",
  PERSONAL: "#10B981",
  MATERNITY: "#8B5CF6",
  PATERNITY: "#8B5CF6",
  UNPAID: "#F59E0B",
  OTHER: "#6B7280",
};

export default function TeamCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [absences, setAbsences] = useState<AbsenceData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const month = format(currentDate, "yyyy-MM");
      const res = await fetch(`/api/leave/team/calendar?month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch calendar data");
      const data = await res.json();
      setAbsences(data.absences || {});
    } catch (error) {
      console.error("Error fetching calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const getDayAbsences = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return absences[dateStr] || [];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayAbsences = getDayAbsences(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`
                  aspect-square p-1 border rounded-lg transition-all
                  ${!isCurrentMonth && "opacity-30"}
                  ${isTodayDate && "border-primary ring-2 ring-primary/30"}
                  ${dayAbsences.length > 0 && "bg-muted/30"}
                `}
              >
                <div className="flex flex-col h-full">
                  <span
                    className={`
                    text-sm font-medium
                    ${isTodayDate && "text-primary font-bold"}
                  `}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="flex-1 space-y-0.5 mt-1 overflow-hidden">
                    {dayAbsences.slice(0, 3).map((absence, idx) => (
                      <TooltipProvider key={idx}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="text-xs px-1 py-0.5 rounded truncate"
                              style={{
                                backgroundColor:
                                  LEAVE_COLORS[absence.type] || "#6B7280",
                                color: "white",
                              }}
                            >
                              {absence.name}
                              {absence.halfDay && " ⏰"}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{absence.name}</p>
                            <p className="text-xs">{absence.type}</p>
                            {absence.halfDay && (
                              <p className="text-xs">
                                {absence.halfDayType === "MORNING"
                                  ? "Morning"
                                  : "Afternoon"}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    {dayAbsences.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{dayAbsences.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t flex flex-wrap gap-3">
          {Object.entries(LEAVE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1 text-xs">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-muted-foreground">{type}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
