"use client"

// Simple Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const GOOGLE_REDIRECT_URI = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : ""

export interface GoogleUser {
  id: string
  email: string
  name: string
  picture: string
}

export const initiateGoogleLogin = () => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google Client ID not configured")
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  window.location.href = authUrl
}

export const exchangeCodeForToken = async (code: string): Promise<GoogleUser | null> => {
  try {
    const response = await fetch("/api/auth/google/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    })

    if (!response.ok) {
      throw new Error("Failed to exchange code for token")
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    console.error("Token exchange error:", error)
    return null
  }
}
