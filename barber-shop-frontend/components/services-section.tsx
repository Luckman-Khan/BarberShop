'use client'

import { ServiceCard, type Service } from '@/components/service-card'

const services: Service[] = [
  {
    id: 'haircut',
    title: 'Haircut',
    description: 'Professional haircut tailored to your style and preferences.',
    icon: 'haircut',
  },
  {
    id: 'hairwashing',
    title: 'Hair Washing',
    description: 'Relaxing hair wash with premium shampoo and conditioning.',
    icon: 'wash',
    discount: '50% OFF',
  },
  {
    id: 'beard',
    title: 'Beard Trimming',
    description: 'Expert beard shaping and trimming for the perfect look.',
    icon: 'beard',
  },
]

interface ServicesSectionProps {
  onBookService: (service: Service) => void
}

export function ServicesSection({ onBookService }: ServicesSectionProps) {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Our Services
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Experience premium grooming services with our skilled barbers
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onBook={onBookService}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
