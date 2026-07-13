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
            "group toast group-[.toaster]:border group-[.toaster]:border-[hsl(var(--ctp-surface1))] group-[.toaster]:rounded-2xl group-[.toaster]:px-4 group-[.toaster]:py-4 group-[.toaster]:shadow-lg group-[.toaster]:bg-[hsl(var(--ctp-base))] dark:group-[.toaster]:bg-[hsl(var(--ctp-mantle))] overflow-hidden min-h-[78px]",
          content: "gap-1.5",
          title: "text-[14px] font-semibold tracking-[-0.01em] text-[hsl(var(--ctp-text))]",
          description: "text-[13px] leading-5 text-[hsl(var(--ctp-subtext0))]",
          icon: "mt-0.5 rounded-xl border border-[hsl(var(--ctp-surface1))] bg-[hsl(var(--ctp-surface0))] p-2 shadow-sm",
          closeButton:
            "border-0 bg-transparent text-[hsl(var(--ctp-subtext0))] opacity-100 transition-colors hover:bg-[hsl(var(--ctp-surface0))] hover:text-[hsl(var(--ctp-text))]",
          success:
            "group-[.toast]:border-[hsl(var(--ctp-green)/0.35)]",
          error:
            "group-[.toast]:border-[hsl(var(--ctp-red)/0.35)]",
          warning:
            "group-[.toast]:border-[hsl(var(--ctp-yellow)/0.4)]",
          info:
            "group-[.toast]:border-[hsl(var(--ctp-blue)/0.35)]",
          loading:
            "group-[.toast]:border-[hsl(var(--ctp-sapphire)/0.35)]",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "hsl(var(--ctp-base))",
          "--normal-text": "hsl(var(--ctp-text))",
          "--normal-border": "hsl(var(--ctp-surface1))",
          "--success-bg": "hsl(var(--ctp-base))",
          "--success-border": "hsl(var(--ctp-green) / 0.35)",
          "--error-bg": "hsl(var(--ctp-base))",
          "--error-border": "hsl(var(--ctp-red) / 0.35)",
          "--warning-bg": "hsl(var(--ctp-base))",
          "--warning-border": "hsl(var(--ctp-yellow) / 0.4)",
          "--info-bg": "hsl(var(--ctp-base))",
          "--info-border": "hsl(var(--ctp-blue) / 0.35)",
          "--border-radius": "calc(var(--radius))"
        }
      }
      {...props} />
  );
}

export { Toaster }
