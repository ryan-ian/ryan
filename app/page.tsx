import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Calendar, Users, Shield, CheckCircle, ArrowRight, LayoutDashboard, Clock, Gift } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { MainLayout } from "@/components/main-layout"

export default function HomePage() {
  return (
    <MainLayout fullWidth>
      {/* Hero Section */}
      <section className="relative bg-background pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5"></div>
        
        <div className="container mx-auto px-4 pt-32 pb-40 relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-extrabold text-foreground tracking-tight mb-6">
              Modern Room Booking for Modern Teams
            </h1>
            <p className="text-2xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
              Revolutionize your office space management with intelligent room booking and resource allocation. Say goodbye to scheduling conflicts and hello to productive meetings.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
            <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-7 px-8 rounded-xl shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 transition-all duration-300 hover:scale-105">
              <Link href="/signup">
                Start Booking Now
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-primary/20 hover:border-primary text-foreground transition-all duration-300">
              <Link href="/user-login">Sign In</Link>
            </Button>
          </div>
          
          <div className="relative mx-auto max-w-6xl rounded-2xl overflow-hidden shadow-2xl ring-1 ring-indigo-300/20">
            <Image 
              src="/placeholder.jpg" 
              alt="Conference Hub Dashboard" 
              width={1200} 
              height={700}
              className="w-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Clock className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Save Time</h3>
              <p className="text-muted-foreground text-lg">
                Instantly find and book available rooms without the back-and-forth.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Avoid Conflicts</h3>
              <p className="text-muted-foreground text-lg">
                Real-time availability ensures no more double bookings or scheduling headaches.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Gift className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Boost Productivity</h3>
              <p className="text-muted-foreground text-lg">
                Get the right space with the right tools, every time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-foreground mb-6 tracking-tight">Powerful Features for Seamless Collaboration</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Conference Hub provides everything you need to manage your meeting spaces effectively, from real-time availability to advanced analytics.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            <div className="group relative bg-card p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-border">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground">Intelligent Booking System</h3>
                </div>
                <p className="text-muted-foreground text-lg">
                  Find and reserve the perfect room instantly with smart filters for capacity, resources, and real-time availability checks.
                </p>
              </div>
            </div>

            <div className="group relative bg-card p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-border">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground">Resource Optimization</h3>
                </div>
                <p className="text-muted-foreground text-lg">
                  Track and allocate resources efficiently, preventing conflicts and ensuring every meeting has what it needs.
                </p>
              </div>
            </div>

            <div className="group relative bg-card p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-border">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <LayoutDashboard className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground">Advanced Administration</h3>
                </div>
                <p className="text-muted-foreground text-lg">
                  Powerful tools for managing users, generating reports, and optimizing space utilization across your organization.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-24 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-foreground mb-6 tracking-tight">Built for Your Entire Team</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Whether you're booking a room or managing the entire office, Conference Hub has you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border transform hover:scale-[1.02] transition-transform duration-300">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Users className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-foreground">For Team Members</CardTitle>
                </div>
                <CardDescription className="text-lg text-muted-foreground">Book and manage conference rooms effortlessly.</CardDescription>
            </CardHeader>
              <CardContent>
                <ul className="space-y-4 text-lg">
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span>Find and book available rooms in seconds with a user-friendly interface.</span>
                </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span>Filter rooms by capacity, amenities, and availability to find the perfect space.</span>
                </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span>View your upcoming and past bookings in a personalized dashboard.</span>
                </li>
              </ul>
                <div className="mt-8">
                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-lg text-lg font-semibold">
                    <Link href="/user-login">Team Member Login</Link>
                </Button>
              </div>
            </CardContent>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border transform hover:scale-[1.02] transition-transform duration-300">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Shield className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-foreground">For Administrators</CardTitle>
                </div>
                <CardDescription className="text-lg text-muted-foreground">Oversee and optimize your entire conference room ecosystem.</CardDescription>
            </CardHeader>
              <CardContent>
                <ul className="space-y-4 text-lg">
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span>Manage all rooms, resources, and user accounts from a central dashboard.</span>
                </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span>Gain insights with analytics on room usage and booking patterns.</span>
                </li>
                  <li className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <span>Configure booking policies and permissions to fit your organization's needs.</span>
                </li>
              </ul>
                <div className="mt-8">
                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-lg text-lg font-semibold">
                    <Link href="/login">Administrator Login</Link>
                </Button>
              </div>
            </CardContent>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background text-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-primary/5 p-12 rounded-2xl border border-border">
            <h2 className="text-4xl font-extrabold mb-6 tracking-tight">Ready to Transform Your Workspace?</h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join leading organizations in optimizing their office spaces. Get started with Conference Hub today and experience the future of room management.
            </p>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-7 px-10 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 text-lg">
              <Link href="/signup">
                Create Your Free Account
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
          </Button>
        </div>
      </div>
      </section>
    </MainLayout>
  )
}
