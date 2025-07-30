// Fetch and analyze the Vercel logs
async function analyzeLogs() {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logs_result-OqOXFPfjxvpVWNrJUp7k4Y06Fg3S4X.csv",
    )
    const csvText = await response.text()

    // Parse CSV and find error details
    const lines = csvText.split("\n")
    const headers = lines[0].split(",")

    console.log("=== GOOGLE OAUTH ERROR ANALYSIS ===")

    // Find callback-related entries
    const callbackEntries = lines.filter(
      (line) => line.includes("/api/auth/google/callback") || line.includes("Token exchange") || line.includes("400"),
    )

    console.log(`Found ${callbackEntries.length} callback-related entries:`)

    callbackEntries.forEach((entry, index) => {
      const fields = entry.split(",")
      const timestamp = fields[0]
      const path = fields[2]
      const method = fields[3]
      const status = fields[4]
      const message = fields[fields.length - 10] // Approximate message field

      console.log(`\n${index + 1}. ${timestamp}`)
      console.log(`   Path: ${path}`)
      console.log(`   Method: ${method}`)
      console.log(`   Status: ${status}`)
      console.log(`   Message: ${message}`)
    })
  } catch (error) {
    console.error("Error analyzing logs:", error)
  }
}

analyzeLogs()
