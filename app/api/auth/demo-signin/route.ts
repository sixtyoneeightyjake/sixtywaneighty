import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Create a demo user
    const user = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split("@")[0],
      avatar_url: null,
      provider: "demo",
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Demo sign in error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
