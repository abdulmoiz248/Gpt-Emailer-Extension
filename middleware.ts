import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the origin of the request
  const origin = request.headers.get("origin")

  // Create a new response
  const response = NextResponse.next()

  // Add CORS headers to the response
  response.headers.set("Access-Control-Allow-Origin", origin || "*")
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  response.headers.set("Access-Control-Allow-Credentials", "true")

  return response
}

// Only run the middleware for the API routes
export const config = {
  matcher: "/api/:path*",
}
