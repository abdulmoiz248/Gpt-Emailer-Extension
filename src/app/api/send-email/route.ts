import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!data.to || !data.subject || !data.body || !data.email || !data.password) {
      return new NextResponse(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        },
      })
    }

    console.log(`Received email request to: ${data.to}, subject: ${data.subject}`)

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const mailOptions = {
      from: data.email,
      to: data.to,
      subject: data.subject,
      text: data.body,
      html: data.body.replace(/\n/g, "<br>"),
    }

    const info = await transporter.sendMail(mailOptions)

    console.log("Email sent successfully:", info.messageId)

    return new NextResponse(JSON.stringify({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
    })
  } catch (error) {
    console.error("Error sending email:", error)

    return new NextResponse(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
    })
  }
}
