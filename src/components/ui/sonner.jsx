"use client"

import { useEffect, useState } from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner } from "sonner";

/**
 * Tema toast harus mengikuti tema aplikasi, bukan tema sistem operasi.
 * Aplikasi ini mengganti tema dengan class `dark` pada <html> (lihat
 * useThemeLocal di halaman profil), bukan lewat next-themes, sehingga
 * useTheme() dari next-themes selalu mengembalikan nilai default.
 */
function useDocumentTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof document === "undefined") return "light"
    return document.documentElement.classList.contains("dark") ? "dark" : "light"
  })

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => {
      setTheme(root.classList.contains("dark") ? "dark" : "light")
    })
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return theme
}

const Toaster = ({
  ...props
}) => {
  const theme = useDocumentTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      closeButton
      gap={10}
      visibleToasts={3}
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border group-[.toaster]:border-[var(--line)] group-[.toaster]:rounded-lg group-[.toaster]:px-3.5 group-[.toaster]:py-3 group-[.toaster]:shadow-overlay group-[.toaster]:bg-[var(--surface-raised)] overflow-hidden",
          content: "gap-0.5",
          title: "text-sm font-medium tracking-normal text-[var(--text-strong)]",
          description: "text-xs leading-5 text-[var(--text-muted)]",
          icon: "mt-0 shrink-0 text-[var(--text-muted)]",
          closeButton:
            "border-0 bg-transparent text-[var(--text-muted)] opacity-100 transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--text-strong)]",
          success:
            "group-[.toast]:border-l-2 group-[.toast]:border-l-[hsl(var(--ctp-green))]",
          error:
            "group-[.toast]:border-l-2 group-[.toast]:border-l-[hsl(var(--ctp-red))]",
          warning:
            "group-[.toast]:border-l-2 group-[.toast]:border-l-[hsl(var(--ctp-peach))]",
          info:
            "group-[.toast]:border-l-2 group-[.toast]:border-l-[hsl(var(--ctp-blue))]",
          loading:
            "group-[.toast]:border-l-2 group-[.toast]:border-l-[hsl(var(--ctp-blue))]",
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
          "--border-radius": "0.5rem",
          "--width": "22rem",
        }
      }
      {...props} />
  );
}

export { Toaster }
