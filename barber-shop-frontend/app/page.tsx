'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { HeroSection } from '@/components/hero-section'
import { ServicesSection } from '@/components/services-section'
import { BookingModal } from '@/components/booking-modal'
import type { Service } from '@/components/service-card'

export default function HomePage() {
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const handleBookService = (service: Service) => {
    setSelectedService(service)
    setIsBookingOpen(true)
  }

  const handleBookClick = () => {
    setSelectedService(null)
    setIsBookingOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection onBookClick={handleBookClick} />
        <ServicesSection onBookService={handleBookService} />
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 BarberShop. All rights reserved.</p>
        </div>
      </footer>

      <BookingModal
        open={isBookingOpen}
        onOpenChange={setIsBookingOpen}
        selectedService={selectedService}
      />
    </div>
  )
}
