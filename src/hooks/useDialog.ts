/**
 * Hook para manejo de diálogos y modales
 */

import { useState } from 'react'

export function useDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<any>(null)

  const open = (dialogData?: any) => {
    if (dialogData !== undefined) {
      setData(dialogData)
    }
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    setData(null)
  }

  const toggle = () => {
    setIsOpen(prev => !prev)
  }

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
  }
}
