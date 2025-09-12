export { default as Header} from  './layout/Header';
export { default as Navbar} from  './layout/Navbar'
export { default as Loader} from  './layout/Loader'
export { default as ErrorComponent} from  './layout/ErrorComponent'
export { Modal } from './ui/modal'
export { ConfirmProvider, useConfirm } from './ui/confirm-dialog'
export { default as ProductQuickView } from './ui/product-quick-view'
export { ViolationSelect } from './ui/violation-select'

// Error Boundary (Single file with all functionality)
export { 
  default as ErrorBoundary,
  ErrorBoundaryProvider,
  ComponentErrorBoundary,
  SafeComponent,
  useErrorReporting,
  useErrorHandler,
  errorLogger
} from './ErrorBoundary'