"use client"

// Simple Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export interface GoogleUser {
  id: string
  email: string
  name: string
  picture: string
}

export const initiateGoogleLogin = () => {
  if (!GOOGLE_CLIENT_ID) {
    console.error("❌ Google Client ID not configured")
    console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
    throw new Error("Google Client ID not configured")
  }

  // Get the correct redirect URI - this must match what's configured in Google Console
  const redirectUri = `${window.location.origin}/auth/callback`

  console.log("🚀 Initiating Google login:")
  console.log("   Origin:", window.location.origin)
  console.log("   Redirect URI:", redirectUri)
  console.log("   Client ID:", GOOGLE_CLIENT_ID?.substring(0, 20) + "...")

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  console.log("🔗 Auth URL:", authUrl)

  // Add a small delay to ensure logging is visible
  setTimeout(() => {
    window.location.href = authUrl
  }, 100)
}

export const exchangeCodeForToken = async (code: string): Promise<GoogleUser | null> => {
  try {
    console.log("🔄 Starting token exchange...")
    console.log("   Code length:", code.length)
    console.log("   Code preview:", code.substring(0, 20) + "...")

    const response = await fetch("/api/auth/google/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    })

    console.log("📥 Exchange response:")
    console.log("   Status:", response.status)
    console.log("   Status Text:", response.statusText)
    console.log("   Headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorData = await response.json().catch(async () => {
        const text = await response.text()
        return { error: "Failed to parse error response", details: text }
      })

      console.error("❌ Token exchange failed:")
      console.error("   Error data:", errorData)

      throw new Error(
        `Failed to exchange code for token (${response.status}): ${
          errorData.error || errorData.details || "Unknown error"
        }`,
      )
    }

    const data = await response.json()
    console.log("✅ Token exchange successful:")
    console.log("   User email:", data.user?.email)
    console.log("   User name:", data.user?.name)

    return data.user
  } catch (error) {
    console.error("💥 Token exchange error:", error)
    if (error instanceof Error) {
      console.error("💥 Error message:", error.message)
      console.error("💥 Error stack:", error.stack)
    }
    return null
  }
}
