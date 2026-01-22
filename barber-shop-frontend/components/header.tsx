'use client'

import { Button } from '@/components/ui/button'
import { Scissors } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/20">
            <Scissors className="size-5 text-primary" />
          </div>
          <span className="text-xl font-bold">
            <span className="text-foreground">BARBER</span>
            <span className="text-primary">SHOP</span>
          </span>
        </div>
        <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent">
          Login
        </Button>
      </div>
    </header>
  )
}
