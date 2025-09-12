import * as React from "react"
import { cn } from "@/lib/utils"

export type ModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  footer?: React.ReactNode
  hideCloseButton?: boolean
  className?: string
  containerClassName?: string
  size?: "sm" | "md" | "lg"
  preventOutsideClose?: boolean
  preventEscapeClose?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  hideCloseButton,
  className,
  containerClassName,
  size = "md",
  preventOutsideClose,
  preventEscapeClose,
}) => {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preventEscapeClose) onOpenChange(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onOpenChange, preventEscapeClose])

  if (!open) return null

  const sizeClass =
    size === "sm"
      ? "max-w-sm"
      : size === "lg"
      ? "max-w-2xl"
      : "max-w-lg"

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 h-screen  flex items-center justify-center p-6",
        containerClassName
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      aria-describedby={description ? "modal-description" : undefined}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          if (!preventOutsideClose) onOpenChange(false)
        }}
      />

      <div
        className={cn(
          "relative w-full rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-lg outline-none ",
          sizeClass,
          className
        )}
      >
        {(title || !hideCloseButton) && (
          <div className="flex items-start justify-between gap-4 px-5 py-4 ">
            <div className="min-w-0">
              {title && (
                <h2 id="modal-title" className="truncate text-base font-semibold">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                  {description}
                </p>
              )}
            </div>
            {!hideCloseButton && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="-m-1 cursor-pointer rounded-md p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="px-5 py-4">
          {children}
        </div>

        {footer && <div className="border-t border-[hsl(var(--border))] px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export default Modal


