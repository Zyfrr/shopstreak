"use client"

import { useEffect } from "react"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { useTheme } from "@/components/contexts/theme-provider"
import { cn } from "@/lib/util/utils"

export interface Toast {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  duration?: number
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

export function Toast({ toast, onClose }: ToastProps) {
  const { theme } = useTheme()

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id)
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onClose])

  const Icon = toastIcons[toast.type]

  const getToastStyles = () => {
  const baseStyles =
    "p-4 rounded-xl border shadow-md transition-all duration-300 animate-in slide-in-from-right-full max-w-xs backdrop-blur-md";

// Clean, premium, neutral background (same for all toast types)
const background = {
  success:
    "bg-gradient-to-br from-white/60 to-slate-50/70 border-slate-200/50 text-slate-800",
  error:
    "bg-gradient-to-br from-white/60 to-slate-50/70 border-slate-200/50 text-slate-800",
  warning:
    "bg-gradient-to-br from-white/60 to-slate-50/70 border-slate-200/50 text-slate-800",
  info:
    "bg-gradient-to-br from-white/60 to-slate-50/70 border-slate-200/50 text-slate-800",
};

// Same for dark mode
const darkBackground = {
  success:
    "dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/40 dark:border-slate-700/40 dark:text-slate-200",
  error:
    "dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/40 dark:border-slate-700/40 dark:text-slate-200",
  warning:
    "dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/40 dark:border-slate-700/40 dark:text-slate-200",
  info:
    "dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/40 dark:border-slate-700/40 dark:text-slate-200",
};


  return cn(
    baseStyles,
    background[toast.type] || background.info,
    darkBackground[toast.type] || darkBackground.info
  );
};


const getIconColor = () => {
  return cn(
    "text-slate-600 dark:text-slate-300"
  );
};


  const getCloseButtonColor = () => {
  return cn(
    "text-slate-500 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-700/40"
  );
};


 const getProgressBarColor = () => {
  return cn(
    "bg-slate-500 dark:bg-slate-300"
  );
};


  return (
    <div className={getToastStyles()}>
  {/* Progress Bar */}
  {toast.duration && toast.duration > 0 && (
    <div className="w-full h-[3px] bg-black/10 rounded-full mb-2 overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300 ease-out",
          getProgressBarColor()
        )}
        style={{
          width: "100%",
          animation: `shrink ${toast.duration}ms linear forwards`,
        }}
      />
    </div>
  )}

  <div className="flex items-start gap-2">
    {/* Icon */}
    <div className={cn("flex-shrink-0", getIconColor())}>
      <Icon className="w-4 h-4 mt-[2px]" />
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <h4 className="text-[0.75rem] font-semibold leading-tight mb-0.5">
        {toast.title}
      </h4>
      <p className="text-[0.65rem] opacity-90 leading-snug">
        {toast.message}
      </p>
    </div>

    {/* Close Button */}
    <button
      onClick={() => onClose(toast.id)}
      className={cn(
        "flex-shrink-0 w-5 h-5 rounded-full transition-transform duration-150 flex items-center justify-center hover:scale-110",
        getCloseButtonColor()
      )}
    >
      <X className="w-3 h-3" />
    </button>
  </div>

  <style jsx>{`
    @keyframes shrink {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }
  `}</style>
</div>

  )
}