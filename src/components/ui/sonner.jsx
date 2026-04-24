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
            "group toast group-[.toaster]:border-0 group-[.toaster]:rounded-[26px] group-[.toaster]:px-4 group-[.toaster]:py-4 group-[.toaster]:shadow-[0_28px_72px_-44px_hsl(var(--ctp-sapphire)/0.55)] group-[.toaster]:backdrop-blur-2xl group-[.toaster]:bg-[linear-gradient(180deg,hsl(var(--ctp-base)/0.96),hsl(var(--ctp-crust)/0.9))] dark:group-[.toaster]:bg-[linear-gradient(180deg,hsl(var(--ctp-mantle)/0.96),hsl(var(--ctp-crust)/0.94))] before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-full before:bg-[linear-gradient(90deg,transparent,hsl(0_0%_100%/0.9),transparent)] before:opacity-80 overflow-hidden min-h-[78px]",
          content: "gap-1.5",
          title: "text-[14px] font-semibold tracking-[-0.02em] text-[hsl(var(--ctp-text))]",
          description: "text-[13px] leading-5 text-[hsl(var(--ctp-subtext0))]",
          icon: "mt-0.5 rounded-2xl border border-white/55 bg-white/75 p-2 shadow-sm dark:border-white/10 dark:bg-white/5",
          closeButton:
            "border-0 bg-transparent text-[hsl(var(--ctp-subtext0))] opacity-100 transition-colors hover:bg-[hsl(var(--ctp-surface0)/0.7)] hover:text-[hsl(var(--ctp-text))] dark:hover:bg-[hsl(var(--ctp-surface0)/0.8)]",
          success:
            "group-[.toast]:border-[hsl(var(--ctp-green)/0.24)] group-[.toast]:shadow-[0_30px_76px_-44px_hsl(var(--ctp-green)/0.45)]",
          error:
            "group-[.toast]:border-[hsl(var(--ctp-red)/0.24)] group-[.toast]:shadow-[0_30px_76px_-44px_hsl(var(--ctp-red)/0.35)]",
          warning:
            "group-[.toast]:border-[hsl(var(--ctp-yellow)/0.28)] group-[.toast]:shadow-[0_30px_76px_-44px_hsl(var(--ctp-peach)/0.42)]",
          info:
            "group-[.toast]:border-[hsl(var(--ctp-blue)/0.22)] group-[.toast]:shadow-[0_30px_76px_-44px_hsl(var(--ctp-sky)/0.42)]",
          loading:
            "group-[.toast]:border-[hsl(var(--ctp-sapphire)/0.22)] group-[.toast]:shadow-[0_30px_76px_-44px_hsl(var(--ctp-sapphire)/0.4)]",
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
          "--normal-bg": "hsl(var(--ctp-base) / 0.96)",
          "--normal-text": "hsl(var(--ctp-text))",
          "--normal-border": "hsl(var(--ctp-surface1) / 0.92)",
          "--success-bg": "hsl(var(--ctp-base) / 0.96)",
          "--success-border": "hsl(var(--ctp-green) / 0.22)",
          "--error-bg": "hsl(var(--ctp-base) / 0.96)",
          "--error-border": "hsl(var(--ctp-red) / 0.22)",
          "--warning-bg": "hsl(var(--ctp-base) / 0.96)",
          "--warning-border": "hsl(var(--ctp-yellow) / 0.24)",
          "--info-bg": "hsl(var(--ctp-base) / 0.96)",
          "--info-border": "hsl(var(--ctp-blue) / 0.2)",
          "--border-radius": "calc(var(--radius) + 8px)"
        }
      }
      {...props} />
  );
}

export { Toaster }
