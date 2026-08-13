"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  ListTodo,
  Percent,
} from "lucide-react";

interface AnalyticsData {
  summary: {
    totalWorkflows: number;
    totalTasks: number;
    completedTasks: number;
    avgProgress: number;
    overdueCount: number;
  };
  byStatus: { label: string; value: number; color: string }[];
  byPriority: { label: string; value: number; color: string }[];
  overdueVsOnTrack: { label: string; value: number; color: string }[];
  avgProgressByTeam: { team: string; avg: number }[];
  tasksByMember: { name: string; count: number }[];
  completionOverTime: { date: string; completed: number; created: number }[];
}

const DAYS_OPTIONS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
  { label: "All", value: 365 },
];

const TEAM_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#22c55e",
  "#ef4444",
  "#06b6d4",
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-xl shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-muted-foreground mb-1">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full inline-block shrink-0"
            style={{ background: p.color ?? p.fill }}
          />
          {p.name}: <span className="font-semibold ml-0.5">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-card rounded-2xl border p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl border p-4 md:p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?days=${d}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError("Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(days);
  }, [days]);

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time insights across all workflows
          </p>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-xl self-start sm:self-auto">
          {DAYS_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setDays(o.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${days === o.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* Summary stats — 2 cols on mobile, 5 on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard
              icon={BarChart3}
              label="Total Workflows"
              value={data.summary.totalWorkflows}
              color="bg-[#10b981]"
            />
            <StatCard
              icon={ListTodo}
              label="Total Tasks"
              value={data.summary.totalTasks}
              color="bg-purple-500"
            />
            <StatCard
              icon={CheckCircle}
              label="Completed Tasks"
              value={data.summary.completedTasks}
              color="bg-green-500"
              sub={`of ${data.summary.totalTasks}`}
            />
            <StatCard
              icon={Percent}
              label="Avg Progress"
              value={`${data.summary.avgProgress}%`}
              color="bg-yellow-500"
            />
            <StatCard
              icon={AlertTriangle}
              label="Overdue"
              value={data.summary.overdueCount}
              color="bg-red-500"
            />
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard
              title="Workflow Activity Over Time"
              subtitle={`Created vs completed — last ${days} days`}
            >
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.completionOverTime}>
                  <defs>
                    <linearGradient
                      id="colorCreated"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorCompleted"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#22c55e"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.floor(data.completionOverTime.length / 5)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={24}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Created"
                    stroke="#3b82f6"
                    fill="url(#colorCreated)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stroke="#22c55e"
                    fill="url(#colorCompleted)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Workflows by Status"
              subtitle="Current distribution across all stages"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={data.byStatus.filter((s) => s.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.byStatus.map((s, i) => (
                        <Cell key={i} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 w-full sm:w-auto sm:min-w-[130px]">
                  {data.byStatus.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: s.color }}
                        />
                        <span className="text-xs text-muted-foreground">{s.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard
              title="Priority Breakdown"
              subtitle="Workflows by priority level"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={data.byPriority.filter((p) => p.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.byPriority.map((p, i) => (
                        <Cell key={i} fill={p.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 w-full sm:w-auto sm:min-w-[130px]">
                  {data.byPriority.map((p) => (
                    <div key={p.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: p.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {p.label}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          {p.value}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${(p.value / data.summary.totalWorkflows) * 100}%`,
                            background: p.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>

            <ChartCard
              title="Overdue vs On-Track"
              subtitle="Workflow health overview"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={data.overdueVsOnTrack.filter((o) => o.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.overdueVsOnTrack.map((o, i) => (
                        <Cell key={i} fill={o.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 w-full sm:w-auto sm:min-w-[130px]">
                  {data.overdueVsOnTrack.map((o) => (
                    <div
                      key={o.label}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: o.color }}
                        />
                        <span className="text-xs text-muted-foreground">{o.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {o.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard
              title="Average Progress by Team"
              subtitle="How far along each team's workflows are"
            >
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={data.avgProgressByTeam}
                  layout="vertical"
                  margin={{ left: 0, right: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f1f5f9"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="team"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    width={72}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    formatter={(v) => [`${v}%`, "Avg Progress"]}
                  />
                  <Bar
                    dataKey="avg"
                    name="Avg Progress"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={22}
                  >
                    {data.avgProgressByTeam.map((_, i) => (
                      <Cell
                        key={i}
                        fill={TEAM_COLORS[i % TEAM_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Tasks Completed by Team Member"
              subtitle="Who's getting things done"
            >
              {data.tasksByMember.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                  No completed tasks yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.tasksByMember}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={24}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      name="Tasks Completed"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    >
                      {data.tasksByMember.map((_, i) => (
                        <Cell
                          key={i}
                          fill={TEAM_COLORS[i % TEAM_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
