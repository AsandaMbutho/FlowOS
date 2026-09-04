"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type BalanceData = {
  annual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
  personal: { total: number; used: number; remaining: number };
};

export default function LeaveBalanceCard() {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/leave/balance");
      if (!res.ok) throw new Error("Failed to fetch balance");
      const data = await res.json();
      setBalance(data);
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!balance) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <p className="text-muted-foreground">No balance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Annual Leave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {balance.annual.remaining} days
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Used: {balance.annual.used}</span>
            <span>Total: {balance.annual.total}</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{
                width: `${(balance.annual.used / balance.annual.total) * 100}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Sick Leave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {balance.sick.remaining} days
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Used: {balance.sick.used}</span>
            <span>Total: {balance.sick.total}</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{
                width: `${(balance.sick.used / balance.sick.total) * 100}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Personal Leave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {balance.personal.remaining} days
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Used: {balance.personal.used}</span>
            <span>Total: {balance.personal.total}</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{
                width: `${(balance.personal.used / balance.personal.total) * 100}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
