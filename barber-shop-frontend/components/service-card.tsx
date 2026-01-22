'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Scissors, Droplets, CircleUserRound } from 'lucide-react'

export interface Service {
  id: string
  title: string
  description: string
  icon: 'haircut' | 'wash' | 'beard'
  discount?: string
}

interface ServiceCardProps {
  service: Service
  onBook: (service: Service) => void
}

const iconMap = {
  haircut: Scissors,
  wash: Droplets,
  beard: CircleUserRound,
}

export function ServiceCard({ service, onBook }: ServiceCardProps) {
  const Icon = iconMap[service.icon]

  return (
    <Card className="relative overflow-hidden border-0 bg-card transition-transform hover:scale-[1.02]">
      {service.discount && (
        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
          {service.discount}
        </Badge>
      )}
      <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/20">
          <Icon className="size-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-card-foreground">{service.title}</h3>
          <p className="text-sm text-muted-foreground">{service.description}</p>
        </div>
        <Button 
          onClick={() => onBook(service)}
          className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Book Now
        </Button>
      </CardContent>
    </Card>
  )
}
