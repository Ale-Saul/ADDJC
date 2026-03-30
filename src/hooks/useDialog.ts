import { useState } from 'react'

export function useDialog<T = any>() {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<T | null>(null)

  const open = (dialogData?: T) => {
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
