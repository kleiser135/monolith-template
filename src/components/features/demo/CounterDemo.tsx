"use client"

import { useCounterStore } from "@/store/counter-store"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function CounterDemo() {
  const { count, increment, decrement } = useCounterStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  if (!hydrated) {
    return null
  }

  return (
    <div className="w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">Global State Demo (Zustand)</h2>
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={decrement}>-</Button>
        <p className="text-xl font-mono">{count}</p>
        <Button variant="outline" onClick={increment}>+</Button>
      </div>
    </div>
  )
} 