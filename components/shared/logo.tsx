// components/shared/logo.tsx
"use client";

import Link from "next/link";
import { useTheme } from "@/components/contexts/theme-provider";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  href?: string | null;
  className?: string;
}

export function Logo({
  size = "md",
  showText = true,
  href = null,
  className = "",
}: LogoProps) {
  const { theme } = useTheme();

  // Set logo size based on prop
  const sizeMap = {
    sm: { svgSize: "w-11 h-11", textSize: "text-sm" },
    md: { svgSize: "w-12 h-12", textSize: "text-base" },
    lg: { svgSize: "w-14 h-14", textSize: "text-lg" },
  };

  const { svgSize, textSize } = sizeMap[size];

  // Theme-based stroke color
  const themeStroke =
    {
      sunset: "#EA580C", // orange-600
      ocean: "#0284C7", // blue-600
      forest: "#059669", // emerald-600
    }[theme] ?? "#000";

  const SVGLogo = () => (
    <svg
      className={`${svgSize}`}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bag outline */}
      <path
        d="M60 60 H140 V140 H60 Z"
        stroke={themeStroke}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Smile */}
      <path
        d="M80 100 Q100 120 120 100"
        stroke={themeStroke}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const Output = (
    <div className={`flex items-center gap-1 ${className}`}>
      {SVGLogo()}

      {showText && (
        <span
          className={`hidden sm:block select-none ${textSize} font-semibold tracking-tight text-foreground`}
        >
          Shop<span className="opacity-60">Streak</span>
        </span>
      )}
    </div>
  );

  return href ? <Link href={href}>{Output}</Link> : Output;
}
