"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RoleButton } from '@/components/ui/role-button'
import { RoleBadge } from '@/components/ui/role-badge'
import { useTheme } from '@/contexts/theme-context'

export function ColorShowcase() {
  const { role } = useTheme()

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Conference Hub Color System
            <RoleBadge role={role} variant="secondary" />
          </CardTitle>
          <CardDescription>
            Current theme for {role} role with Conference Hub brand colors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Brand Colors */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Brand Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-16 bg-brand-navy-900 rounded-lg flex items-end p-2">
                  <span className="text-white text-sm font-medium">Navy</span>
                </div>
                <p className="text-sm text-muted-foreground">#0A2540</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-brand-teal-500 rounded-lg flex items-end p-2">
                  <span className="text-white text-sm font-medium">Teal</span>
                </div>
                <p className="text-sm text-muted-foreground">#00C49A</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-primary rounded-lg flex items-end p-2">
                  <span className="text-primary-foreground text-sm font-medium">Primary</span>
                </div>
                <p className="text-sm text-muted-foreground">Dynamic</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-accent rounded-lg flex items-end p-2">
                  <span className="text-accent-foreground text-sm font-medium">Accent</span>
                </div>
                <p className="text-sm text-muted-foreground">Dynamic</p>
              </div>
            </div>
          </div>

          {/* Status Colors */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Status Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-12 bg-success rounded-lg flex items-center justify-center">
                  <span className="text-success-foreground text-sm font-medium">Success</span>
                </div>
                <p className="text-xs text-center text-muted-foreground">For confirmations</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-warning rounded-lg flex items-center justify-center">
                  <span className="text-warning-foreground text-sm font-medium">Warning</span>
                </div>
                <p className="text-xs text-center text-muted-foreground">For alerts & cautions</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-destructive rounded-lg flex items-center justify-center">
                  <span className="text-destructive-foreground text-sm font-medium">Error</span>
                </div>
                <p className="text-xs text-center text-muted-foreground">For errors & conflicts</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-info rounded-lg flex items-center justify-center">
                  <span className="text-info-foreground text-sm font-medium">Info</span>
                </div>
                <p className="text-xs text-center text-muted-foreground">For neutral information</p>
              </div>
            </div>
          </div>
          
          {/* Feedback Examples */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Feedback Examples</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="p-1 bg-success/20 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-success">Booking Confirmed</h4>
                    <p className="text-xs text-muted-foreground">Your room has been successfully booked for the selected time.</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="p-1 bg-warning/20 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-warning">Booking Pending</h4>
                    <p className="text-xs text-muted-foreground">Your booking request is awaiting approval from the facility manager.</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="p-1 bg-destructive/20 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-destructive">Booking Conflict</h4>
                    <p className="text-xs text-muted-foreground">This room is already booked for the selected time period.</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-info/10 border border-info/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="p-1 bg-info/20 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-info">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-info">Room Information</h4>
                    <p className="text-xs text-muted-foreground">This room has a capacity of 8 people and includes a projector.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role Badges */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Role Badges</h3>
            <div className="flex flex-wrap gap-2">
              <RoleBadge role="user" />
              <RoleBadge role="facility_manager" />
              <RoleBadge role="admin" />
              <RoleBadge role="user" variant="secondary" />
              <RoleBadge role="facility_manager" variant="secondary" />
              <RoleBadge role="admin" variant="secondary" />
              <RoleBadge role="user" variant="outline" />
              <RoleBadge role="facility_manager" variant="outline" />
              <RoleBadge role="admin" variant="outline" />
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Button Variations</h3>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button>Default Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <RoleButton useRoleColors>Role Default</RoleButton>
                <RoleButton useRoleColors variant="secondary">Role Secondary</RoleButton>
                <RoleButton useRoleColors variant="outline">Role Outline</RoleButton>
                <RoleButton useRoleColors variant="ghost">Role Ghost</RoleButton>
                <RoleButton useRoleColors variant="link">Role Link</RoleButton>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Card Examples</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Standard Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This is a standard card with the base theme colors.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-role-primary/20 bg-role-secondary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-role-primary">Role Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-role-secondary-foreground">
                    This card uses role-specific colors for subtle branding.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-accent/20 bg-accent/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-accent">Accent Card</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This card highlights with the accent color.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}