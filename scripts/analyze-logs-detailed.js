async function analyzeLogs() {
  try {
    console.log("=== DETAILED GOOGLE OAUTH ERROR ANALYSIS ===")

    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logs_result-OqOXFPfjxvpVWNrJUp7k4Y06Fg3S4X.csv",
    )
    const csvText = await response.text()

    const lines = csvText.split("\n")
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, ""))

    console.log("CSV Headers:", headers)

    const callbackEntries = []
    const errorEntries = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue

      // Parse CSV line (basic parsing)
      const values = line.split(",")
      if (values.length < headers.length) continue

      const entry = {}
      headers.forEach((header, index) => {
        entry[header] = values[index] ? values[index].replace(/"/g, "") : ""
      })

      // Look for callback-related entries
      if (entry.requestPath && entry.requestPath.includes("/api/auth/google/callback")) {
        callbackEntries.push(entry)

        if (
          entry.responseStatusCode === "400" ||
          entry.message?.includes("error") ||
          entry.message?.includes("failed")
        ) {
          errorEntries.push(entry)
        }
      }
    }

    console.log(`\nFound ${callbackEntries.length} callback-related entries:`)

    callbackEntries.slice(0, 10).forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.TimeUTC}`)
      console.log(`   Path: ${entry.requestPath}`)
      console.log(`   Method: ${entry.requestMethod}`)
      console.log(`   Status: ${entry.responseStatusCode || -1}`)
      console.log(`   Message: ${entry.message || "N/A"}`)
      console.log("")
    })

    console.log("=== ERROR PATTERNS ===")
    console.log(`Found ${errorEntries.length} error-related entries`)

    errorEntries.forEach((entry, index) => {
      console.log(
        `${index + 1}. ${JSON.stringify([
          entry.TimeUTC,
          entry.timestampInMs,
          entry.requestPath,
          entry.requestMethod,
          entry.requestQueryString,
          entry.responseStatusCode,
          entry.requestId,
          entry.requestUserAgent?.substring(0, 100) + "...",
        ])}`,
      )
    })
  } catch (error) {
    console.error("Error analyzing logs:", error)
  }
}

analyzeLogs()
