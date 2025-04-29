import { NextResponse } from "next/server"

export function handleApiError(error: unknown) {
  console.error("API Error:", error)

  // Determine the appropriate status code based on the error
  let statusCode = 500
  let message = "An unexpected error occurred"

  if (error instanceof Error) {
    message = error.message

    // Determine status code based on error message
    if (message.includes("Missing required") || message.includes("Invalid account")) {
      statusCode = 400
    } else if (message.includes("authentication") || message.includes("credentials")) {
      statusCode = 401
    } else if (message.includes("not allowed") || message.includes("forbidden")) {
      statusCode = 403
    }
  }

  return NextResponse.json({ success: false, error: message }, { status: statusCode })
}
