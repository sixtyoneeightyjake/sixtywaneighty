import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    console.log("🤖 Enhancing prompt with Gemini 2.5 Flash...")

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    })

    const config = {
      temperature: 1.4,
      thinkingConfig: {
        thinkingBudget: 0,
      },
      systemInstruction: [{
        text: `You are a prompt-enhancement engine for Wan2.2 T2V. Receive an input prompt and automatically expand it into a refined generation prompt under 120 words. Focus on cinematic structure: first describe the opening scene, then specify any camera movement (e.g. pan left, dolly in, tilt up), then the reveal or payoff. Use natural language, one action per shot, precise motion and aesthetic details. 

Output in this exact JSON format:
{
  "enhancedPrompt": "your enhanced prompt here",
  "negativePrompt": "bright colors, overexposed, static, blurred details, subtitles, worst quality, low quality, extra fingers, poorly drawn hands or faces"
}`,
      }],
    }

    const model = 'gemini-2.5-flash'
    const contents = [{
      role: 'user',
      parts: [{
        text: prompt.trim(),
      }],
    }]

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    })

    let fullResponse = ''
    for await (const chunk of response) {
      if (chunk.text) {
        fullResponse += chunk.text
      }
    }

    console.log("📝 Gemini response:", fullResponse)

    // Try to parse JSON response
    let enhancedData
    try {
      enhancedData = JSON.parse(fullResponse)
    } catch (parseError) {
      // If JSON parsing fails, try to extract from markdown code blocks
      const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/) || fullResponse.match(/```\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        enhancedData = JSON.parse(jsonMatch[1])
      } else {
        // If still no JSON, treat the response as the enhanced prompt directly
        enhancedData = {
          enhancedPrompt: fullResponse.trim(),
          negativePrompt: "bright colors, overexposed, static, blurred details, subtitles, worst quality, low quality, extra fingers, poorly drawn hands or faces"
        }
      }
    }

    // Validate and ensure we have an enhanced prompt
    if (!enhancedData.enhancedPrompt) {
      throw new Error("Invalid response format from Gemini")
    }

    // Ensure length limits (120 words ≈ 800 characters max)
    const finalEnhancedPrompt = enhancedData.enhancedPrompt.slice(0, 800)
    const finalNegativePrompt = "bright colors, overexposed, static, blurred details, subtitles, worst quality, low quality, extra fingers, poorly drawn hands or faces"

    console.log("✅ Prompt enhanced successfully")

    return NextResponse.json({
      enhancedPrompt: finalEnhancedPrompt,
      negativePrompt: finalNegativePrompt
    })

  } catch (error) {
    console.error("💥 Prompt enhancement error:", error)
    return NextResponse.json(
      { error: "Failed to enhance prompt" },
      { status: 500 }
    )
  }
}