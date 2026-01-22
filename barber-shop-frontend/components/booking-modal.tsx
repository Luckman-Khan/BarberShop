'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import { fetchBarbers, fetchSlots, submitBooking, type Barber, type BookingPayload } from '@/lib/api'
import { format } from 'date-fns'
import { CheckCircle2 } from 'lucide-react'
import type { Service } from '@/components/service-card'

interface BookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedService?: Service | null
}

export function BookingModal({ open, onOpenChange, selectedService }: BookingModalProps) {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  // Fetch barbers when modal opens
  useEffect(() => {
    if (open) {
      setIsLoadingBarbers(true)
      fetchBarbers()
        .then(setBarbers)
        .finally(() => setIsLoadingBarbers(false))
    } else {
      // Reset state when modal closes
      setSelectedBarber(null)
      setSelectedDate(undefined)
      setAvailableSlots([])
      setSelectedSlot(null)
      setCustomerName('')
      setBookingSuccess(false)
    }
  }, [open])

  // Fetch available slots when barber and date are selected
  useEffect(() => {
    if (selectedBarber && selectedDate) {
      setIsLoadingSlots(true)
      setSelectedSlot(null)
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      fetchSlots(selectedBarber.id, dateStr)
        .then(setAvailableSlots)
        .finally(() => setIsLoadingSlots(false))
    }
  }, [selectedBarber, selectedDate])

  const handleSubmit = async () => {
    if (!selectedBarber || !selectedDate || !selectedSlot || !customerName.trim()) return

    const payload: BookingPayload = {
      barber_id: selectedBarber.id,
      customer_name: customerName.trim(),
      time: selectedSlot,
      date: format(selectedDate, 'yyyy-MM-dd'),
      service_type: selectedService?.id,
    }

    setIsSubmitting(true)
    const result = await submitBooking(payload)
    setIsSubmitting(false)

    if (result.success) {
      setBookingSuccess(true)
    }
  }

  const canSubmit = selectedBarber && selectedDate && selectedSlot && customerName.trim()

  if (bookingSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md border-border bg-card text-card-foreground">
          <div className="flex flex-col items-center gap-6 py-8 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 className="size-10 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
              <p className="text-muted-foreground">
                Your appointment with {selectedBarber?.name} on{' '}
                {selectedDate && format(selectedDate, 'MMMM d, yyyy')} at {selectedSlot} has been confirmed.
              </p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl">Book an Appointment</DialogTitle>
          <DialogDescription>
            {selectedService
              ? `Book your ${selectedService.title.toLowerCase()} appointment`
              : 'Select a barber, date, and time for your visit'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Select Barber */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Barber</Label>
            {isLoadingBarbers ? (
              <div className="flex items-center justify-center py-4">
                <Spinner className="size-6" />
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {barbers.map((barber) => (
                  <button
                    key={barber.id}
                    type="button"
                    onClick={() => setSelectedBarber(barber)}
                    className={`flex flex-col items-center gap-2 rounded-lg p-3 transition-colors ${
                      selectedBarber?.id === barber.id
                        ? 'bg-primary/20 ring-2 ring-primary'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    <Avatar className="size-16">
                      <AvatarImage src={barber.photo_url || "/placeholder.svg"} alt={barber.name} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {barber.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="whitespace-nowrap text-sm font-medium">{barber.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Select Date */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Date</Label>
            <div className="flex justify-center rounded-lg bg-secondary p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0}
                className="rounded-md"
              />
            </div>
          </div>

          {/* Step 3: Select Time Slot */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Available Time Slots</Label>
            {!selectedBarber || !selectedDate ? (
              <p className="text-sm text-muted-foreground">
                Please select a barber and date first
              </p>
            ) : isLoadingSlots ? (
              <div className="flex items-center justify-center py-4">
                <Spinner className="size-6" />
              </div>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No slots available for this date</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availableSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedSlot === slot ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSlot(slot)}
                    className={
                      selectedSlot === slot
                        ? 'bg-primary text-primary-foreground'
                        : 'border-border bg-transparent text-foreground hover:bg-primary/20 hover:text-primary'
                    }
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Step 4: Customer Name */}
          <div className="space-y-3">
            <Label htmlFor="customerName" className="text-sm font-medium">
              Your Name
            </Label>
            <Input
              id="customerName"
              placeholder="Enter your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 size-4" />
                Booking...
              </>
            ) : (
              'Confirm Booking'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
