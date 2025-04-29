import nodemailer from "nodemailer"

interface EmailData {
  to: string
  subject: string
  body: string
  email: string
  password: string
  accountType: "personal" | "education"
}

export async function sendEmail(data: EmailData) {
  // Validate input
  if (!data.to || !data.subject || !data.body || !data.email || !data.password) {
    throw new Error("Missing required email fields")
  }

  // Configure transport based on account type
  let transportConfig

  if (data.accountType === "personal") {
    // Gmail configuration
    transportConfig = {
      service: "gmail",
      auth: {
        user: data.email,
        pass: data.password,
      },
    }
  } else if (data.accountType === "education") {
    // Education email configuration
    // Note: You might need to adjust this based on the specific education email provider
    transportConfig = {
      service: "outlook", // Change based on education email provider
      auth: {
        user: data.email,
        pass: data.password,
      },
    }
  } else {
    throw new Error("Invalid account type")
  }

  // Create transporter
  const transporter = nodemailer.createTransport(transportConfig)

  // Verify connection
  await transporter.verify().catch((error) => {
    console.error("Email verification failed:", error)
    throw new Error(`Email configuration error: ${error.message}`)
  })

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

  return {
    messageId: info.messageId,
    response: info.response,
  }
}
