"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-google-auth"
import { exchangeCodeForToken } from "@/lib/google-auth"
import { Loader2 } from "lucide-react"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUserAndStore } = useAuth() as any

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      const error = searchParams.get("error")

      if (error) {
        console.error("OAuth error:", error)
        router.push("/auth/signin?error=oauth_error")
        return
      }

      if (!code) {
        console.error("No authorization code received")
        router.push("/auth/signin?error=no_code")
        return
      }

      try {
        const user = await exchangeCodeForToken(code)
        if (user) {
          setUserAndStore(user)
          router.push("/")
        } else {
          router.push("/auth/signin?error=token_exchange_failed")
        }
      } catch (error) {
        console.error("Callback handling error:", error)
        router.push("/auth/signin?error=callback_error")
      }
    }

    handleCallback()
  }, [router, searchParams, setUserAndStore])

  return (
    <div className="min-h-screen bg-[#39557a] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#f5724c] mx-auto mb-4" />
        <p className="text-[#9cc2db] font-bold">Completing Google sign in...</p>
        <p className="text-white text-sm mt-2">Please wait while we set up your account</p>
      </div>
    </div>
  )
}
