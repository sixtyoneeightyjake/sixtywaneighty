"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "There is a problem with the server configuration."
      case "AccessDenied":
        return "Access denied. You do not have permission to sign in."
      case "Verification":
        return "The verification token has expired or has already been used."
      default:
        return "An error occurred during authentication."
    }
  }

  return (
    <div className="min-h-screen bg-[#39557a] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#2c3441] border-4 border-[#9cc2db]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black text-red-400">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-6xl">😞</div>
          <p className="text-[#9cc2db]">{getErrorMessage(error)}</p>
          {error && (
            <div className="bg-red-900/20 p-3 rounded border border-red-500">
              <p className="text-red-400 text-sm">Error: {error}</p>
            </div>
          )}
          <div className="space-y-2">
            <Link href="/auth/signin">
              <Button className="w-full bg-[#f5724c] hover:bg-[#e55a35] text-white font-bold">Try Again</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full border-[#9cc2db] text-[#9cc2db] bg-transparent">
                Go Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
