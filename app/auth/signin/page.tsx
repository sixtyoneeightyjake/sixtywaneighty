"use client"

import { useAuth } from "@/hooks/use-google-auth"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function SignIn() {
  const { signIn, user, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for error from callback
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      switch (errorParam) {
        case "oauth_error":
          setError("OAuth authentication failed. Please try again.")
          break
        case "no_code":
          setError("No authorization code received. Please try again.")
          break
        case "token_exchange_failed":
          setError("Failed to exchange token. Please try again.")
          break
        case "callback_error":
          setError("Authentication callback failed. Please try again.")
          break
        default:
          setError("Authentication failed. Please try again.")
      }
    }
  }, [searchParams])

  // Redirect if already signed in
  useEffect(() => {
    if (user && !loading) {
      router.push("/")
    }
  }, [user, loading, router])

  const handleGoogleSignIn = () => {
    setError(null)
    try {
      signIn()
    } catch (err) {
      console.error("Google sign in error:", err)
      setError(err instanceof Error ? err.message : "Google sign in failed. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#39557a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#f5724c] mx-auto mb-4" />
          <p className="text-[#9cc2db]">Loading...</p>
        </div>
      </div>
    )
  }

  const isConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  return (
    <div className="min-h-screen bg-[#39557a] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#2c3441] border-4 border-[#9cc2db]">
        <CardHeader className="text-center">
          <CardTitle
            className="text-4xl font-black text-[#f5724c] mb-2"
            style={{ fontFamily: "Impact, Arial Black, sans-serif" }}
          >
            sixtywaneighty
          </CardTitle>
          <p className="text-[#9cc2db] font-bold">Sign in with Google to generate videos</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-900/20 p-3 rounded border border-red-500">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!isConfigured && (
            <div className="bg-yellow-900/20 p-3 rounded border border-yellow-500">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <p className="text-yellow-400 text-sm font-bold">Configuration Required</p>
              </div>
              <p className="text-yellow-300 text-xs mt-1">
                Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment variables.
              </p>
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            disabled={!isConfigured}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 border-2 border-gray-300 disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </div>
          </Button>

          <div className="mt-6 p-4 bg-[#39557a] rounded border border-[#9cc2db]">
            <p className="text-xs text-[#9cc2db] text-center mb-2">🔒 Simple & Secure:</p>
            <p className="text-xs text-white text-center">
              Custom Google OAuth implementation - no NextAuth complexity. Your data stays safe.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
