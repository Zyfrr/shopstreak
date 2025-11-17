"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Shield } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your store settings and preferences</p>
      </div>
      {/* Security */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-bold">Security</h2>
            <p className="text-sm text-muted-foreground">Manage your account security</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">Update your password regularly</p>
            </div>
            <Button variant="outline">Change</Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Enable for added security</p>
            </div>
            <Button variant="outline">Enable</Button>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <Bell className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-bold">Notifications</h2>
            <p className="text-sm text-muted-foreground">Manage notification preferences</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { label: "New Orders", checked: true },
            { label: "Customer Reviews", checked: true },
            { label: "Stock Updates", checked: false },
            { label: "Sales Reports", checked: true },
          ].map((item) => (
            <label key={item.label} className="flex items-center gap-3">
              <input type="checkbox" defaultChecked={item.checked} className="w-4 h-4 rounded border-border" />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </Card>
    </div>
  )
}
