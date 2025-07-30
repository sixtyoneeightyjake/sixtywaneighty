"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { exchangeCodeForToken } from "@/lib/google-auth"
import { useAuthProvider } from "@/hooks/use-google-auth"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUserAndStore } = useAuthProvider()

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("🔄 Auth callback page loaded")

        const code = searchParams.get("code")
        const error = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        // Debug info
        const debug = {
          url: window.location.href,
          searchParams: Object.fromEntries(searchParams.entries()),
          timestamp: new Date().toISOString(),
        }
        setDebugInfo(debug)
        console.log("🔍 Debug info:", debug)

        if (error) {
          console.error("❌ OAuth error from Google:", error, errorDescription)
          setStatus("error")
          setMessage(`Google OAuth error: ${error}. ${errorDescription || ""}`)
          return
        }

        if (!code) {
          console.error("❌ No authorization code received")
          setStatus("error")
          setMessage("No authorization code received from Google")
          return
        }

        console.log("✅ Authorization code received:", code.substring(0, 20) + "...")
        setMessage("Exchanging authorization code for access token...")

        const user = await exchangeCodeForToken(code)

        if (user) {
          console.log("✅ User authenticated successfully:", user.email)
          setUserAndStore(user)
          setStatus("success")
          setMessage(`Welcome, ${user.name}! Redirecting to dashboard...`)

          // Redirect to main page after success
          setTimeout(() => {
            router.push("/")
          }, 2000)
        } else {
          console.error("❌ Failed to get user from token exchange")
          setStatus("error")
          setMessage("Failed to authenticate with Google. Please try again.")
        }
      } catch (error) {
        console.error("💥 Auth callback error:", error)
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "An unexpected error occurred")
      }
    }

    handleCallback()
  }, [searchParams, router, setUserAndStore])

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "error":
        return <XCircle className="h-6 w-6 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "border-blue-200 bg-blue-50"
      case "success":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className={`${getStatusColor()}`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">{getStatusIcon()}</div>
            <CardTitle>
              {status === "loading" && "Authenticating..."}
              {status === "success" && "Authentication Successful!"}
              {status === "error" && "Authentication Failed"}
            </CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>

          {status === "error" && (
            <CardContent className="space-y-4">
              <Button onClick={() => router.push("/auth/signin")} className="w-full">
                Try Again
              </Button>

              <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                Go Home
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Debug Information */}
        {debugInfo && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Status Messages */}
        {status === "loading" && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Please wait while we complete your authentication...</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
