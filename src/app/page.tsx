import type { Metadata } from "next"
import Index from "../components/Index"

export const metadata: Metadata = {
  title: "Email Sender API",
  description: "API for sending emails from the GPT Emailer Chrome extension",
}

export default function Home() {
  return (
   <Index/>
  )
}
