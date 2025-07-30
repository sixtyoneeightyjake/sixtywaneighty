"use client"

import { useState, useEffect, createContext, useContext } from "react"
import type { GoogleUser } from "@/lib/google-auth"

interface AuthContextType {
  user: GoogleUser | null
  loading: boolean
  signIn: () => void
  signOut: () => void
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
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("google-user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error("Failed to parse stored user:", error)
        localStorage.removeItem("google-user")
      }
    }
    setLoading(false)
  }, [])

  const signIn = () => {
    const { initiateGoogleLogin } = require("@/lib/google-auth")
    try {
      initiateGoogleLogin()
    } catch (error) {
      console.error("Sign in error:", error)
      alert("Google OAuth not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment variables.")
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("google-user")
  }

  const setUserAndStore = (user: GoogleUser) => {
    setUser(user)
    localStorage.setItem("google-user", JSON.stringify(user))
  }

  return {
    user,
    loading,
    signIn,
    signOut,
    setUserAndStore,
  }
}

export { AuthContext }
