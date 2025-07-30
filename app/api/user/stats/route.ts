import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get user statistics
    const stats = await sql`
      SELECT * FROM user_stats WHERE id = ${userId}
    `

    if (stats.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get recent video generations
    const recentVideos = await sql`
      SELECT id, prompt, resolution, aspect_ratio, status, created_at, completed_at, error_message
      FROM video_generations 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC 
      LIMIT 10
    `

    return NextResponse.json({
      stats: stats[0],
      recentVideos: recentVideos,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
