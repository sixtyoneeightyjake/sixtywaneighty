"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { initiateGoogleLogin } from "@/lib/google-auth"
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
    console.log("🔄 Checking for stored user session...")

    // Check for stored user session
    const storedUser = localStorage.getItem("google-user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        console.log("✅ Found stored user:", parsedUser.email)
        setUser(parsedUser)
      } catch (error) {
        console.error("❌ Failed to parse stored user:", error)
        localStorage.removeItem("google-user")
      }
    } else {
      console.log("ℹ️ No stored user session found")
    }

    setLoading(false)
  }, [])

  const signIn = () => {
    try {
      console.log("🚀 Starting Google sign in process...")
      initiateGoogleLogin()
    } catch (error) {
      console.error("❌ Sign in error:", error)
      alert("Google OAuth not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment variables.")
    }
  }

  const signOut = () => {
    console.log("👋 Signing out user...")
    setUser(null)
    localStorage.removeItem("google-user")
  }

  const setUserAndStore = (user: GoogleUser) => {
    console.log("💾 Storing user session:", user.email)
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
