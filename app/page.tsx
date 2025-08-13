import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Building, 
  Calendar, 
  Users, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  LayoutDashboard, 
  Clock, 
  Gift, 
  Briefcase,
  Building2,
  Map,
  Zap,
  LineChart,
  Layers
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { MainLayout } from "@/components/main-layout"

export default function HomePage() {
  return (
    <MainLayout fullWidth>
      {/* Hero Section with brand-aligned gradient background */}
      <section className="relative pb-24 overflow-hidden bg-gradient-to-br from-brand-navy-50 via-brand-navy-100 to-brand-teal-50 dark:from-brand-navy-900 dark:via-brand-navy-800 dark:to-brand-teal-900 transition-colors duration-500">
        <div className="absolute inset-0 animate-gradient-slow bg-gradient-to-br from-brand-navy-100 via-brand-teal-100 to-brand-navy-50 dark:from-brand-navy-800 dark:via-brand-teal-900 dark:to-brand-navy-900 opacity-80"></div>
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 pt-28 pb-32 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow">
                <span className="flex h-2 w-2 rounded-full bg-brand-teal-500 mr-2"></span>
                <span className="text-brand-navy-700 dark:text-brand-teal-300">Streamlined Room Booking Solution</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-brand-navy-700 via-brand-navy-800 to-brand-teal-600 dark:from-brand-navy-300 dark:via-brand-navy-200 dark:to-brand-teal-400 text-transparent bg-clip-text">
                Effortless Room Booking <br />for <span className="inline-block">Your Organization</span>
              </h1>
              <p className="text-xl text-brand-navy-800 dark:text-brand-navy-100 max-w-xl leading-relaxed">
                Conference Hub empowers your organization with a <span className="font-semibold text-brand-teal-600 dark:text-brand-teal-400">simple, intuitive platform</span> to book rooms, allocate resources, and optimize your workspace efficiently.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-brand-navy-600 to-brand-teal-500 hover:from-brand-navy-700 hover:to-brand-teal-600 text-white font-semibold py-6 px-8 rounded-xl shadow-lg shadow-brand-navy-400/20 hover:shadow-brand-teal-400/30 transition-all duration-300">
                  <Link href="/signup">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  <div className="w-8 h-8 rounded-full bg-brand-navy-200 dark:bg-brand-navy-800 flex items-center justify-center border-2 border-background">
                    <Building2 className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-300" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-teal-200 dark:bg-brand-teal-800 flex items-center justify-center border-2 border-background">
                    <Users className="h-4 w-4 text-brand-teal-600 dark:text-brand-teal-300" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-brand-navy-200 dark:bg-brand-navy-800 flex items-center justify-center border-2 border-background">
                    <Calendar className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-300" />
                  </div>
                </div>
                <span className="text-sm text-brand-navy-800 dark:text-brand-navy-100">Trusted by <span className="font-medium text-foreground">500+</span> organizations</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-navy-200 via-brand-teal-200 to-brand-navy-100 dark:from-brand-navy-800 dark:via-brand-teal-900 dark:to-brand-navy-900 rounded-2xl blur-xl opacity-70"></div>
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-brand-navy-100 dark:border-brand-navy-800">
                <Image 
                  src="/room-business-meeting.jpg" 
                  alt="Modern Conference Room" 
                  width={600} 
                  height={400}
                  className="w-full object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-100/80 via-transparent to-transparent dark:from-brand-navy-900/80"></div>
                {/* Floating UI elements for visual interest */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg p-4 border border-brand-navy-100 dark:border-brand-navy-800 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-teal-100 dark:bg-brand-teal-900 rounded-full">
                        <Calendar className="h-5 w-5 text-brand-teal-600 dark:text-brand-teal-300" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-100">Conference Room A</h4>
                        <p className="text-xs text-brand-navy-700 dark:text-brand-navy-300">Today, 2:00 PM - 3:30 PM</p>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" className="bg-brand-teal-500 hover:bg-brand-teal-600 text-white">View</Button>
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-900 rounded-lg p-3 shadow-lg border border-brand-navy-100 dark:border-brand-navy-800 rotate-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-300" />
                  <span className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-100">Easy Booking</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-900 rounded-lg p-3 shadow-lg border border-brand-navy-100 dark:border-brand-navy-800 -rotate-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-teal-600 dark:text-brand-teal-300" />
                  <span className="text-sm font-medium text-brand-teal-700 dark:text-brand-teal-200">Team Collaboration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Trusted by logos section */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="border-t border-brand-navy-200 dark:border-brand-navy-800 pt-12">
            <p className="text-center text-sm text-brand-navy-800 dark:text-brand-navy-200 mb-8">TRUSTED BY INNOVATIVE COMPANIES</p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 opacity-80">
              {/* Replace with actual logos */}
              <div className="h-8 w-28 bg-brand-navy-100 dark:bg-brand-navy-800 rounded flex items-center justify-center">
                <span className="text-xs text-brand-navy-700 dark:text-brand-navy-200 font-medium">ACME Corp</span>
              </div>
              <div className="h-8 w-28 bg-brand-teal-100 dark:bg-brand-teal-900 rounded flex items-center justify-center">
                <span className="text-xs text-brand-teal-700 dark:text-brand-teal-200 font-medium">TechGiant</span>
              </div>
              <div className="h-8 w-28 bg-brand-navy-100 dark:bg-brand-navy-800 rounded flex items-center justify-center">
                <span className="text-xs text-brand-navy-700 dark:text-brand-navy-200 font-medium">Innovate Inc</span>
              </div>
              <div className="h-8 w-28 bg-brand-teal-100 dark:bg-brand-teal-900 rounded flex items-center justify-center">
                <span className="text-xs text-brand-teal-700 dark:text-brand-teal-200 font-medium">FutureCo</span>
              </div>
              <div className="h-8 w-28 bg-brand-navy-100 dark:bg-brand-navy-800 rounded flex items-center justify-center">
                <span className="text-xs text-brand-navy-700 dark:text-brand-navy-200 font-medium">NextLevel</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-24 bg-brand-navy-50/30 dark:bg-brand-navy-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy-900 dark:text-brand-navy-50 mb-4 tracking-tight">
              Optimize Your Workspace Management
            </h2>
            <p className="text-lg text-brand-navy-700 dark:text-brand-navy-300 max-w-2xl mx-auto">
              Conference Hub provides a complete solution for managing meeting spaces and resources, eliminating common booking headaches.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-300 hover:border-brand-teal-400/50">
              <CardHeader className="pb-4">
                <div className="p-3 bg-brand-teal-100 dark:bg-brand-teal-900/50 rounded-full w-fit mb-4">
                  <Clock className="h-6 w-6 text-brand-teal-600 dark:text-brand-teal-400" />
                </div>
                <CardTitle className="text-xl text-brand-navy-900 dark:text-brand-navy-50">Eliminate Scheduling Conflicts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brand-navy-700 dark:text-brand-navy-300">
                  Real-time availability updates and intelligent booking system prevent double-bookings and scheduling headaches.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-300 hover:border-brand-teal-400/50">
              <CardHeader className="pb-4">
                <div className="p-3 bg-brand-teal-100 dark:bg-brand-teal-900/50 rounded-full w-fit mb-4">
                  <Zap className="h-6 w-6 text-brand-teal-600 dark:text-brand-teal-400" />
                </div>
                <CardTitle className="text-xl text-brand-navy-900 dark:text-brand-navy-50">Boost Team Productivity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brand-navy-700 dark:text-brand-navy-300">
                  Find and book the perfect space with all required resources in seconds, not minutes or hours.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-all duration-300 hover:border-brand-teal-400/50">
              <CardHeader className="pb-4">
                <div className="p-3 bg-brand-teal-100 dark:bg-brand-teal-900/50 rounded-full w-fit mb-4">
                  <LineChart className="h-6 w-6 text-brand-teal-600 dark:text-brand-teal-400" />
                </div>
                <CardTitle className="text-xl text-brand-navy-900 dark:text-brand-navy-50">Optimize Resource Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-brand-navy-700 dark:text-brand-navy-300">
                  Track usage patterns and make data-driven decisions about your workspace resources and requirements.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section with tabs */}
      <section className="py-24 bg-white dark:bg-brand-navy-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy-900 dark:text-brand-navy-50 mb-4 tracking-tight">
              Powerful Features for Every Role
            </h2>
            <p className="text-lg text-brand-navy-700 dark:text-brand-navy-300 max-w-2xl mx-auto">
              Conference Hub provides tailored experiences for team members, facility managers, and administrators.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="space-y-8">
                <div className="bg-brand-navy-50/40 dark:bg-brand-navy-800/40 p-6 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700">
                  <div className="flex gap-4 mb-3">
                    <div className="p-2 bg-brand-teal-100 dark:bg-brand-teal-900/50 rounded-lg">
                      <Calendar className="h-5 w-5 text-brand-teal-600 dark:text-brand-teal-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-brand-navy-900 dark:text-brand-navy-50">Intelligent Booking System</h3>
                  </div>
                  <p className="text-brand-navy-700 dark:text-brand-navy-300 pl-11">
                    Find and book available rooms based on capacity, resources, and time requirements with our smart filtering system.
                  </p>
                </div>
                
                <div className="bg-brand-navy-50/40 dark:bg-brand-navy-800/40 p-6 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700">
                  <div className="flex gap-4 mb-3">
                    <div className="p-2 bg-brand-teal-100 dark:bg-brand-teal-900/50 rounded-lg">
                      <Briefcase className="h-5 w-5 text-brand-teal-600 dark:text-brand-teal-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-brand-navy-900 dark:text-brand-navy-50">Centralized Management</h3>
                  </div>
                  <p className="text-brand-navy-700 dark:text-brand-navy-300 pl-11">
                    Manage all your organization's rooms and resources efficiently from a single, intuitive dashboard.
                  </p>
                </div>
                
                <div className="bg-brand-navy-50/40 dark:bg-brand-navy-800/40 p-6 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700">
                  <div className="flex gap-4 mb-3">
                    <div className="p-2 bg-brand-teal-100 dark:bg-brand-teal-900/50 rounded-lg">
                      <Users className="h-5 w-5 text-brand-teal-600 dark:text-brand-teal-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-brand-navy-900 dark:text-brand-navy-50">Role-Based Access Control</h3>
                  </div>
                  <p className="text-brand-navy-700 dark:text-brand-navy-300 pl-11">
                    Separate interfaces and permissions for regular users, facility managers, and administrators.
                  </p>
                </div>
                
                <div className="bg-brand-navy-50/40 dark:bg-brand-navy-800/40 p-6 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700">
                  <div className="flex gap-4 mb-3">
                    <div className="p-2 bg-brand-teal-100 dark:bg-brand-teal-900/50 rounded-lg">
                      <Layers className="h-5 w-5 text-brand-teal-600 dark:text-brand-teal-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-brand-navy-900 dark:text-brand-navy-50">Resource Management</h3>
                  </div>
                  <p className="text-brand-navy-700 dark:text-brand-navy-300 pl-11">
                    Track and allocate resources like projectors, whiteboards, and video conferencing equipment to ensure every meeting has what it needs.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-navy-300 to-brand-teal-300 dark:from-brand-navy-700 dark:to-brand-teal-700 rounded-2xl blur-xl opacity-70"></div>
                <div className="relative bg-white dark:bg-brand-navy-800 rounded-2xl overflow-hidden shadow-2xl border border-brand-navy-200 dark:border-brand-navy-700">
                  <Image 
                    src="/placeholder.jpg" 
                    alt="Conference Hub Features" 
                    width={600} 
                    height={500}
                    className="w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/30 to-transparent dark:from-brand-navy-900/90 dark:via-brand-navy-900/30"></div>
                  
                  {/* Feature showcase overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md p-3 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-brand-teal-600 dark:text-brand-teal-400" />
                          <span className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-100">Smart Booking</span>
                        </div>
                      </div>
                      <div className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md p-3 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-brand-teal-600 dark:text-brand-teal-400" />
                          <span className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-100">Resource Tracking</span>
                        </div>
                      </div>
                      <div className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md p-3 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-brand-teal-600 dark:text-brand-teal-400" />
                          <span className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-100">Role-Based Access</span>
                        </div>
                      </div>
                      <div className="bg-white/80 dark:bg-brand-navy-800/80 backdrop-blur-md p-3 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700">
                        <div className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4 text-brand-teal-600 dark:text-brand-teal-400" />
                          <span className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-100">Admin Dashboard</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-24 bg-brand-navy-50/30 dark:bg-brand-navy-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy-900 dark:text-brand-navy-50 mb-4 tracking-tight">
              Tailored for Every Team Member
            </h2>
            <p className="text-lg text-brand-navy-700 dark:text-brand-navy-300 max-w-2xl mx-auto">
              Conference Hub provides specialized interfaces for different roles in your organization.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-lg transition-all duration-300 hover:border-brand-teal-400/50 overflow-hidden">
              <div className="h-2 bg-brand-teal-500 w-full"></div>
              <CardHeader>
                <div className="p-3 bg-brand-teal-100 dark:bg-brand-teal-900/30 rounded-full w-fit mb-4">
                  <Users className="h-6 w-6 text-brand-teal-600 dark:text-brand-teal-400" />
                </div>
                <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">For Team Members</CardTitle>
                <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">Quick and easy room booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-brand-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-brand-navy-800 dark:text-brand-navy-200">Find and book available rooms in seconds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-brand-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-brand-navy-800 dark:text-brand-navy-200">Filter by capacity, resources, and time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-brand-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-brand-navy-800 dark:text-brand-navy-200">Manage your bookings in one place</span>
                  </li>
                </ul>
                
                <Button asChild className="w-full bg-brand-teal-500 hover:bg-brand-teal-600 text-white">
                  <Link href="/user-login">
                    Team Member Login
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-lg transition-all duration-300 hover:border-amber-400/50 overflow-hidden">
              <div className="h-2 bg-amber-500 w-full"></div>
              <CardHeader>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full w-fit mb-4">
                  <Building className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">For Facility Managers</CardTitle>
                <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">Manage spaces and resources</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-brand-navy-800 dark:text-brand-navy-200">Oversee rooms and resources</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-brand-navy-800 dark:text-brand-navy-200">Manage booking requests and approvals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-brand-navy-800 dark:text-brand-navy-200">View reports and usage analytics</span>
                  </li>
                </ul>
                
                <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                  <Link href="/login">
                    Facility Manager Login
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-lg transition-all duration-300 hover:border-brand-navy-400/50 overflow-hidden">
              <div className="h-2 bg-brand-navy-500 w-full"></div>
              <CardHeader>
                <div className="p-3 bg-brand-navy-100 dark:bg-brand-navy-700/50 rounded-full w-fit mb-4">
                  <Shield className="h-6 w-6 text-brand-navy-600 dark:text-brand-navy-400" />
                </div>
                <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">For Administrators</CardTitle>
                <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">Complete system control</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-brand-navy-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-brand-navy-800 dark:text-brand-navy-200">Manage all rooms and resources</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-brand-navy-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-brand-navy-800 dark:text-brand-navy-200">Configure system settings and user permissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-brand-navy-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-brand-navy-800 dark:text-brand-navy-200">Access comprehensive analytics and reports</span>
                  </li>
                </ul>
                
                <Button asChild className="w-full bg-brand-navy-600 hover:bg-brand-navy-700 text-white">
                  <Link href="/login">
                    Administrator Login
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white dark:bg-brand-navy-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy-900 dark:text-brand-navy-50 mb-4 tracking-tight">
              Trusted by Organizations Worldwide
            </h2>
            <p className="text-lg text-brand-navy-700 dark:text-brand-navy-300 max-w-2xl mx-auto">
              See how Conference Hub has transformed workspace management for companies of all sizes.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-brand-navy-50/30 dark:bg-brand-navy-800/30 p-6 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-teal-100 dark:bg-brand-teal-900/50 flex items-center justify-center">
                  <span className="font-semibold text-brand-teal-600 dark:text-brand-teal-400">AC</span>
                </div>
                <div>
                  <h4 className="font-medium text-brand-navy-900 dark:text-brand-navy-50">Alex Chen</h4>
                  <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Facilities Director, TechCorp</p>
                </div>
              </div>
              <p className="text-brand-navy-700 dark:text-brand-navy-300">
                "Conference Hub has eliminated double bookings and reduced our administrative workload by 70%. The smart booking system is exactly what we needed."
              </p>
            </div>
            
            <div className="bg-brand-navy-50/30 dark:bg-brand-navy-800/30 p-6 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-teal-100 dark:bg-brand-teal-900/50 flex items-center justify-center">
                  <span className="font-semibold text-brand-teal-600 dark:text-brand-teal-400">SJ</span>
                </div>
                <div>
                  <h4 className="font-medium text-brand-navy-900 dark:text-brand-navy-50">Sarah Johnson</h4>
                  <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Office Manager, Innovate Inc</p>
                </div>
              </div>
              <p className="text-brand-navy-700 dark:text-brand-navy-300">
                "The resource management system is a game-changer. We can now ensure every meeting has the right equipment without any conflicts or manual tracking."
              </p>
            </div>
            
            <div className="bg-brand-navy-50/30 dark:bg-brand-navy-800/30 p-6 rounded-xl border border-brand-navy-200 dark:border-brand-navy-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-teal-100 dark:bg-brand-teal-900/50 flex items-center justify-center">
                  <span className="font-semibold text-brand-teal-600 dark:text-brand-teal-400">MR</span>
                </div>
                <div>
                  <h4 className="font-medium text-brand-navy-900 dark:text-brand-navy-50">Michael Rodriguez</h4>
                  <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">CTO, Enterprise Solutions</p>
                </div>
              </div>
              <p className="text-brand-navy-700 dark:text-brand-navy-300">
                "The analytics provided by Conference Hub helped us optimize our office space, resulting in significant cost savings and improved employee satisfaction."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-brand-navy-50/30 dark:bg-brand-navy-900/30">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-200 via-white to-brand-teal-100 dark:from-brand-navy-800 dark:via-brand-navy-900 dark:to-brand-teal-900"></div>
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
            
            <div className="relative z-10 py-16 px-8 md:px-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight text-brand-navy-900 dark:text-brand-navy-50">
                Ready to Transform Your Workspace Management?
              </h2>
              <p className="text-lg text-brand-navy-700 dark:text-brand-navy-300 mb-10 max-w-2xl mx-auto">
                Join hundreds of organizations already using Conference Hub to streamline their room booking and resource management.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-brand-teal-500 hover:bg-brand-teal-600 text-white font-semibold py-6 px-8 rounded-xl shadow-lg shadow-brand-teal-500/20 transition-all duration-300">
                  <Link href="/signup">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-2 border-brand-navy-300 dark:border-brand-navy-600 hover:border-brand-teal-500 text-brand-navy-900 dark:text-brand-navy-100 transition-all duration-300">
                  <Link href="#">Request a Demo</Link>
                </Button>
              </div>
              
              <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300 mt-6">
                No credit card required • Free 30-day trial • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
