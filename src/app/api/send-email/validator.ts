export interface EmailRequestData {
  to: string
  subject: string
  body: string
  email: string
  password: string
  accountType: string
}

export function validateEmailRequest(data: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = []

  // Check required fields
  if (!data.to) errors.push("Recipient email is required")
  if (!data.subject) errors.push("Email subject is required")
  if (!data.body) errors.push("Email body is required")
  if (!data.email) errors.push("Sender email is required")
  if (!data.password) errors.push("Email password is required")
  if (!data.accountType) errors.push("Account type is required")

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (data.to && !emailRegex.test(data.to)) {
    errors.push("Invalid recipient email format")
  }
  if (data.email && !emailRegex.test(data.email)) {
    errors.push("Invalid sender email format")
  }

  // Validate account type
  if (data.accountType && !["personal", "education"].includes(data.accountType)) {
    errors.push('Account type must be either "personal" or "education"')
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}
