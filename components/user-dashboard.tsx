"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Video, Clock, CheckCircle, XCircle } from "lucide-react"

interface UserStats {
  id: number
  email: string
  total_videos: number
  successful_videos: number
  failed_videos: number
  last_generation: string
  total_logins: number
  last_login: string
}

interface VideoGeneration {
  id: number
  prompt: string
  resolution: string
  aspect_ratio: string
  status: string
  created_at: string
  completed_at: string
  error_message: string
}

interface UserDashboardProps {
  userId: number
}

export function UserDashboard({ userId }: UserDashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentVideos, setRecentVideos] = useState<VideoGeneration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/user/stats?userId=${userId}`)
        const data = await response.json()
        setStats(data.stats)
        setRecentVideos(data.recentVideos)
      } catch (error) {
        console.error("Failed to fetch user stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#f5724c]" />
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center p-8 text-[#9cc2db]">Failed to load user statistics</div>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "pending":
      case "processing":
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "failed":
        return "bg-red-500"
      case "pending":
      case "processing":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#2c3441] border-2 border-[#9cc2db]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-[#f5724c]" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_videos}</p>
                <p className="text-xs text-[#9cc2db]">Total Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2c3441] border-2 border-[#9cc2db]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.successful_videos}</p>
                <p className="text-xs text-[#9cc2db]">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2c3441] border-2 border-[#9cc2db]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.failed_videos}</p>
                <p className="text-xs text-[#9cc2db]">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2c3441] border-2 border-[#9cc2db]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#9cc2db]" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.total_logins}</p>
                <p className="text-xs text-[#9cc2db]">Total Logins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Videos */}
      <Card className="bg-[#2c3441] border-2 border-[#9cc2db]">
        <CardHeader>
          <CardTitle className="text-[#f5724c] font-bold">Recent Video Generations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentVideos.length === 0 ? (
              <p className="text-[#9cc2db] text-center py-4">No video generations yet</p>
            ) : (
              recentVideos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center justify-between p-3 bg-[#39557a] rounded border border-[#9cc2db]"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium truncate max-w-md">{video.prompt}</p>
                    <p className="text-xs text-[#9cc2db]">
                      {video.resolution} • {video.aspect_ratio} • {new Date(video.created_at).toLocaleString()}
                    </p>
                    {video.error_message && <p className="text-xs text-red-400 mt-1">{video.error_message}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(video.status)}
                    <Badge className={`${getStatusColor(video.status)} text-white text-xs`}>{video.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
