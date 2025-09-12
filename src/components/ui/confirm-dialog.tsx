import * as React from "react"
import { Button } from "./button"
import { Modal } from "./modal"

export type UseConfirmOptions = {
  title?: React.ReactNode
  description?: React.ReactNode
  confirmText?: React.ReactNode
  cancelText?: React.ReactNode
  destructive?: boolean
}

type InternalState = {
  open: boolean
  resolve?: (value: boolean) => void
} & UseConfirmOptions

const ConfirmContext = React.createContext<{
  confirm: (options?: UseConfirmOptions) => Promise<boolean>
} | null>(null)

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<InternalState>({ open: false })

  const confirm = React.useCallback((options?: UseConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, resolve, ...(options || {}) })
    })
  }, [])

  const handleClose = (answer: boolean) => {
    setState((prev) => {
      prev.resolve?.(answer)
      return { open: false }
    })
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal
        open={state.open}
        onOpenChange={(o) => !o && handleClose(false)}
        title={state.title ?? "Are you sure?"}
        description={state.description}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)}>
              {state.cancelText ?? "Cancel"}
            </Button>
            <Button
              variant={state.destructive ? "destructive" : "default"}
              onClick={() => handleClose(true)}
            >
              {state.confirmText ?? "Confirm"}
            </Button>
          </div>
        }
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = React.useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider")
  return ctx.confirm
}


