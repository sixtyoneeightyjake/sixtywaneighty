"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { exchangeCodeForToken } from "@/lib/google-auth"

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      try {
        const code = searchParams.get("code")
        const error = searchParams.get("error")

        if (error) {
          console.error("OAuth error:", error)
          setError(`Authentication error: ${error}`)
          return
        }

        if (!code) {
          console.error("No code received")
          setError("No authentication code received")
          return
        }

        console.log("Code received, exchanging for token...")
        const user = await exchangeCodeForToken(code)

        if (!user) {
          console.error("Failed to get user data")
          setError("Failed to exchange token. Please try again.")
          return
        }

        // Store user in localStorage
        localStorage.setItem("google-user", JSON.stringify(user))
        console.log("User authenticated:", user.email)

        // Redirect to home page
        router.push("/")
      } catch (error) {
        console.error("Callback error:", error)
        setError("Authentication failed. Please try again.")
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-700">
      <div className="bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        {error ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-red-400">Authentication Error</h2>
            <p className="text-red-300">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md"
            >
              Return to Home
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-blue-300">Authenticating...</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
            </div>
            <p className="text-gray-300">Please wait while we complete the sign-in process.</p>
          </div>
        )}
      </div>
    </div>
  )
}
