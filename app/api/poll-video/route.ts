import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { taskId, pollUrl } = await request.json()

    if (!taskId && !pollUrl) {
      return NextResponse.json({ error: "Task ID or poll URL required" }, { status: 400 })
    }

    if (!process.env.ALI_MODEL_STUDIO_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const url = pollUrl || `https://dashscope-intl.aliyuncs.com/api/v1/tasks/${taskId}`

    const statusResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.ALI_MODEL_STUDIO_API_KEY}`,
      },
    })

    if (!statusResponse.ok) {
      return NextResponse.json({ error: "Failed to check status" }, { status: 500 })
    }

    const statusData = await statusResponse.json()
    const status = statusData.output?.task_status
    
    console.log(`🔍 Poll status for ${taskId}:`, status)
    console.log(`📋 Full response:`, JSON.stringify(statusData, null, 2))

    // Check for success with video URL
    if (status === "SUCCEEDED" && statusData.output?.video_url) {
      return NextResponse.json({
        status: "SUCCEEDED",
        url: statusData.output.video_url,
        taskId: taskId
      })
    }

    // Check for failure with detailed error
    if (status === "FAILED") {
      const errorMessage = statusData.output?.message || statusData.message || "Video generation failed"
      console.error(`❌ Video generation failed for ${taskId}:`, errorMessage)
      return NextResponse.json({
        status: "FAILED",
        error: errorMessage
      })
    }

    // Still processing
    return NextResponse.json({
      status: status || "PENDING",
      taskId: taskId
    })

  } catch (error) {
    console.error("💥 Poll error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}