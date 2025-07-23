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
      {/* Hero Section with vibrant gradient background and multi-facility emphasis */}
      <section className="relative pb-24 overflow-hidden bg-gradient-to-br from-blue-50 via-violet-100 to-emerald-50 dark:from-blue-950 dark:via-violet-950 dark:to-emerald-950 transition-colors duration-500">
        <div className="absolute inset-0 animate-gradient-slow bg-gradient-to-br from-blue-200 via-violet-200 to-emerald-100 dark:from-blue-900 dark:via-violet-900 dark:to-emerald-900 opacity-80"></div>
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 pt-28 pb-32 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
                <span className="text-blue-700 dark:text-blue-300">Now with Multi-Facility Management</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-blue-700 via-violet-600 to-emerald-600 dark:from-blue-300 dark:via-violet-400 dark:to-emerald-400 text-transparent bg-clip-text">
                Effortless Room Booking <br />for <span className="inline-block">Every Facility</span>
              </h1>
              <p className="text-xl text-blue-900 dark:text-blue-100 max-w-xl leading-relaxed">
                Conference Hub empowers organizations to manage <span className="font-semibold text-emerald-600 dark:text-emerald-400">multiple buildings, campuses, and locations</span>—all from a single, intuitive platform. Book rooms, allocate resources, and optimize every space, everywhere.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 via-violet-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white font-semibold py-6 px-8 rounded-xl shadow-lg shadow-blue-400/20 hover:shadow-violet-400/30 transition-all duration-300">
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-2 border-blue-400 dark:border-blue-600 hover:border-violet-500 text-blue-900 dark:text-blue-100 transition-all duration-300">
                  <Link href="/user-login">Sign In</Link>
                </Button>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center border-2 border-background">
                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center border-2 border-background">
                    <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-violet-200 dark:bg-violet-800 flex items-center justify-center border-2 border-background">
                    <Building2 className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                  </div>
                </div>
                <span className="text-sm text-blue-900 dark:text-blue-100">Trusted by <span className="font-medium text-foreground">500+</span> organizations</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-200 via-violet-200 to-emerald-100 dark:from-blue-900 dark:via-violet-900 dark:to-emerald-900 rounded-2xl blur-xl opacity-70"></div>
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-blue-100 dark:border-blue-900">
                <Image 
                  src="/placeholder.jpg" 
                  alt="Conference Hub Multi-Facility Dashboard" 
                  width={600} 
                  height={400}
                  className="w-full object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-100/80 via-transparent to-transparent dark:from-blue-900/80"></div>
                {/* Floating UI elements for visual interest */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg p-4 border border-blue-100 dark:border-blue-900 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <Map className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Facility: Downtown HQ</h4>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Today, 2:00 PM - 3:30 PM</p>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary">View</Button>
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-900 rounded-lg p-3 shadow-lg border border-blue-100 dark:border-blue-900 rotate-3">
                <div className="flex items-center gap-2">
                  <Map className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Multi-Facility</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-900 rounded-lg p-3 shadow-lg border border-blue-100 dark:border-blue-900 -rotate-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-200">Team Collaboration</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Trusted by logos section */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="border-t border-blue-200 dark:border-blue-900 pt-12">
            <p className="text-center text-sm text-blue-900 dark:text-blue-100 mb-8">TRUSTED BY INNOVATIVE COMPANIES</p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 opacity-80">
              {/* Replace with actual logos */}
              <div className="h-8 w-28 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                <span className="text-xs text-blue-700 dark:text-blue-200 font-medium">ACME Corp</span>
              </div>
              <div className="h-8 w-28 bg-violet-100 dark:bg-violet-900 rounded flex items-center justify-center">
                <span className="text-xs text-violet-700 dark:text-violet-200 font-medium">TechGiant</span>
              </div>
              <div className="h-8 w-28 bg-emerald-100 dark:bg-emerald-900 rounded flex items-center justify-center">
                <span className="text-xs text-emerald-700 dark:text-emerald-200 font-medium">Innovate Inc</span>
              </div>
              <div className="h-8 w-28 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                <span className="text-xs text-blue-700 dark:text-blue-200 font-medium">FutureCo</span>
              </div>
              <div className="h-8 w-28 bg-violet-100 dark:bg-violet-900 rounded flex items-center justify-center">
                <span className="text-xs text-violet-700 dark:text-violet-200 font-medium">NextLevel</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Optimize Your Workspace Management
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conference Hub provides a complete solution for managing meeting spaces and resources, eliminating common booking headaches.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border bg-background hover:shadow-md transition-all duration-300 hover:border-primary/20">
              <CardHeader className="pb-4">
                <div className="p-3 bg-primary/10 rounded-full w-fit mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Eliminate Scheduling Conflicts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Real-time availability updates and intelligent booking system prevent double-bookings and scheduling headaches.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-background hover:shadow-md transition-all duration-300 hover:border-primary/20">
              <CardHeader className="pb-4">
                <div className="p-3 bg-primary/10 rounded-full w-fit mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Boost Team Productivity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Find and book the perfect space with all required resources in seconds, not minutes or hours.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-background hover:shadow-md transition-all duration-300 hover:border-primary/20">
              <CardHeader className="pb-4">
                <div className="p-3 bg-primary/10 rounded-full w-fit mb-4">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Optimize Resource Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track usage patterns and make data-driven decisions about your workspace resources and requirements.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section with tabs */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Powerful Features for Every Role
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conference Hub provides tailored experiences for team members, facility managers, and administrators.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="space-y-8">
                <div className="bg-muted/40 p-6 rounded-xl border border-border">
                  <div className="flex gap-4 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Intelligent Booking System</h3>
                  </div>
                  <p className="text-muted-foreground pl-11">
                    Find and book available rooms based on capacity, resources, and time requirements with our smart filtering system.
                  </p>
                </div>
                
                <div className="bg-muted/40 p-6 rounded-xl border border-border">
                  <div className="flex gap-4 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Multi-Facility Management</h3>
                  </div>
                  <p className="text-muted-foreground pl-11">
                    Manage rooms across multiple facilities with location-based filtering and facility-specific resource allocation.
                  </p>
                </div>
                
                <div className="bg-muted/40 p-6 rounded-xl border border-border">
                  <div className="flex gap-4 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Role-Based Access Control</h3>
                  </div>
                  <p className="text-muted-foreground pl-11">
                    Separate interfaces and permissions for regular users, facility managers, and administrators.
                  </p>
                </div>
                
                <div className="bg-muted/40 p-6 rounded-xl border border-border">
                  <div className="flex gap-4 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Layers className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Resource Management</h3>
                  </div>
                  <p className="text-muted-foreground pl-11">
                    Track and allocate resources like projectors, whiteboards, and video conferencing equipment to ensure every meeting has what it needs.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-70"></div>
                <div className="relative bg-card rounded-2xl overflow-hidden shadow-2xl border border-muted">
                  <Image 
                    src="/placeholder.jpg" 
                    alt="Conference Hub Features" 
                    width={600} 
                    height={500}
                    className="w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent"></div>
                  
                  {/* Feature showcase overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-background/80 backdrop-blur-md p-3 rounded-lg border border-muted">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Smart Booking</span>
                        </div>
                      </div>
                      <div className="bg-background/80 backdrop-blur-md p-3 rounded-lg border border-muted">
                        <div className="flex items-center gap-2">
                          <Map className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Multi-Facility</span>
                        </div>
                      </div>
                      <div className="bg-background/80 backdrop-blur-md p-3 rounded-lg border border-muted">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Role-Based Access</span>
                        </div>
                      </div>
                      <div className="bg-background/80 backdrop-blur-md p-3 rounded-lg border border-muted">
                        <div className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Admin Dashboard</span>
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
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Tailored for Every Team Member
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conference Hub provides specialized interfaces for different roles in your organization.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border bg-background hover:shadow-lg transition-all duration-300 hover:border-primary/20 overflow-hidden">
              <div className="h-2 bg-blue-500 w-full"></div>
              <CardHeader>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full w-fit mb-4">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>For Team Members</CardTitle>
                <CardDescription>Quick and easy room booking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Find and book available rooms in seconds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Filter by capacity, resources, and time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Manage your bookings in one place</span>
                  </li>
                </ul>
                
                <Button asChild className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  <Link href="/user-login">
                    Team Member Login
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-background hover:shadow-lg transition-all duration-300 hover:border-primary/20 overflow-hidden">
              <div className="h-2 bg-amber-500 w-full"></div>
              <CardHeader>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full w-fit mb-4">
                  <Building className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle>For Facility Managers</CardTitle>
                <CardDescription>Manage spaces and resources</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Oversee facility-specific rooms and resources</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Manage booking requests and approvals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">View facility-specific reports and analytics</span>
                  </li>
                </ul>
                
                <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                  <Link href="/login">
                    Facility Manager Login
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-border bg-background hover:shadow-lg transition-all duration-300 hover:border-primary/20 overflow-hidden">
              <div className="h-2 bg-emerald-500 w-full"></div>
              <CardHeader>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full w-fit mb-4">
                  <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle>For Administrators</CardTitle>
                <CardDescription>Complete system control</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Manage all facilities, rooms, and resources</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Configure system settings and user permissions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Access comprehensive analytics and reports</span>
                  </li>
                </ul>
                
                <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
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
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              Trusted by Organizations Worldwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how Conference Hub has transformed workspace management for companies of all sizes.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-muted/30 p-6 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary">AC</span>
                </div>
                <div>
                  <h4 className="font-medium">Alex Chen</h4>
                  <p className="text-sm text-muted-foreground">Facilities Director, TechCorp</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "Conference Hub has eliminated double bookings and reduced our administrative workload by 70%. The multi-facility management features are exactly what we needed."
              </p>
            </div>
            
            <div className="bg-muted/30 p-6 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary">SJ</span>
                </div>
                <div>
                  <h4 className="font-medium">Sarah Johnson</h4>
                  <p className="text-sm text-muted-foreground">Office Manager, Innovate Inc</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "The resource management system is a game-changer. We can now ensure every meeting has the right equipment without any conflicts or manual tracking."
              </p>
            </div>
            
            <div className="bg-muted/30 p-6 rounded-xl border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-semibold text-primary">MR</span>
                </div>
                <div>
                  <h4 className="font-medium">Michael Rodriguez</h4>
                  <p className="text-sm text-muted-foreground">CTO, Enterprise Solutions</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "The analytics provided by Conference Hub helped us optimize our office space, resulting in significant cost savings and improved employee satisfaction."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20"></div>
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
            
            <div className="relative z-10 py-16 px-8 md:px-16 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                Ready to Transform Your Workspace Management?
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
                Join hundreds of organizations already using Conference Hub to streamline their room booking and resource management.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300">
                  <Link href="/signup">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-2 border-primary/20 hover:border-primary text-foreground transition-all duration-300">
                  <Link href="#">Request a Demo</Link>
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-6">
                No credit card required • Free 30-day trial • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
