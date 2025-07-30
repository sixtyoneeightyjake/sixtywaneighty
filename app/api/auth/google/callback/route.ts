import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Authorization code is required" }, { status: 400 })
    }

    console.log("Received code:", code.substring(0, 10) + "...")

    // Get the base URL for redirect
    const baseUrl = process.env.NEXTAUTH_URL || request.headers.get("origin") || "http://localhost:3000"

    const redirectUri = `${baseUrl}/auth/callback`
    console.log("Using redirect URI:", redirectUri)

    // Check if credentials are available
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("Missing Google OAuth credentials")
      return NextResponse.json({ error: "OAuth configuration error - missing credentials" }, { status: 500 })
    }

    // Exchange code for access token
    console.log("Exchanging code for token...")
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Token exchange failed:", errorText)
      return NextResponse.json(
        {
          error: "Failed to exchange code for token",
          details: errorText,
        },
        { status: 400 },
      )
    }

    const tokenData = await tokenResponse.json()
    console.log("Token received successfully")

    // Get user info from Google
    console.log("Fetching user info...")
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("User info fetch failed:", errorText)
      return NextResponse.json(
        {
          error: "Failed to get user info",
          details: errorText,
        },
        { status: 400 },
      )
    }

    const userData = await userResponse.json()
    console.log("User info received:", userData.email)

    // Create user object
    const user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Google OAuth callback error:", error)
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 })
  }
}
