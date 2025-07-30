"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Play } from "lucide-react"

export default function TestPage() {
  const [prompt, setPrompt] = useState("A kitten running in the moonlight")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [resolution, setResolution] = useState("1080P")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testAPI = async () => {
    setLoading(true)
    setResult(null)
    setLogs([])

    addLog("🚀 Starting video generation test...")

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          negativePrompt: negativePrompt || undefined,
          resolution,
          aspectRatio,
        }),
      })

      addLog(`📡 API Response: ${response.status} ${response.statusText}`)

      const data = await response.json()
      setResult(data)

      if (data.url) {
        addLog("✅ Success! Video generated successfully")
      } else {
        addLog("❌ Failed: " + (data.error || "Unknown error"))
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error"
      addLog("💥 Network Error: " + errorMsg)
      setResult({ error: errorMsg })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#39557a] p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-[#2c3441] border-4 border-[#9cc2db] mb-6">
          <CardHeader>
            <CardTitle className="text-[#f5724c] text-2xl font-black">🧪 WAN 2.2 T2V API Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-[#f5724c] font-bold">Prompt (max 800 chars)</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your video..."
                className="bg-[#39557a] border-[#9cc2db] text-white"
                rows={3}
              />
              <p className="text-xs text-[#9cc2db] mt-1">{prompt.length}/800 characters</p>
            </div>

            <div>
              <Label className="text-[#f5724c] font-bold">Negative Prompt (optional, max 500 chars)</Label>
              <Input
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What should NOT appear..."
                className="bg-[#39557a] border-[#9cc2db] text-white"
              />
              <p className="text-xs text-[#9cc2db] mt-1">{negativePrompt.length}/500 characters</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#f5724c] font-bold">Resolution</Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger className="bg-[#39557a] border-[#9cc2db] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480P">480P</SelectItem>
                    <SelectItem value="1080P">1080P</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[#f5724c] font-bold">Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="bg-[#39557a] border-[#9cc2db] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                    <SelectItem value="4:3">4:3 (Classic)</SelectItem>
                    <SelectItem value="3:4">3:4 (Portrait Classic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={testAPI}
              disabled={loading || !prompt.trim()}
              className="w-full bg-[#f5724c] hover:bg-[#e55a35] text-white font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Video... (This takes 1-2 minutes)
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Test Video Generation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Logs */}
        {logs.length > 0 && (
          <Card className="bg-[#2c3441] border-4 border-[#9cc2db] mb-6">
            <CardHeader>
              <CardTitle className="text-[#9cc2db] text-lg">📋 Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black p-4 rounded font-mono text-sm text-green-400 max-h-40 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <Card className="bg-[#2c3441] border-4 border-[#9cc2db]">
            <CardHeader>
              <CardTitle className="text-[#9cc2db] text-lg">{result.url ? "✅ Success!" : "❌ Error"}</CardTitle>
            </CardHeader>
            <CardContent>
              {result.url ? (
                <div>
                  <video controls className="w-full max-w-md mx-auto rounded border-4 border-white mb-4">
                    <source src={result.url} type="video/mp4" />
                  </video>
                  <p className="text-[#9cc2db] text-sm">Video URL: {result.url}</p>
                  <p className="text-[#9cc2db] text-sm">Task ID: {result.taskId}</p>
                </div>
              ) : (
                <div className="bg-red-900/20 p-4 rounded border border-red-500">
                  <p className="text-red-400 font-bold">Error:</p>
                  <pre className="text-red-300 text-sm mt-2">{JSON.stringify(result, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
