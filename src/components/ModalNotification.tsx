import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface ModalNotificationProps {
  show: boolean
  type: 'success' | 'error' | 'confirm'
  title: string
  message: string
  onConfirm?: () => void
  onClose: () => void
  confirmText?: string
  cancelText?: string
}

export default function ModalNotification({
  show,
  type,
  title,
  message,
  onConfirm,
  onClose,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: ModalNotificationProps) {
  if (!show) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          iconClass: 'text-green-500',
          bgClass: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'error':
        return {
          icon: XCircleIcon,
          iconClass: 'text-red-500',
          bgClass: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      case 'confirm':
        return {
          icon: ExclamationTriangleIcon,
          iconClass: 'text-yellow-500',
          bgClass: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        }
    }
  }

  const styles = getTypeStyles()
  const IconComponent = styles.icon

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 modal-backdrop" onClick={onClose} />

        <div className="relative w-full max-w-md animate-slide-in">
          <div className="rounded-2xl bg-white shadow-large overflow-hidden">
            {/* Header */}
            <div className={`px-6 py-5 border-b ${styles.borderColor} ${styles.bgClass}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${styles.bgClass}`}>
                  <IconComponent className={`h-6 w-6 ${styles.iconClass}`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-orbitron text-text-primary">
                    {title}
                  </h3>
                  <p className="text-sm text-text-muted font-rajdhani">
                    {type === 'success' ? 'Operation completed' : type === 'confirm' ? 'Please confirm action' : 'Error occurred'}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-text-secondary font-rajdhani text-base leading-relaxed">
                {message}
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-bg-tertiary border-t border-border-light">
              <div className="flex gap-3">
                {type === 'confirm' && onConfirm && (
                  <button
                    type="button"
                    onClick={() => {
                      onConfirm()
                      onClose()
                    }}
                    className="btn-danger flex-1 px-4 py-3 rounded-xl font-rajdhani font-semibold"
                  >
                    {confirmText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className={type === 'confirm' ? 'btn-secondary flex-1 px-4 py-3 rounded-xl font-rajdhani font-semibold' : 'btn-primary flex-1 px-4 py-3 rounded-xl font-rajdhani font-semibold'}
                >
                  {type === 'confirm' ? cancelText : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
