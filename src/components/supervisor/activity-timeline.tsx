"use client";

import { format } from "date-fns";

interface Activity {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user?: { name: string };
  workflow?: { title: string };
}

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  const groupedActivities = activities.reduce(
    (acc, activity) => {
      const date = format(new Date(activity.createdAt), "yyyy-MM-dd");
      if (!acc[date]) acc[date] = [];
      acc[date].push(activity);
      return acc;
    },
    {} as Record<string, Activity[]>,
  );

  const sortedDates = Object.keys(groupedActivities).sort().reverse();

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
      {sortedDates.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No activity yet
        </p>
      )}
      {sortedDates.map((date) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-foreground mb-2 sticky top-0 bg-background py-1">
            {format(new Date(date), "EEEE, MMMM d, yyyy")}
          </h3>
          <div className="space-y-2">
            {groupedActivities[date].map((activity: Activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-2 hover:bg-muted/30 rounded-lg transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">
                      {activity.user?.name || "System"}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {activity.action}
                    </span>
                    <span className="font-medium text-accent ml-1">
                      {activity.workflow?.title}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(activity.createdAt), "h:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
