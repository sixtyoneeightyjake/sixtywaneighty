"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface User {
  id: number
  email: string
}

interface AuthWrapperProps {
  children: (user: User) => React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        localStorage.setItem("user", JSON.stringify(data.user))
      } else {
        setError(data.error || "Login failed")
      }
    } catch (err) {
      setError("Network error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  if (user) {
    return <>{children(user)}</>
  }

  return (
    <div className="min-h-screen bg-[#39557a] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#2c3441] border-4 border-[#9cc2db]">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black text-[#f5724c]">sixtyoneeighty</CardTitle>
          <p className="text-[#9cc2db]">Login to generate videos</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[#f5724c] font-bold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#39557a] border-[#9cc2db] text-white"
                placeholder="demo@sixtywaneighty.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-[#f5724c] font-bold">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#39557a] border-[#9cc2db] text-white"
                placeholder="demo123"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#f5724c] hover:bg-[#e55a35] text-white font-bold"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
          <div className="mt-4 p-3 bg-[#39557a] rounded border border-[#9cc2db]">
            <p className="text-xs text-[#9cc2db] mb-2">Demo credentials:</p>
            <p className="text-xs text-white">Email: demo@sixtywaneighty.com</p>
            <p className="text-xs text-white">Password: demo123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
