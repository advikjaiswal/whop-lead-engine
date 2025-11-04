"use client"

import React, { useState, useRef, useEffect } from 'react'

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || '')
  const [selectedLabel, setSelectedLabel] = useState('')
  const selectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleValueSelect = (newValue: string, label: string) => {
    setSelectedValue(newValue)
    setSelectedLabel(label)
    setIsOpen(false)
    onValueChange?.(newValue)
  }

  return (
    <div className="relative" ref={selectRef}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === SelectTrigger) {
            return React.cloneElement(child, {
              ...child.props,
              onClick: () => setIsOpen(!isOpen),
              selectedLabel,
            })
          }
          if (child.type === SelectContent && isOpen) {
            return React.cloneElement(child, {
              ...child.props,
              onValueSelect: handleValueSelect,
            })
          }
        }
        return child
      })}
    </div>
  )
}

interface SelectTriggerProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
  selectedLabel?: string
}

export function SelectTrigger({ className = "", children, onClick, selectedLabel }: SelectTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {selectedLabel || children}
      <svg
        width="15"
        height="15"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 opacity-50"
      >
        <path
          d="m4.93179 5.43179c0.20081-0.20081 0.52632-0.20081 0.72713 0l2.84108 2.84108 2.8411-2.84108c0.2008-0.20081 0.5263-0.20081 0.7271 0 0.2008 0.20081 0.2008 0.52632 0 0.72713l-3.2047 3.20472c-0.2008 0.2008-0.5263 0.2008-0.7271 0l-3.20472-3.20472c-0.20081-0.20081-0.20081-0.52632 0-0.72713z"
          fill="currentColor"
        />
      </svg>
    </button>
  )
}

interface SelectValueProps {
  placeholder?: string
}

export function SelectValue({ placeholder }: SelectValueProps) {
  return (
    <span className="text-muted-foreground">
      {placeholder || "Select an option"}
    </span>
  )
}

interface SelectContentProps {
  children: React.ReactNode
  onValueSelect?: (value: string, label: string) => void
}

export function SelectContent({ children, onValueSelect }: SelectContentProps) {
  return (
    <div className="absolute top-full left-0 right-0 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-md mt-1">
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          return React.cloneElement(child, {
            ...child.props,
            onSelect: onValueSelect,
          })
        }
        return child
      })}
    </div>
  )
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  onSelect?: (value: string, label: string) => void
}

export function SelectItem({ value, children, onSelect }: SelectItemProps) {
  const handleClick = () => {
    onSelect?.(value, typeof children === 'string' ? children : value)
  }

  return (
    <div
      onClick={handleClick}
      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100"
    >
      {children}
    </div>
  )
}