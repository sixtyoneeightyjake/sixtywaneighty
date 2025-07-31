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
  // Use exact values from WAN 2.2 API documentation
  const sizeMap: Record<string, Record<string, string>> = {
    "480P": {
      "16:9": "832x480",
      "9:16": "480x832", 
      "1:1": "624x624",
      // Fallbacks for unsupported combinations
      "4:3": "832x480",
      "3:4": "480x832",
    },
    "1080P": {
      "16:9": "1920x1080",
      "9:16": "1080x1920",
      "1:1": "1440x1440", 
      "4:3": "1632x1248",
      "3:4": "1248x1632",
    },
  }
  
  console.log("🔍 Available sizes for", resolution, ":", Object.keys(sizeMap[resolution] || {}))

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

    // Validate supported combinations
    const supportedCombinations = {
      "480P": ["16:9", "9:16", "1:1"],
      "1080P": ["16:9", "9:16", "1:1", "4:3", "3:4"]
    }
    
    if (!supportedCombinations[resolution]?.includes(aspectRatio)) {
      console.log(`⚠️ Unsupported combination: ${resolution} + ${aspectRatio}, using fallback`)
      // Use fallback for unsupported combinations
      if (resolution === "480P") {
        aspectRatio = "1:1" // Safe fallback for 480P
      }
    }

    // Get exact pixel dimensions
    const size = getVideoSize(resolution, aspectRatio)
    console.log("📐 Using size:", size)
    console.log("📐 Size type:", typeof size)
    console.log("📐 Resolution:", resolution, "Aspect Ratio:", aspectRatio)
    
    // Test with hardcoded known working size
    const testSize = "1920x1080" // Known working size from docs
    console.log("🧪 Testing with hardcoded size:", testSize)

    // Step 1: Create the video generation task
    const requestBody = {
      model: "wan2.2-t2v-plus",
      input: {
        prompt: truncatedPrompt,
        ...(truncatedNegativePrompt && { negative_prompt: truncatedNegativePrompt }),
      },
      parameters: {
        size: testSize, // Use hardcoded test size
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
