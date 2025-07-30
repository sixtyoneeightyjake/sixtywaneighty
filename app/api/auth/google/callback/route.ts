import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Google OAuth callback started")

    const { code } = await request.json()

    if (!code) {
      console.error("❌ No authorization code provided")
      return NextResponse.json({ error: "Authorization code is required" }, { status: 400 })
    }

    console.log("✅ Received code:", code.substring(0, 20) + "...")

    // Check if credentials are available
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("❌ Missing Google OAuth credentials")
      console.error("GOOGLE_CLIENT_ID exists:", !!process.env.GOOGLE_CLIENT_ID)
      console.error("GOOGLE_CLIENT_SECRET exists:", !!process.env.GOOGLE_CLIENT_SECRET)
      return NextResponse.json({ error: "OAuth configuration error - missing credentials" }, { status: 500 })
    }

    // Get the correct redirect URI - FIX THE TYPO HERE!
    const host = request.headers.get("host") || "localhost:3000"
    const protocol = host.includes("localhost") ? "http" : "https" // Fixed: was "httos"
    const redirectUri = `${protocol}://${host}/auth/callback`

    console.log("🔄 Token exchange details:")
    console.log("   Host:", host)
    console.log("   Protocol:", protocol)
    console.log("   Redirect URI:", redirectUri)
    console.log("   Client ID:", process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...")

    // Prepare token exchange request
    const tokenParams = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    })

    console.log("📤 Making token exchange request to Google...")

    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: tokenParams.toString(),
    })

    console.log("📥 Token response status:", tokenResponse.status)
    console.log("📥 Token response headers:", Object.fromEntries(tokenResponse.headers.entries()))

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("❌ Token exchange failed:")
      console.error("   Status:", tokenResponse.status)
      console.error("   Status Text:", tokenResponse.statusText)
      console.error("   Error Response:", errorText)

      // Parse the error if it's JSON
      let errorDetails = errorText
      let parsedError = null
      try {
        parsedError = JSON.parse(errorText)
        errorDetails = parsedError.error_description || parsedError.error || errorText
        console.error("   Parsed Error:", parsedError)
      } catch (e) {
        console.error("   Could not parse error as JSON")
      }

      return NextResponse.json(
        {
          error: "Failed to exchange code for token",
          details: errorDetails,
          status: tokenResponse.status,
          googleError: parsedError,
        },
        { status: 400 },
      )
    }

    const tokenData = await tokenResponse.json()
    console.log("✅ Token received successfully")
    console.log("   Token type:", tokenData.token_type)
    console.log("   Expires in:", tokenData.expires_in)
    console.log("   Scope:", tokenData.scope)

    // Get user info from Google
    console.log("👤 Fetching user info from Google...")
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    })

    console.log("👤 User info response status:", userResponse.status)

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("❌ User info fetch failed:", errorText)
      return NextResponse.json(
        {
          error: "Failed to get user info",
          details: errorText,
        },
        { status: 400 },
      )
    }

    const userData = await userResponse.json()
    console.log("✅ User info received:")
    console.log("   Email:", userData.email)
    console.log("   Name:", userData.name)
    console.log("   ID:", userData.id)

    // Create user object
    const user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
    }

    console.log("🎉 Google OAuth callback completed successfully")
    return NextResponse.json({ user })
  } catch (error) {
    console.error("💥 Google OAuth callback error:", error)
    console.error("💥 Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
