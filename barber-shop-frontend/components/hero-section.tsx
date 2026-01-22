'use client'

import { Button } from '@/components/ui/button'
import { Scissors } from 'lucide-react'

interface HeroSectionProps {
  onBookClick: () => void
}

export function HeroSection({ onBookClick }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="size-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>
      </div>

      <div className="container mx-auto px-4 text-center">
        {/* Mascot/Logo */}
        <div className="mx-auto mb-8 flex size-32 items-center justify-center rounded-full bg-card md:size-40">
          <div className="relative">
            <div className="flex size-24 items-center justify-center rounded-full bg-primary/20 md:size-32">
              <Scissors className="size-12 text-primary md:size-16" />
            </div>
          </div>
        </div>

        {/* Branding */}
        <h1 className="mb-4 text-4xl font-bold md:text-6xl">
          <span className="text-foreground">BARBER</span>
          <span className="text-primary">SHOP</span>
        </h1>
        <p className="mb-2 text-lg text-muted-foreground md:text-xl">
          Get the Best Haircut Here
        </p>

        {/* Hero headline */}
        <h2 className="mx-auto mb-8 max-w-2xl text-balance text-2xl font-semibold text-foreground md:text-3xl">
          Professional grooming services tailored just for you
        </h2>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            onClick={onBookClick}
            className="min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Book Now
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="min-w-[200px] border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
          >
            Login
          </Button>
        </div>
      </div>
    </section>
  )
}
