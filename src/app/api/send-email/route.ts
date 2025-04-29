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

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app password
      },
    });
 


   

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


   

  
