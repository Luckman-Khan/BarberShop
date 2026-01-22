"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/hooks/use-toast"
import { fetchAppointments, fetchBarbers, fetchStats, cancelAppointment, updateShift } from "@/lib/api"

export default function AdminPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [accessCode, setAccessCode] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    // Dashboard Data
    const [stats, setStats] = useState({ total_bookings: 0, revenue: 0, active_barbers: 0 })
    const [bookings, setBookings] = useState<any[]>([])
    const [barbers, setBarbers] = useState<any[]>([])

    // Shift Form State
    const [selectedBarberId, setSelectedBarberId] = useState<string>("")
    const [selectedWeekday, setSelectedWeekday] = useState<string>("")
    const [shiftHours, setShiftHours] = useState([9, 17]) // [Start, End]

    useEffect(() => {
        // Check if we have a token already? 
        // For now, simple "gatekeeper" logic as requested. 
        // If we wanted persistence we'd check localStorage for token.
        const token = localStorage.getItem("token")
        if (token) {
            setIsLoggedIn(true)
            fetchData()
        }
    }, [])

    const fetchData = async () => {
        try {
            const statsData = await fetchStats()
            setStats(statsData)

            const bookingsData = await fetchAppointments()
            setBookings(bookingsData)

            const barbersData = await fetchBarbers()
            setBarbers(barbersData)
        } catch (error) {
            console.error("Failed to fetch data", error)
            toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" })
        }
    }

    const handleLogin = async () => {
        setIsLoading(true)
        setError("") // Clear previous errors
        if (accessCode === "admin123") {
            // Simple Client-Side Check
            setIsLoggedIn(true)
            fetchData()
            toast({ title: "Welcome back", description: "Dashboard unlocked." })
        } else {
            setError("Invalid access code. Please try again.")
            toast({ title: "Access Denied", description: "Invalid code.", variant: "destructive" })
        }
        setIsLoading(false)
    }

    const handleLogout = () => {
        localStorage.removeItem("token")
        setIsLoggedIn(false)
        setAccessCode("")
    }

    const handleCancelBooking = async (id: number) => {
        try {
            await cancelAppointment(id)
            toast({ title: "Cancelled", description: "Appointment removed." })
            fetchData() // Refresh
        } catch (error) {
            toast({ title: "Error", description: "Could not cancel appointment.", variant: "destructive" })
        }
    }

    const handleUpdateShift = async () => {
        if (!selectedBarberId || !selectedWeekday) {
            toast({ title: "Missing Info", description: "Select a barber and day.", variant: "destructive" })
            return
        }

        try {
            await updateShift({
                barber_id: parseInt(selectedBarberId),
                weekday: parseInt(selectedWeekday),
                start_hour: shiftHours[0],
                end_hour: shiftHours[1]
            })
            toast({ title: "Shift Updated", description: "Schedule saved successfully." })
        } catch (error) {
            toast({ title: "Error", description: "Failed to save shift.", variant: "destructive" })
        }
    }

    if (!isLoggedIn) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Card className="w-[350px] border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">Shop Owner</CardTitle>
                        <CardDescription>Enter access code to manage</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Access Code"
                            value={accessCode}
                            onChange={(e) => {
                                setAccessCode(e.target.value)
                                if (error) setError("") // Clear error on typing
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        />
                        {error && (
                            <p className="text-sm text-red-500 font-medium text-center animate-in fade-in slide-in-from-top-1">
                                {error}
                            </p>
                        )}
                        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={handleLogin} disabled={isLoading}>
                            {isLoading ? "Verifying..." : "Unlock Dashboard"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-white">Shop Manager</h1>
                <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_bookings}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.revenue}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Barbers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active_barbers}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="bookings" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    <TabsTrigger value="shifts">Staff Shifts</TabsTrigger>
                </TabsList>

                {/* Bookings Tab */}
                <TabsContent value="bookings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Appointments</CardTitle>
                            <CardDescription>Manage daily bookings.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Barber</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bookings.map((booking) => (
                                        <TableRow key={booking.id}>
                                            <TableCell>{new Date(booking.time_slot).toLocaleString()}</TableCell>
                                            <TableCell>{booking.customer_name}</TableCell>
                                            <TableCell>{booking.barber_name}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleCancelBooking(booking.id)}
                                                >
                                                    Cancel
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {bookings.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                                No bookings found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Shifts Tab */}
                <TabsContent value="shifts" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Shifts</CardTitle>
                            <CardDescription>Set working hours for your staff.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Select Barber</Label>
                                    <Select onValueChange={setSelectedBarberId} value={selectedBarberId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select barber..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {barbers.map((b) => (
                                                <SelectItem key={b.id} value={b.id?.toString()}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Weekday</Label>
                                    <Select onValueChange={setSelectedWeekday} value={selectedWeekday}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select day..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Monday</SelectItem>
                                            <SelectItem value="1">Tuesday</SelectItem>
                                            <SelectItem value="2">Wednesday</SelectItem>
                                            <SelectItem value="3">Thursday</SelectItem>
                                            <SelectItem value="4">Friday</SelectItem>
                                            <SelectItem value="5">Saturday</SelectItem>
                                            <SelectItem value="6">Sunday</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4 border p-4 rounded-md">
                                <Label className="text-base">Working Hours (24h format)</Label>
                                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                                    <span>Start: {shiftHours[0]}:00</span>
                                    <span>End: {shiftHours[1]}:00</span>
                                </div>
                                <Slider
                                    value={shiftHours}
                                    min={0}
                                    max={23}
                                    step={1}
                                    minStepsBetweenThumbs={1}
                                    onValueChange={setShiftHours}
                                />
                                <p className="text-xs text-muted-foreground pt-1">Drag thumbs to set start and end time.</p>
                            </div>

                            <Button
                                className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={handleUpdateShift}
                            >
                                Update Shift
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    )
}
