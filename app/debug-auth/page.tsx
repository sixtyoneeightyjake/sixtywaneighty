"use client"

export default function DebugAuth() {
  return (
    <div className="p-8">
      <h1>Auth Debug</h1>
      <div className="space-y-2">
        <p>Client ID exists: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? "✅" : "❌"}</p>
        <p>Client ID preview: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 20)}...</p>
        <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'Server side'}</p>
      </div>
    </div>
  )
}