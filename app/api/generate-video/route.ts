import { type NextRequest, NextResponse } from "next/server"

interface VideoGenerationRequest {
  mode: "text" | "image"
  prompt?: string
  negativePrompt?: string
  resolution: "480P" | "1080P"
  aspectRatio?: "4:3" | "16:9" | "1:1" | "9:16" | "3:4" // Only for text mode
  imageUrl?: string // Only for image mode
  userId?: string
}

// Map UI selections to exact pixel dimensions per WAN 2.2 spec
function getVideoSize(resolution: string, aspectRatio: string): string {
  // Use exact values from WAN 2.2 API documentation
  const sizeMap: Record<string, Record<string, string>> = {
    "480P": {
      "16:9": "832*480",
      "9:16": "480*832",
      "1:1": "624*624",
      // Fallbacks for unsupported combinations
      "4:3": "832*480",
      "3:4": "480*832",
    },
    "1080P": {
      "16:9": "1920*1080",
      "9:16": "1080*1920",
      "1:1": "1440*1440",
      "4:3": "1632*1248",
      "3:4": "1248*1632",
    },
  }

  console.log("🔍 Available sizes for", resolution, ":", Object.keys(sizeMap[resolution] || {}))

  return sizeMap[resolution]?.[aspectRatio] || "1920*1080"
}

export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerationRequest = await request.json()
    const { mode, prompt, negativePrompt, resolution, aspectRatio, imageUrl, userId } = body

    console.log("🎬 Video Generation Request:", { mode, prompt, negativePrompt, resolution, aspectRatio, imageUrl, userId })

    // Validation based on mode
    if (mode === "text" && !prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required for text-to-video" }, { status: 400 })
    }
    
    if (mode === "image" && !imageUrl?.trim()) {
      return NextResponse.json({ error: "Image URL is required for image-to-video" }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.ALI_MODEL_STUDIO_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Truncate prompts as per API spec
    const truncatedPrompt = prompt?.trim().slice(0, 800)
    const truncatedNegativePrompt = negativePrompt?.trim().slice(0, 500)

    // Step 1: Create the video generation task
    let requestBody: any

    if (mode === "text") {
      // Validate supported combinations for text mode
      const supportedCombinations = {
        "480P": ["16:9", "9:16", "1:1"],
        "1080P": ["16:9", "9:16", "1:1", "4:3", "3:4"]
      }
      
      let finalAspectRatio = aspectRatio
      if (!supportedCombinations[resolution]?.includes(aspectRatio!)) {
        console.log(`⚠️ Unsupported combination: ${resolution} + ${aspectRatio}, using fallback`)
        finalAspectRatio = resolution === "480P" ? "1:1" : "16:9"
      }

      // Get exact pixel dimensions for text mode
      const size = getVideoSize(resolution, finalAspectRatio!)
      console.log("📐 Text mode - Using size:", size)

      requestBody = {
        "model": "wan2.2-t2v-plus",
        "input": {
          "prompt": truncatedPrompt,
          ...(truncatedNegativePrompt && { "negative_prompt": truncatedNegativePrompt }),
        },
        "parameters": {
          "size": size,
          "prompt_extend": true,
          "watermark": false
        }
      }
    } else {
      // Image-to-video mode
      console.log("🖼️ Image mode - Using resolution:", resolution)

      requestBody = {
        "model": "wan2.2-i2v-plus",
        "input": {
          "img_url": imageUrl,
          ...(truncatedPrompt && { "prompt": truncatedPrompt }),
          ...(truncatedNegativePrompt && { "negative_prompt": truncatedNegativePrompt }),
        },
        "parameters": {
          "resolution": resolution,
          "prompt_extend": true,
          "watermark": false
        }
      }
    }

    console.log("📤 Sending to WAN API:", JSON.stringify(requestBody, null, 2))
    console.log("🔑 API Key (first 20 chars):", process.env.ALI_MODEL_STUDIO_API_KEY?.substring(0, 20))
    console.log("🌐 Endpoint:", "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis")

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
