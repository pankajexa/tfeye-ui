import * as React from "react"
import { Modal } from "./modal"

type ProductQuickViewProps = {
  show: boolean
  ShowCard?: React.ReactNode
  onCloseModal: (open: boolean) => void
  customClass?: string
  hideCloseBtn?: boolean
  loader?: boolean
  outSideClose?: boolean
}

const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  show,
  ShowCard,
  onCloseModal,
  customClass = "md:max-w-2xl lg:max-w-4xl",
  hideCloseBtn = false,
  loader = false,
  outSideClose = false,
}) => {
  const handleCloseItem = () => {
    if (loader === false) {
      onCloseModal(false)
    }
  }
  const handleOpenChange = (open: boolean) => {
    if (open) return
    if (loader === false && outSideClose === false) {
      onCloseModal(false)
    }
  }

  return (
    <Modal
      open={show}
      onOpenChange={handleOpenChange}
      hideCloseButton={hideCloseBtn}
      containerClassName="relative z-20"
      className={customClass}
      preventOutsideClose={loader || outSideClose}
      preventEscapeClose={loader}
    >
      {!hideCloseBtn && (
        <button
          type="button"
          disabled={loader}
          onClick={handleCloseItem}
          className="absolute z-[2] right-4 top-4 text-gray-400 hover:text-gray-500 sm:right-6 sm:top-6"
        >
          <span className="sr-only">Close</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      <div className="w-full">{ShowCard}</div>
    </Modal>
  )
}

export default ProductQuickView


