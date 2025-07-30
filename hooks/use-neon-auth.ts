"use client"

import { useState, useEffect, createContext, useContext } from "react"
import type { User, Session } from "@supabase/supabase-js"
import {
  supabase,
  signInWithGoogle,
  signInWithGitHub,
  signInWithDiscord,
  signOut as authSignOut,
} from "@/lib/neon-auth"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isConfigured: boolean
  signInWithGoogle: () => Promise<void>
  signInWithGitHub: () => Promise<void>
  signInWithDiscord: () => Promise<void>
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
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConfigured] = useState(!!supabase)

  useEffect(() => {
    if (!supabase) {
      console.warn("⚠️ Supabase not configured - using demo mode")
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error("Error getting initial session:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Store user in Neon database when they sign in
      if (event === "SIGNED_IN" && session?.user) {
        await storeUserInDatabase(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const storeUserInDatabase = async (user: User) => {
    try {
      const response = await fetch("/api/auth/store-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0],
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          provider: user.app_metadata?.provider || "unknown",
        }),
      })

      if (!response.ok) {
        console.error("Failed to store user in database")
      }
    } catch (error) {
      console.error("Error storing user:", error)
    }
  }

  const handleSignInWithGoogle = async () => {
    const { error } = await signInWithGoogle()
    if (error) {
      console.error("Google sign in error:", error)
      throw error
    }
  }

  const handleSignInWithGitHub = async () => {
    const { error } = await signInWithGitHub()
    if (error) {
      console.error("GitHub sign in error:", error)
      throw error
    }
  }

  const handleSignInWithDiscord = async () => {
    const { error } = await signInWithDiscord()
    if (error) {
      console.error("Discord sign in error:", error)
      throw error
    }
  }

  const handleSignOut = async () => {
    const { error } = await authSignOut()
    if (error) {
      console.error("Sign out error:", error)
      throw error
    }
  }

  return {
    user,
    session,
    loading,
    isConfigured,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithGitHub: handleSignInWithGitHub,
    signInWithDiscord: handleSignInWithDiscord,
    signOut: handleSignOut,
  }
}

export { AuthContext }
