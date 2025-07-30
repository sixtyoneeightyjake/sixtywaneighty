"use client"

import { useState, useEffect, createContext, useContext } from "react"

interface User {
  id: string
  email: string
  name: string
  image?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string) => Promise<boolean>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/session")
      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      console.error("Session check failed:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok && data.user) {
        setUser(data.user)
        return true
      }

      return false
    } catch (error) {
      console.error("Sign in failed:", error)
      return false
    }
  }

  const signOut = async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
      })
      setUser(null)
    } catch (error) {
      console.error("Sign out failed:", error)
      // Still clear user on client side
      setUser(null)
    }
  }

  return {
    user,
    loading,
    signIn,
    signOut,
  }
}

export { AuthContext }
