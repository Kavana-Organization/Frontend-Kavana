"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      closeButton
      expand
      gap={14}
      visibleToasts={4}
      offset={24}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border group-[.toaster]:border-[var(--line)] group-[.toaster]:rounded-xl group-[.toaster]:px-4 group-[.toaster]:py-4 group-[.toaster]:shadow-overlay group-[.toaster]:bg-[var(--surface-raised)] overflow-hidden min-h-[78px]",
          content: "gap-1.5",
          title: "text-sm font-semibold tracking-normal text-[var(--text-strong)]",
          description: "text-xs leading-5 text-[var(--text-muted)]",
          icon: "mt-0.5 rounded-lg border border-[var(--line)] bg-[var(--surface-sunken)] p-2 shadow-none",
          closeButton:
            "border-0 bg-transparent text-[var(--text-muted)] opacity-100 transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]",
          success:
            "group-[.toast]:border-l-4 group-[.toast]:border-l-[hsl(var(--ctp-green))]",
          error:
            "group-[.toast]:border-l-4 group-[.toast]:border-l-[hsl(var(--ctp-red))]",
          warning:
            "group-[.toast]:border-l-4 group-[.toast]:border-l-[hsl(var(--ctp-peach))]",
          info:
            "group-[.toast]:border-l-4 group-[.toast]:border-l-[hsl(var(--ctp-blue))]",
          loading:
            "group-[.toast]:border-l-4 group-[.toast]:border-l-[hsl(var(--ctp-blue))]",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-[hsl(var(--ctp-green))]" />,
        info: <InfoIcon className="size-4 text-[hsl(var(--ctp-blue))]" />,
        warning: <TriangleAlertIcon className="size-4 text-[hsl(var(--ctp-peach))]" />,
        error: <OctagonXIcon className="size-4 text-[hsl(var(--ctp-red))]" />,
        loading: <Loader2Icon className="size-4 animate-spin text-[hsl(var(--ctp-blue))]" />,
      }}
      style={
        {
          "--normal-bg": "var(--surface-raised)",
          "--normal-text": "var(--text-strong)",
          "--normal-border": "var(--line)",
          "--border-radius": "12px",
        }
      }
      {...props} />
  );
}

export { Toaster }
