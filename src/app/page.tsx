import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Email Sender API",
  description: "API for sending emails from the GPT Emailer Chrome extension",
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col">
        <h1 className="text-4xl font-bold mb-8 text-center">GPT Emailer API</h1>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-2xl">
          <h2 className="text-2xl font-semibold mb-4">API Documentation</h2>

          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2">Send Email Endpoint</h3>
            <p className="mb-2">
              <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">POST /api/send-email</code>
            </p>
            <p className="mb-4">Sends an email using the provided credentials and email data.</p>

            <h4 className="font-medium mb-2">Request Body:</h4>
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-x-auto mb-4">
              {`{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "body": "Email body content",
  "email": "your-email@gmail.com",
  "password": "your-app-password",
  "accountType": "personal" // or "education"
}`}
            </pre>

            <h4 className="font-medium mb-2">Response:</h4>
            <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-x-auto">
              {`{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "unique-message-id"
}`}
            </pre>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2">Error Handling</h3>
            <p>The API returns appropriate error messages and status codes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>400 - Bad Request (missing fields or invalid account type)</li>
              <li>500 - Server Error (email sending failed)</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
            <h3 className="text-lg font-medium mb-2">⚠️ Security Note</h3>
            <p>
              This API handles email credentials. Ensure you're using HTTPS and consider implementing additional
              security measures like API keys or authentication for production use.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p>
            Status: <span className="text-green-500 font-medium">API Running</span>
          </p>
        </div>
      </div>
    </main>
  )
}
