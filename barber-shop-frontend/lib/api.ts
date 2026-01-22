// API Helper Functions
// Replace these mock implementations with your actual FastAPI endpoints

export interface Barber {
  id: number
  name: string
  photo_url: string
}

export interface BookingPayload {
  barber_id: number
  customer_name: string
  time: string
  date: string
  service_type?: string
}

const BASE_URL = "http://127.0.0.1:8000"

/**
 * Fetch all available barbers
 */
export async function fetchBarbers(): Promise<Barber[]> {
  const response = await fetch(`${BASE_URL}/barbers`)
  if (!response.ok) {
    throw new Error('Failed to fetch barbers')
  }
  return response.json()
}

/**
 * Fetch available time slots for a barber on a specific date
 */
export async function fetchSlots(barberId: number, date: string): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/slots?barber_id=${barberId}&date=${date}`)
  if (!response.ok) {
    throw new Error('Failed to fetch slots')
  }
  return response.json()
}

/**
 * Submit a booking
 */
export async function submitBooking(payload: BookingPayload): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${BASE_URL}/book?barber_id=${payload.barber_id}&date=${payload.date}&time=${payload.time}&name=${payload.customer_name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.ok) {
      return { success: true, message: 'Booking confirmed!' }
    } else {
      const err = await response.json()
      return { success: false, message: err.detail || 'Booking failed' }
    }
  } catch (error) {
    console.error(error)
    return { success: false, message: 'Network error' }
  }
}
