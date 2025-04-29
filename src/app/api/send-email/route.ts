import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    // Parse the incoming JSON data
    const data = await request.json()

    // Validate required fields
    if (!data.to || !data.subject || !data.body || !data.email || !data.password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Log the request (excluding sensitive data)
    console.log(`Received email request to: ${data.to}, subject: ${data.subject}`)

    // Configure email transport based on account type
    let transportConfig

    if (data.accountType === "personal") {
      // Gmail configuration for personal account
      transportConfig = {
        service: "gmail",
        auth: {
          user: data.email,
          pass: data.password, // App password for Gmail
        },
      }
    } else if (data.accountType === "education") {
      // Education email configuration (e.g., Outlook/Office365)
      transportConfig = {
        service: "gmail", // Change based on your education email provider
        auth: {
          user: data.email,
          pass: data.password,
        },
      }
    } else {
      return NextResponse.json({ error: "Invalid account type" }, { status: 400 })
    }

    // Create transporter
    const transporter = nodemailer.createTransport(transportConfig)

    // Set up email options
    const mailOptions = {
      from: data.email,
      to: data.to,
      subject: data.subject,
      text: data.body, // Plain text version
      html: data.body.replace(/\n/g, "<br>"), // HTML version with line breaks
    }

    // Send the email
    const info = await transporter.sendMail(mailOptions)

    console.log("Email sent successfully:", info.messageId)

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    })
  } catch (error) {
    console.error("Error sending email:", error)

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
