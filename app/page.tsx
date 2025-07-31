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
  mode: "text" | "image"
  prompt?: string
  negativePrompt?: string
  resolution: "480P" | "1080P"
  aspectRatio?: "4:3" | "16:9" | "1:1" | "9:16" | "3:4" // Only for text mode
  imageUrl?: string // Only for image mode
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
  const [isEnhancing, setIsEnhancing] = useState(false)

  // Image-to-Video mode state
  const [mode, setMode] = useState<"text" | "image">("text")
  const [imageUrl, setImageUrl] = useState("")
  const [imagePreviewError, setImagePreviewError] = useState(false)

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
      <div className="min-h-screen bg-gradient-to-br from-[#39557a] via-[#2c3441] to-[#39557a] flex items-center justify-center relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-[#f5724c]/20 to-[#e55a35]/20 rounded-full blur-3xl floating-animation" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-[#9cc2db]/20 to-[#7ab3d3]/20 rounded-full blur-3xl floating-animation" style={{ animationDelay: '-3s' }} />

        <div className="text-center relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-r from-[#f5724c] to-[#e55a35] rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-2xl"
          >
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </motion.div>
          <p className="text-white text-xl font-bold">Loading that good shit...</p>
        </div>
      </div>
    )
  }

  // Show sign in page if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#39557a] via-[#2c3441] to-[#39557a] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-[#f5724c]/20 to-[#e55a35]/20 rounded-full blur-3xl floating-animation" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-[#9cc2db]/20 to-[#7ab3d3]/20 rounded-full blur-3xl floating-animation" style={{ animationDelay: '-3s' }} />

        <Card className="w-full max-w-md premium-card relative z-10 transform hover:scale-105 transition-all duration-300">
          <CardContent className="p-10 text-center">
            <div className="relative mb-6">
              <h1
                className="text-5xl font-black text-gradient mb-2"
                style={{ fontFamily: "Impact, Arial Black, sans-serif" }}
              >
                sixtyoneeighty
              </h1>
              <div className="absolute inset-0 text-5xl font-black blur-sm opacity-30 text-[#f5724c]"
                style={{ fontFamily: "Impact, Arial Black, sans-serif" }}
              >
                sixtyoneeighty
              </div>
            </div>

            <SignInButton mode="modal">
              <Button className="w-full bg-gradient-to-r from-[#f5724c] to-[#e55a35] hover:from-[#e55a35] hover:to-[#d94d2a] text-white font-bold py-4 text-xs sm:text-sm md:text-lg rounded-full border-2 border-white shadow-2xl transform hover:scale-105 transition-all duration-200 pulse-glow">
                Sign In to Make Some Pretty OK Videos
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
    // Validation based on mode
    if (mode === "text" && !prompt.trim()) {
      setError("Please enter a prompt")
      return
    }

    if (mode === "image" && !imageUrl.trim()) {
      setError("Please enter an image URL")
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedVideo(null)
    setGenerationProgress(0)

    try {
      const requestBody: VideoGenerationRequest = {
        mode,
        resolution,
        userId: user?.id,
        ...(negativePrompt.trim() && { negativePrompt: negativePrompt.trim() }),
        ...(mode === "text" && {
          prompt: prompt.trim(),
          aspectRatio,
        }),
        ...(mode === "image" && {
          imageUrl: imageUrl.trim(),
          ...(prompt.trim() && { prompt: prompt.trim() }),
        }),
      }

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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
    console.log("Download button clicked!", generatedVideo)
    if (!generatedVideo) {
      console.log("No generated video available")
      return
    }

    try {
      console.log("Fetching video from:", generatedVideo.url)
      const response = await fetch(generatedVideo.url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const blob = await response.blob()
      console.log("Blob created:", blob.size, "bytes")
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `generated-video-${generatedVideo.taskId}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      console.log("Download initiated successfully")
    } catch (err) {
      console.error("Download error:", err)
      setError("Failed to download video")
    }
  }

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt first")
      return
    }

    setIsEnhancing(true)
    setError(null)

    try {
      const response = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mode: mode
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to enhance prompt" }))
        throw new Error(errorData.error || "Failed to enhance prompt")
      }

      const data = await response.json()
      setPrompt(data.enhancedPrompt)
      if (data.negativePrompt) {
        setNegativePrompt(data.negativePrompt)
      }
    } catch (err) {
      console.error("Prompt enhancement error:", err)
      setError(err instanceof Error ? err.message : "Failed to enhance prompt")
    } finally {
      setIsEnhancing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#39557a] via-[#2c3441] to-[#39557a] relative overflow-hidden">
      {/* Enhanced background with multiple layers */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle, #9cc2db 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-[#f5724c]/20 to-[#e55a35]/20 rounded-full blur-3xl floating-animation" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-[#9cc2db]/20 to-[#7ab3d3]/20 rounded-full blur-3xl floating-animation" style={{ animationDelay: '-3s' }} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-[#f5724c]/10 to-[#9cc2db]/10 rounded-full blur-3xl floating-animation" style={{ animationDelay: '-1.5s' }} />

      {/* Enhanced User Header */}
      <div className="relative z-10 p-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-4 glass-effect rounded-full px-3 sm:px-6 py-2 sm:py-3">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 sm:border-3 border-[#f5724c] ring-1 sm:ring-2 ring-[#f5724c]/30">
              <AvatarImage src={user?.imageUrl || ""} />
              <AvatarFallback className="bg-gradient-to-br from-[#f5724c] to-[#e55a35] text-white text-xs sm:text-sm">
                {user?.fullName?.charAt(0) || <User className="w-3 h-3 sm:w-4 sm:h-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-white font-bold text-sm sm:text-lg">{user?.fullName || "User"}</p>
              <p className="text-[#9cc2db] text-xs sm:text-sm opacity-80 truncate max-w-[150px] sm:max-w-none">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          <div className="glass-effect rounded-full p-1 sm:p-2">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "border-2 border-[#9cc2db] hover:border-[#f5724c] transition-colors w-8 h-8 sm:w-10 sm:h-10"
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Success popup */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 bg-[#f5724c] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-black text-sm sm:text-lg shadow-lg border-2 sm:border-4 border-white"
          >
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 sm:w-6 sm:h-6" />
              <span className="text-xs sm:text-base">BAM! VIDEO READY!</span>
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
            className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 bg-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-black text-sm sm:text-lg shadow-lg border-2 sm:border-4 border-white cursor-pointer"
            onClick={() => setError(null)}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm sm:text-base">💥</span>
              <span className="text-xs sm:text-base truncate">OOPS! {error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-12 relative px-4">
          <div className="relative inline-block">
            <h1
              className="text-4xl sm:text-6xl md:text-8xl font-black text-gradient mb-2 tracking-wider transform -rotate-1 relative z-10"
              style={{
                fontFamily: "Impact, Arial Black, sans-serif",
                textShadow: "2px 2px 0px #2c3441, 4px 4px 0px rgba(0,0,0,0.3)",
              }}
            >
              sixtyoneeighty
            </h1>
            <div className="absolute inset-0 text-4xl sm:text-6xl md:text-8xl font-black tracking-wider transform -rotate-1 blur-sm opacity-30 text-[#f5724c]"
              style={{
                fontFamily: "Impact, Arial Black, sans-serif",
              }}
            >
              sixtyoneeighty
            </div>
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-6 tracking-wide opacity-90 px-4">
            NOT SO AWFUL VIDEO GENERATION
          </h2>
          <div className="inline-block relative">
            <div className="gradient-border pulse-glow">
              <div className="gradient-border-inner px-4 sm:px-8 py-2 sm:py-3 rounded-full">
                <span className="font-black text-xs sm:text-sm text-white tracking-wider">
                  ⚡ POWERED BY MOJO ⚡
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-8 max-w-7xl mx-auto">
          {/* Generate Video Panel */}
          <Card className="premium-card shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#f5724c] rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-black text-[#f5724c] tracking-wide">GENERATE VIDEO</h3>
              </div>

              {/* Mode Tabs */}
              <div className="flex mb-6 sm:mb-8 glass-effect rounded-xl p-1.5 sm:p-2 border border-[#9cc2db]/30">
                <motion.button
                  onClick={() => setMode("text")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-2 sm:py-3 px-3 sm:px-6 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 ${mode === "text"
                    ? "bg-gradient-to-r from-[#f5724c] to-[#e55a35] text-white shadow-lg"
                    : "text-[#9cc2db] hover:text-white hover:bg-white/10"
                    }`}
                >
                  Text-to-Video
                </motion.button>
                <motion.button
                  onClick={() => setMode("image")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-2 sm:py-3 px-3 sm:px-6 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 ${mode === "image"
                    ? "bg-gradient-to-r from-[#f5724c] to-[#e55a35] text-white shadow-lg"
                    : "text-[#9cc2db] hover:text-white hover:bg-white/10"
                    }`}
                >
                  Image-to-Video
                </motion.button>
              </div>

              <p className="text-[#9cc2db] mb-4 sm:mb-6 font-medium text-sm sm:text-base">
                {mode === "text"
                  ? "Create Decent 5 second videos from your text descriptions"
                  : "Transform your images into dynamic 5 second videos"
                }
              </p>

              <div className="space-y-4 sm:space-y-6">
                {/* Image URL (Image mode only) */}
                {mode === "image" && (
                  <div>
                    <Label htmlFor="imageUrl" className="text-[#f5724c] font-bold text-base sm:text-lg mb-2 block">
                      Image URL *
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <div className="flex-1">
                        <Input
                          id="imageUrl"
                          placeholder="https://example.com/your-image.jpg"
                          value={imageUrl}
                          onChange={(e) => {
                            setImageUrl(e.target.value)
                            setImagePreviewError(false)
                          }}
                          className="premium-input text-white placeholder:text-[#9cc2db] font-medium"
                        />
                        <p className="text-xs text-[#9cc2db] mt-1">
                          Must be publicly accessible. Supports JPEG, PNG, BMP, WEBP. Max 10MB, 360-2000px.
                        </p>
                      </div>
                      {/* Image Preview */}
                      {imageUrl && (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-[#9cc2db] rounded-lg overflow-hidden bg-[#39557a] flex items-center justify-center mx-auto sm:mx-0">
                          {!imagePreviewError ? (
                            <img
                              src={imageUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={() => setImagePreviewError(true)}
                            />
                          ) : (
                            <div className="text-[#9cc2db] text-xs text-center p-2">
                              <span className="block">❌</span>
                              <span>Invalid URL</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Prompt */}
                <div>
                  <Label htmlFor="prompt" className="text-[#f5724c] font-bold text-base sm:text-lg mb-2 block">
                    {mode === "text" ? "Prompt *" : "Prompt"}
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder={
                      mode === "text"
                        ? "Describe your video... (e.g., A kitten running in the moonlight)"
                        : "Describe the motion or action... (e.g., A cat running on the grass)"
                    }
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px] sm:min-h-[120px] premium-input text-white placeholder:text-[#9cc2db] font-medium resize-none text-sm sm:text-base"
                    maxLength={800}
                  />
                  <p className="text-xs text-[#9cc2db] mt-1">{prompt.length}/800 characters</p>

                  {/* Enhance Prompt Button - Available for both modes */}
                  <div className="mt-4">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleEnhancePrompt}
                        disabled={!prompt.trim() || isEnhancing}
                        className="bg-gradient-to-r from-[#f5724c] to-[#e55a35] hover:from-[#e55a35] hover:to-[#d94d2a] text-white font-bold border-2 border-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200"
                      >
                        {isEnhancing ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enhancing...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            ✨ Enhance Prompt
                          </div>
                        )}
                      </Button>
                    </motion.div>
                    {!prompt.trim() && (
                      <p className="text-xs text-[#9cc2db] mt-1">
                        {mode === "text"
                          ? "Enter a prompt to enhance it with cinematic details"
                          : "Enter a motion prompt to enhance it with camera movements"
                        }
                      </p>
                    )}
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="glass-effect p-4 sm:p-6 rounded-xl border border-[#9cc2db]/30">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <span className="text-lg sm:text-xl">⚙️</span>
                    <h4 className="text-[#f5724c] font-bold text-base sm:text-lg">ADVANCED SETTINGS</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div>
                      <Label className="text-[#f5724c] font-bold mb-2 block text-sm sm:text-base">Resolution</Label>
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

                    {/* Aspect Ratio (Text mode only) */}
                    {mode === "text" && (
                      <div>
                        <Label className="text-[#f5724c] font-bold mb-2 block text-sm sm:text-base">Aspect Ratio</Label>
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
                    )}
                  </div>

                  <div>
                    <Label htmlFor="negative-prompt" className="text-[#f5724c] font-bold mb-2 block text-sm sm:text-base">
                      Negative Prompt (Optional)
                    </Label>
                    <Input
                      id="negative-prompt"
                      placeholder="What should NOT appear in your video?"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      className="premium-input text-white placeholder:text-[#9cc2db] text-sm sm:text-base"
                      maxLength={500}
                    />
                    <p className="text-xs text-[#9cc2db] mt-1">{negativePrompt.length}/500 characters</p>
                  </div>
                </div>

                {/* Generate Button */}
                <motion.div
                  whileHover={{ scale: isGenerating ? 1 : 1.02 }}
                  whileTap={{ scale: isGenerating ? 1 : 0.98 }}
                >
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full bg-gradient-to-r from-[#f5724c] to-[#e55a35] hover:from-[#e55a35] hover:to-[#d94d2a] text-white font-black text-lg sm:text-xl py-6 sm:py-8 rounded-full border-2 sm:border-4 border-white shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 pulse-glow"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                        <span className="text-sm sm:text-base">GENERATING...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xl sm:text-2xl">💥</span>
                        <span className="text-sm sm:text-base">BAM! GENERATE THAT SHIT!</span>
                      </div>
                    )}
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Video Panel */}
          <Card className="premium-card shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#9cc2db] rounded-full flex items-center justify-center">
                  <Clapperboard className="w-4 h-4 sm:w-5 sm:h-5 text-[#2c3441]" />
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-[#9cc2db] tracking-wide">GENERATED VIDEO</h3>
              </div>

              <div className="border-2 border-dashed border-[#9cc2db]/50 rounded-xl p-4 sm:p-8 min-h-[300px] sm:min-h-[450px] flex flex-col items-center justify-center glass-effect relative overflow-hidden">
                {isGenerating ? (
                  <div className="text-center relative">
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-r from-[#f5724c] to-[#e55a35] rounded-full flex items-center justify-center mb-4 sm:mb-6 border-2 sm:border-4 border-white mx-auto shadow-2xl pulse-glow"
                    >
                      <Loader2 className="w-10 h-10 sm:w-14 sm:h-14 text-white animate-spin" />
                    </motion.div>
                    <p className="text-white font-bold text-lg sm:text-xl mb-2 px-4 text-center">Creating your masterpiece...</p>
                    <p className="text-[#9cc2db] text-sm sm:text-base opacity-80 px-4 text-center">This usually takes 1-2 minutes</p>
                    <div className="mt-4 sm:mt-6 w-full max-w-xs sm:max-w-sm mx-auto px-4">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <span className="text-[#f5724c] font-bold text-sm sm:text-base">Progress</span>
                        <span className="text-[#f5724c] font-bold text-sm sm:text-base">{generationProgress}%</span>
                      </div>
                      <div className="w-full bg-[#2c3441] rounded-full h-3 sm:h-4 border-2 border-[#f5724c] shadow-inner">
                        <motion.div
                          className="bg-gradient-to-r from-[#f5724c] via-[#e55a35] to-[#d94d2a] h-full rounded-full flex items-center justify-end pr-2 shadow-lg"
                          initial={{ width: "0%" }}
                          animate={{ width: `${generationProgress}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        >
                          {generationProgress > 15 && (
                            <motion.span
                              className="text-white text-sm font-bold"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
                            >
                              💥
                            </motion.span>
                          )}
                        </motion.div>
                      </div>
                    </div>
                  </div>
                ) : generatedVideo ? (
                  <motion.div
                    className="w-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="relative mb-6">
                      <video
                        controls
                        className="w-full rounded-xl border-4 border-white shadow-2xl"
                        poster="/placeholder.svg?height=300&width=400&text=Generated+Video"
                      >
                        <source src={generatedVideo.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#f5724c] to-[#e55a35] text-white px-3 py-1 rounded-full text-sm font-bold border-2 border-white shadow-lg">
                        ✨ Ready!
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Button
                        onClick={handleDownload}
                        className="flex-1 bg-gradient-to-r from-[#9cc2db] to-[#7ab3d3] hover:from-[#7ab3d3] hover:to-[#6ba3c7] text-[#2c3441] font-bold py-3 rounded-full border-2 border-white shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download Video
                      </Button>
                    </div>
                    <p className="text-sm text-[#9cc2db] mt-4 text-center opacity-80">
                      💡 Note: We do not save created videos on our servers
                    </p>
                  </motion.div>
                ) : (
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-[#9cc2db] to-[#7ab3d3] rounded-2xl flex items-center justify-center mb-6 border-4 border-white mx-auto shadow-2xl floating-animation">
                      <Clapperboard className="w-16 h-16 text-[#2c3441]" />
                    </div>
                    <h4 className="text-white font-bold text-2xl mb-3">Your AI-generated video will appear here</h4>
                    <p className="text-[#9cc2db] text-lg opacity-80">Enter a prompt and click generate to start creating them vidz</p>
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