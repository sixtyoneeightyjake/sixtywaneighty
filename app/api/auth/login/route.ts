import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Simple authentication check (in production, use proper password hashing)
    const users = await sql`
      SELECT id, email FROM users 
      WHERE email = ${email} AND password = ${password}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = users[0]

    // Log the login
    await sql`
      INSERT INTO user_sessions (user_id, login_time)
      VALUES (${user.id}, NOW())
    `

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
