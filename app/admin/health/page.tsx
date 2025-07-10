"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Heart, Activity, Database, Server, Wifi, HardDrive, Cpu, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

interface SystemHealth {
  status: "healthy" | "warning" | "critical"
  uptime: string
  cpu: number
  memory: number
  disk: number
  database: "connected" | "disconnected" | "slow"
  api: "operational" | "degraded" | "down"
  email: "active" | "inactive" | "error"
}

export default function HealthPage() {
  const [health, setHealth] = useState<SystemHealth>({
    status: "healthy",
    uptime: "99.9%",
    cpu: 45,
    memory: 62,
    disk: 78,
    database: "connected",
    api: "operational",
    email: "active",
  })
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const refreshHealth = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simulate some random health data
    setHealth({
      status: Math.random() > 0.8 ? "warning" : "healthy",
      uptime: `${(99 + Math.random()).toFixed(1)}%`,
      cpu: Math.floor(Math.random() * 80) + 20,
      memory: Math.floor(Math.random() * 70) + 30,
      disk: Math.floor(Math.random() * 60) + 40,
      database: Math.random() > 0.9 ? "slow" : "connected",
      api: Math.random() > 0.95 ? "degraded" : "operational",
      email: Math.random() > 0.98 ? "error" : "active",
    })

    setLastUpdated(new Date())
    setLoading(false)
  }

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "operational":
      case "active":
        return "default"
      case "warning":
      case "slow":
      case "degraded":
        return "secondary"
      case "critical":
      case "disconnected":
      case "down":
      case "inactive":
      case "error":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getProgressColor = (value: number) => {
    if (value < 50) return "bg-green-500"
    if (value < 80) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Health</h2>
          <p className="text-muted-foreground">Monitor system performance and service status</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <Button variant="outline" size="sm" onClick={refreshHealth} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Overall System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-full ${
                  health.status === "healthy"
                    ? "bg-green-100 text-green-600"
                    : health.status === "warning"
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-red-100 text-red-600"
                }`}
              >
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold capitalize">{health.status}</h3>
                <p className="text-sm text-muted-foreground">
                  All systems {health.status === "healthy" ? "operational" : "require attention"}
                </p>
              </div>
            </div>
            <Badge variant={getStatusColor(health.status)} className="text-sm px-3 py-1">
              {health.status.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Service Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold capitalize">{health.database}</div>
              <Badge variant={getStatusColor(health.database)}>{health.database}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Connection status</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Services</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold capitalize">{health.api}</div>
              <Badge variant={getStatusColor(health.api)}>{health.api}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">API endpoint status</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Service</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold capitalize">{health.email}</div>
              <Badge variant={getStatusColor(health.email)}>{health.email}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Email delivery status</p>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resource Usage</CardTitle>
            <CardDescription>Current system resource utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <span className="text-sm font-bold">{health.cpu}%</span>
              </div>
              <Progress value={health.cpu} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <span className="text-sm font-bold">{health.memory}%</span>
              </div>
              <Progress value={health.memory} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Disk Usage</span>
                </div>
                <span className="text-sm font-bold">{health.disk}%</span>
              </div>
              <Progress value={health.disk} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Key system metrics and information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">System Uptime</span>
              <span className="text-sm font-bold">{health.uptime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Active Users</span>
              <span className="text-sm font-bold">12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Requests (24h)</span>
              <span className="text-sm font-bold">1,247</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average Response Time</span>
              <span className="text-sm font-bold">145ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Error Rate (24h)</span>
              <span className="text-sm font-bold">0.02%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Last Backup</span>
              <span className="text-sm font-bold">2 hours ago</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Events</CardTitle>
          <CardDescription>Latest system activities and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: "2 minutes ago", event: "System health check completed", status: "info" },
              { time: "15 minutes ago", event: "Database backup completed successfully", status: "success" },
              { time: "1 hour ago", event: "High memory usage detected (85%)", status: "warning" },
              { time: "2 hours ago", event: "Email service restarted", status: "info" },
              { time: "4 hours ago", event: "System update applied", status: "success" },
            ].map((event, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div
                  className={`w-2 h-2 rounded-full ${
                    event.status === "success"
                      ? "bg-green-500"
                      : event.status === "warning"
                        ? "bg-yellow-500"
                        : event.status === "error"
                          ? "bg-red-500"
                          : "bg-blue-500"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{event.event}</p>
                  <p className="text-xs text-muted-foreground">{event.time}</p>
                </div>
                <Badge
                  variant={
                    event.status === "success"
                      ? "default"
                      : event.status === "warning"
                        ? "secondary"
                        : event.status === "error"
                          ? "destructive"
                          : "outline"
                  }
                >
                  {event.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
