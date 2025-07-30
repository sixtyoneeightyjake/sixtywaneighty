import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { id, email, name, avatar_url, provider } = await request.json()

    if (!id || !email) {
      return NextResponse.json({ error: "User ID and email are required" }, { status: 400 })
    }

    // Insert or update user in database
    await sql`
      INSERT INTO users (id, email, name, avatar_url, provider, created_at, updated_at, last_login)
      VALUES (${id}, ${email}, ${name}, ${avatar_url}, ${provider}, NOW(), NOW(), NOW())
      ON CONFLICT (id) 
      DO UPDATE SET 
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW(),
        last_login = NOW()
    `

    // Log the login session
    await sql`
      INSERT INTO user_sessions (user_id, login_time, provider)
      VALUES (${id}, NOW(), ${provider})
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Store user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
