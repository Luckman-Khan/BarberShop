"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { toggleStatus, fetchBarberStats } from "@/lib/api"
import { LogOut, User, DollarSign, Clock, Scissors } from "lucide-react"

export default function BarberDashboard() {
    const router = useRouter()
    const [name, setName] = useState("Barber")
    const [isCheckedIn, setIsCheckedIn] = useState(false)
    const [stats, setStats] = useState({
        customers_served_today: 0,
        total_earned_today: 0,
        queue_duration_minutes: 0
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.push("/login")
            return
        }

        const username = localStorage.getItem("username")
        if (username) setName(username)

        loadDashboard()
    }, [])

    const loadDashboard = async () => {
        try {
            const data = await fetchBarberStats()
            setStats(data)
            setIsCheckedIn(data.is_checked_in)
            setName(data.name)
        } catch (error) {
            toast({ title: "Error", description: "Failed to load dashboard.", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggle = async () => {
        // Optimistic update
        const newState = !isCheckedIn
        setIsCheckedIn(newState)

        try {
            await toggleStatus()
            toast({
                title: newState ? "You are LIVE" : "You are Offline",
                description: newState ? "Ready for customers." : "No new orders.",
                className: newState ? "bg-green-50 border-green-200 text-green-800" : "bg-gray-50 border-gray-200"
            })
            // Refresh stats to confirm
            loadDashboard()
        } catch (error) {
            setIsCheckedIn(!newState) // Revert
            toast({ title: "Error", description: "Could not change status.", variant: "destructive" })
        }
    }

    const handleLogout = () => {
        localStorage.clear()
        router.push("/login")
    }

    if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>

    return (
        <div className="min-h-screen bg-background text-foreground p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Barber Portal</h1>
                    <p className="text-muted-foreground">Welcome back, {name}</p>
                </div>
                <Button variant="outline" onClick={handleLogout} className="flex gap-2">
                    <LogOut className="w-4 h-4" /> Log Out
                </Button>
            </div>

            {/* Toggle Status */}
            <Card className={isCheckedIn ? "border-green-500/50 bg-green-50/10" : "border-border"}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">Availability Status</CardTitle>
                    <Switch
                        checked={isCheckedIn}
                        onCheckedChange={handleToggle}
                        className="scale-150 data-[state=checked]:bg-green-500"
                    />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {isCheckedIn ? "Checked In" : "Checked Out"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {isCheckedIn
                            ? "You are currently accepting new walk-ins and bookings."
                            : "You are offline. Toggle this switch when you start your shift."}
                    </p>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Served Today</CardTitle>
                        <Scissors className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.customers_served_today}</div>
                        <p className="text-xs text-muted-foreground">High Fades & Trims</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">${stats.total_earned_today}</div>
                        <p className="text-xs text-muted-foreground">+ Tips (not tracked)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Queue Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.queue_duration_minutes}m</div>
                        <p className="text-xs text-muted-foreground">Until free</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
