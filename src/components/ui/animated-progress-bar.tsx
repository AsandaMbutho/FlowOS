"use client";

import { motion } from "framer-motion";

interface AnimatedProgressBarProps {
  progress: number;
  height?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function AnimatedProgressBar({
  progress,
  height = "md",
  showLabel = true,
}: AnimatedProgressBarProps) {
  const getColor = () => {
    if (progress < 30) return "bg-red-500";
    if (progress < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const heights = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <motion.span
            key={progress}
            initial={{ scale: 1.2, color: "#10b981" }}
            animate={{ scale: 1, color: "#000000" }}
            transition={{ duration: 0.3 }}
            className="font-medium"
          >
            {progress}%
          </motion.span>
        </div>
      )}
      <div
        className={`w-full bg-muted rounded-full overflow-hidden ${heights[height]}`}
      >
        <motion.div
          className={`h-full rounded-full ${getColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
