import { type NextRequest, NextResponse } from "next/server"

interface VideoGenerationRequest {
  prompt: string
  negativePrompt?: string
  resolution: "480P" | "1080P"
  aspectRatio: "4:3" | "16:9" | "1:1" | "9:16" | "3:4"
  userId?: string
}

// Map UI selections to exact pixel dimensions per WAN 2.2 spec
function getVideoSize(resolution: string, aspectRatio: string): string {
  const sizeMap: Record<string, Record<string, string>> = {
    "480P": {
      "16:9": "832x480",
      "9:16": "480x832",
      "1:1": "624x624",
      // 4:3 and 3:4 not supported in 480P per docs, fallback to 1:1
      "4:3": "624x624",
      "3:4": "624x624",
    },
    "1080P": {
      "16:9": "1920x1080",
      "9:16": "1080x1920",
      "1:1": "1440x1440",
      "4:3": "1632x1248",
      "3:4": "1248x1632",
    },
  }

  return sizeMap[resolution]?.[aspectRatio] || "1920x1080"
}

export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerationRequest = await request.json()
    const { prompt, negativePrompt, resolution, aspectRatio, userId } = body

    console.log("🎬 Video Generation Request:", { prompt, negativePrompt, resolution, aspectRatio, userId })

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.ALI_MODEL_STUDIO_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Truncate prompt to 800 chars as per WAN spec
    const truncatedPrompt = prompt.trim().slice(0, 800)
    const truncatedNegativePrompt = negativePrompt?.trim().slice(0, 500)

    // Get exact pixel dimensions
    const size = getVideoSize(resolution, aspectRatio)
    console.log("📐 Using size:", size)

    // Step 1: Create the video generation task
    const requestBody = {
      model: "wan2.2-t2v-plus",
      input: {
        prompt: truncatedPrompt,
        ...(truncatedNegativePrompt && { negative_prompt: truncatedNegativePrompt }),
      },
      parameters: {
        size: size,
        prompt_extend: true,
        watermark: false,
      },
    }

    console.log("📤 Sending to WAN API:", JSON.stringify(requestBody, null, 2))

    const createTaskResponse = await fetch(
      "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.ALI_MODEL_STUDIO_API_KEY}`,
          "X-DashScope-Async": "enable",
        },
        body: JSON.stringify(requestBody),
      },
    )

    console.log("📥 WAN API Response Status:", createTaskResponse.status)

    if (!createTaskResponse.ok) {
      const errorText = await createTaskResponse.text()
      console.error("❌ WAN API Error:", errorText)
      return NextResponse.json({ error: `API Error: ${errorText}` }, { status: createTaskResponse.status })
    }

    const createTaskData = await createTaskResponse.json()
    console.log("📋 Task Created:", JSON.stringify(createTaskData, null, 2))

    const taskId = createTaskData.output?.task_id
    const resultUrl = createTaskData.output?.result_url

    if (!taskId && !resultUrl) {
      return NextResponse.json({ error: "No task ID or result URL received from API" }, { status: 500 })
    }

    // Return task ID immediately for client-side polling
    console.log("✅ Task created, returning for client-side polling")
    return NextResponse.json({
      taskId: taskId || "unknown",
      pollUrl: resultUrl,
      status: "PENDING"
    })
  } catch (error) {
    console.error("💥 Video generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
