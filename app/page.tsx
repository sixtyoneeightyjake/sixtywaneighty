"use client"

import { useUser, SignInButton, UserButton } from '@clerk/nextjs'
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clapperboard, Download, Loader2, Sparkles, Zap, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface VideoGenerationRequest {
  prompt: string
  negativePrompt?: string
  resolution: "480P" | "1080P"
  aspectRatio: "4:3" | "16:9" | "1:1"
  userId?: string
}

interface GeneratedVideo {
  url: string
  taskId: string
}

export default function ComicVideoApp() {
  const { user, isLoaded } = useUser()
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [resolution, setResolution] = useState<"480P" | "1080P">("1080P")
  const [aspectRatio, setAspectRatio] = useState<"4:3" | "16:9" | "1:1" | "9:16" | "3:4">("4:3")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState(0)

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Show loading while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#39557a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#f5724c] mx-auto mb-4" />
          <p className="text-[#9cc2db]">Loading...</p>
        </div>
      </div>
    )
  }

  // Show sign in page if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#39557a] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-[#2c3441] border-4 border-[#9cc2db]">
          <CardContent className="p-8 text-center">
            <h1
              className="text-4xl font-black text-[#f5724c] mb-4"
              style={{ fontFamily: "Impact, Arial Black, sans-serif" }}
            >
              sixtywaneighty
            </h1>
            <p className="text-[#9cc2db] mb-6">Sign in to generate amazing videos</p>
            <SignInButton mode="modal">
              <Button className="w-full bg-[#f5724c] hover:bg-[#e55a35] text-white font-bold py-3">
                Sign In
              </Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pollForVideo = async (taskId: string, pollUrl?: string) => {
    const maxAttempts = 40 // 2 minutes max
    let attempts = 0

    const poll = async (): Promise<void> => {
      if (attempts >= maxAttempts) {
        setError("Video generation timed out")
        setIsGenerating(false)
        setGenerationProgress(0)
        return
      }

      // Update progress based on attempts (0-95%, leaving 5% for final processing)
      const progress = Math.min(95, Math.round((attempts / maxAttempts) * 100))
      setGenerationProgress(progress)

      try {
        const response = await fetch("/api/poll-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ taskId, pollUrl }),
        })

        if (!response.ok) {
          throw new Error("Failed to check video status")
        }

        const data = await response.json()
        
        if (data.status === "SUCCEEDED" && data.url) {
          setGenerationProgress(100)
          setGeneratedVideo({ url: data.url, taskId })
          setShowSuccess(true)
          setTimeout(() => setShowSuccess(false), 3000)
          setIsGenerating(false)
          setTimeout(() => setGenerationProgress(0), 1000) // Reset after a delay
          return
        }

        if (data.status === "FAILED") {
          setError(data.error || "Video generation failed")
          setIsGenerating(false)
          setGenerationProgress(0)
          return
        }

        // Still processing, poll again in 3 seconds
        attempts++
        setTimeout(poll, 3000)
      } catch (err) {
        console.error("Polling error:", err)
        setError("Failed to check video status")
        setIsGenerating(false)
        setGenerationProgress(0)
      }
    }

    poll()
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt")
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedVideo(null)
    setGenerationProgress(0)

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim() || undefined,
          resolution,
          aspectRatio,
          userId: user?.id,
        } as VideoGenerationRequest),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to generate video" }))
        throw new Error(errorData.error || "Failed to generate video")
      }

      const data = await response.json()
      
      if (data.taskId) {
        // Start polling for completion
        pollForVideo(data.taskId, data.pollUrl)
      } else {
        throw new Error("No task ID received")
      }
    } catch (err) {
      console.error("Video generation error:", err)
      setError(err instanceof Error ? err.message : "Something went wrong!")
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedVideo) return

    try {
      const response = await fetch(generatedVideo.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `generated-video-${generatedVideo.taskId}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Download error:", err)
      setError("Failed to download video")
    }
  }

  return (
    <div className="min-h-screen bg-[#39557a] relative overflow-hidden">
      {/* Comic halftone pattern background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle, #9cc2db 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* User Header */}
      <div className="relative z-10 p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Avatar className="border-2 border-[#f5724c]">
              <AvatarImage src={user?.imageUrl || ""} />
              <AvatarFallback className="bg-[#f5724c] text-white">
                {user?.fullName?.charAt(0) || <User className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-bold">{user?.fullName || "User"}</p>
              <p className="text-[#9cc2db] text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "border-2 border-[#9cc2db]"
              }
            }}
          />
        </div>
      </div>

      {/* Success popup */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            className="fixed top-4 right-4 z-50 bg-[#f5724c] text-white px-6 py-3 rounded-full font-black text-lg shadow-lg border-4 border-white"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6" />
              BAM! VIDEO READY!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error popup */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-full font-black text-lg shadow-lg border-4 border-white cursor-pointer"
            onClick={() => setError(null)}
          >
            <div className="flex items-center gap-2">
              <span>💥</span>
              OOPS! {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-6xl md:text-8xl font-black text-[#f5724c] mb-2 tracking-wider transform -rotate-1"
            style={{
              fontFamily: "Impact, Arial Black, sans-serif",
              textShadow: "4px 4px 0px #2c3441, 8px 8px 0px rgba(0,0,0,0.3)",
            }}
          >
            sixtywaneighty
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-wide">
            PROFESSIONAL TEXT-TO-VIDEO GENERATION
          </h2>
          <div className="inline-block bg-[#f5724c] text-white px-6 py-2 rounded-full font-black text-sm border-4 border-white shadow-lg transform rotate-1">
            POWERED BY WAN 2.2 T2V PLUS
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Generate Video Panel */}
          <Card className="bg-[#2c3441] border-4 border-[#9cc2db] shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#f5724c] rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-black text-[#f5724c] tracking-wide">GENERATE VIDEO</h3>
              </div>

              <p className="text-[#9cc2db] mb-6 font-medium">
                Create stunning 5 second videos from your text descriptions
              </p>

              <div className="space-y-6">
                {/* Prompt */}
                <div>
                  <Label htmlFor="prompt" className="text-[#f5724c] font-bold text-lg mb-2 block">
                    Prompt
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe your video... (e.g., A kitten running in the moonlight)"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px] bg-[#39557a] border-2 border-[#9cc2db] text-white placeholder:text-[#9cc2db] font-medium resize-none focus:border-[#f5724c] focus:ring-2 focus:ring-[#f5724c]/20"
                    maxLength={800}
                  />
                  <p className="text-xs text-[#9cc2db] mt-1">{prompt.length}/800 characters</p>
                </div>

                {/* Advanced Settings */}
                <div className="bg-[#39557a] p-4 rounded-lg border-2 border-[#9cc2db]">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">⚙️</span>
                    <h4 className="text-[#f5724c] font-bold text-lg">ADVANCED SETTINGS</h4>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-[#f5724c] font-bold mb-2 block">Resolution</Label>
                      <Select value={resolution} onValueChange={(value: "480P" | "1080P") => {
                        setResolution(value)
                        // Auto-switch to supported aspect ratio for 480P
                        if (value === "480P" && aspectRatio === "3:4") {
                          setAspectRatio("1:1")
                        }
                      }}>
                        <SelectTrigger className="bg-[#2c3441] border-[#9cc2db] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="480P">480P Quality</SelectItem>
                          <SelectItem value="1080P">1080P Quality</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-[#f5724c] font-bold mb-2 block">Aspect Ratio</Label>
                      <Select
                        value={aspectRatio}
                        onValueChange={(value: "4:3" | "16:9" | "1:1" | "9:16" | "3:4") => setAspectRatio(value)}
                      >
                        <SelectTrigger className="bg-[#2c3441] border-[#9cc2db] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                          <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                          <SelectItem value="1:1">1:1 (Square)</SelectItem>
                          <SelectItem value="4:3">4:3 (Default)</SelectItem>
                          <SelectItem 
                            value="3:4" 
                            disabled={resolution === "480P"}
                          >
                            3:4 (Portrait) {resolution === "480P" && "(1080P only)"}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="negative-prompt" className="text-[#f5724c] font-bold mb-2 block">
                      Negative Prompt (Optional)
                    </Label>
                    <Input
                      id="negative-prompt"
                      placeholder="What should NOT appear in your video?"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      className="bg-[#2c3441] border-[#9cc2db] text-white placeholder:text-[#9cc2db]"
                      maxLength={500}
                    />
                    <p className="text-xs text-[#9cc2db] mt-1">{negativePrompt.length}/500 characters</p>
                  </div>
                </div>

                {/* Generate Button */}
                <motion.div
                  whileHover={{ scale: isGenerating ? 1 : 1.05 }}
                  whileTap={{ scale: isGenerating ? 1 : 0.95 }}
                >
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full bg-[#f5724c] hover:bg-[#e55a35] text-white font-black text-xl py-6 rounded-full border-4 border-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        GENERATING...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💥</span>
                        BAM! GENERATE VIDEO
                      </div>
                    )}
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Video Panel */}
          <Card className="bg-[#2c3441] border-4 border-[#9cc2db] shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#9cc2db] rounded-full flex items-center justify-center">
                  <Clapperboard className="w-5 h-5 text-[#2c3441]" />
                </div>
                <h3 className="text-2xl font-black text-[#9cc2db] tracking-wide">GENERATED VIDEO</h3>
              </div>

              <div className="border-4 border-dashed border-[#9cc2db] rounded-lg p-8 min-h-[400px] flex flex-col items-center justify-center bg-[#39557a]">
                {isGenerating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="text-center"
                  >
                    <div className="w-24 h-24 bg-[#f5724c] rounded-full flex items-center justify-center mb-4 border-4 border-white">
                      <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </div>
                    <p className="text-[#9cc2db] font-bold text-lg">Creating your masterpiece...</p>
                    <p className="text-white text-sm mt-2">This usually takes 1-2 minutes</p>
                    <div className="mt-4 w-full max-w-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#f5724c] font-bold text-sm">Progress</span>
                        <span className="text-[#f5724c] font-bold text-sm">{generationProgress}%</span>
                      </div>
                      <div className="w-full bg-[#2c3441] rounded-full h-3 border-2 border-[#f5724c]">
                        <motion.div
                          className="bg-gradient-to-r from-[#f5724c] to-[#e55a35] h-full rounded-full flex items-center justify-end pr-1"
                          initial={{ width: "0%" }}
                          animate={{ width: `${generationProgress}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        >
                          {generationProgress > 15 && (
                            <span className="text-white text-xs font-bold">💥</span>
                          )}
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ) : generatedVideo ? (
                  <div className="w-full">
                    <video
                      controls
                      className="w-full rounded-lg border-4 border-white shadow-lg mb-4"
                      poster="/placeholder.svg?height=300&width=400&text=Generated+Video"
                    >
                      <source src={generatedVideo.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    <div className="flex gap-4">
                      <Button
                        onClick={handleDownload}
                        className="flex-1 bg-[#9cc2db] hover:bg-[#7ab3d3] text-[#2c3441] font-bold"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Video
                      </Button>
                    </div>
                    <p className="text-xs text-[#9cc2db] mt-2 text-center">
                      Note: We do not save created videos on our servers
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-[#9cc2db] rounded-lg flex items-center justify-center mb-4 border-4 border-white">
                      <Clapperboard className="w-12 h-12 text-[#2c3441]" />
                    </div>
                    <h4 className="text-[#9cc2db] font-bold text-xl mb-2">Your AI-generated video will appear here</h4>
                    <p className="text-white">Enter a prompt and click generate to start</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
