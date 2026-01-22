// lib/api.ts

export const BASE_URL = "http://localhost:8000"

export async function login(formData: FormData) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) throw new Error("Auth failed")
  return res.json()
}

// --- BARBER DASHBOARD ---

export async function toggleStatus() {
  const res = await fetch(`${BASE_URL}/barber/toggle-status`, {
    method: "POST",
    headers: { ...getAuthHeaders() }
  })
  if (!res.ok) throw new Error("Failed to toggle status")
  return res.json()
}

export async function fetchBarberStats() {
  const res = await fetch(`${BASE_URL}/barber/dashboard-stats`, {
    headers: { ...getAuthHeaders() }
  })
  if (!res.ok) throw new Error("Failed to fetch stats")
  return res.json()
}

// --- Interfaces ---

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

// Added for Admin Dashboard
export interface Appointment {
  id: number
  barber_id: number
  barber_name: string
  customer_name: string
  time_slot: string // ISO string or "2024-01-20 10:00"
}

// Added for Shift Management
export interface ShiftPayload {
  barber_id: number
  weekday: number
  start_hour: number
  end_hour: number
}

// --- PUBLIC FUNCTIONS (Customer) ---

export async function fetchBarbers(): Promise<Barber[]> {
  const response = await fetch(`${BASE_URL}/barbers`)
  if (!response.ok) throw new Error('Failed to fetch barbers')
  return response.json()
}

export async function fetchSlots(barberId: number, date: string): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/slots?barber_id=${barberId}&date=${date}`)
  if (!response.ok) throw new Error('Failed to fetch slots')
  return response.json()
}

export async function submitBooking(payload: BookingPayload): Promise<{ success: boolean; message: string }> {
  try {
    // UPDATED: Sending as JSON body is cleaner than query parameters
    const response = await fetch(`${BASE_URL}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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

// Helper to get auth headers
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token")
  return token ? { "Authorization": `Bearer ${token}` } : {}
}

// --- ADMIN FUNCTIONS (New) ---

export async function fetchAppointments(): Promise<Appointment[]> {
  const res = await fetch(`${BASE_URL}/appointments`, { // Endpoint was /appointments not /admin/appointments
    headers: { ...getAuthHeaders() }
  })
  if (!res.ok) throw new Error("Failed to fetch appointments")
  return res.json()
}

export async function cancelAppointment(appointmentId: number) {
  const res = await fetch(`${BASE_URL}/appointments/${appointmentId}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() }
  })
  if (!res.ok) throw new Error("Failed to cancel appointment")
  return res.json()
}

export async function updateShift(payload: ShiftPayload) {
  const res = await fetch(`${BASE_URL}/shifts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Failed to update shift")
  return res.json()
}

export async function fetchStats() {
  const res = await fetch(`${BASE_URL}/admin/stats`, {
    headers: { ...getAuthHeaders() }
  })
  if (!res.ok) throw new Error("Failed to fetch stats")
  return res.json()
}