// Background script for GPT Emailer
console.log("GPT Emailer background script loaded v8")

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received message:", request)

  // Handle email sending
  if (request.action === "sendEmail") {
    const { emailData, accountType } = request

    if (!emailData || !emailData.to || !emailData.subject || !emailData.body) {
      console.error("Invalid email data format:", emailData)
      sendResponse({ success: false, message: "Invalid email data format" })
      return true
    }

    // Get account credentials
    chrome.storage.sync.get([accountType + "Account"], (result) => {
      const account = result[accountType + "Account"]

      if (!account || !account.email || !account.password) {
        sendResponse({
          success: false,
          message: "Email account not configured. Please set up your accounts in the extension options.",
        })
        return
      }

      // Log the email sending attempt (without password)
      console.log(`Attempting to send email from ${account.email} to ${emailData.to}`)
      console.log(`Subject: ${emailData.subject}`)

      // Send to backend API instead of using smtpjs
      const backendUrl = "https://gpt-emailer-extension.vercel.app/api/send-email"

      const formData = {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        email: account.email,
        password: account.password,
        accountType: accountType,
      }

      fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((result) => {
          console.log("Email sending result:", result)

          if (result.success) {
            sendResponse({
              success: true,
              message: result.message || `Email sent successfully from ${account.email}!`,
            })
          } else {
            sendResponse({
              success: false,
              message: result.message || "Failed to send email",
            })
          }
        })
        .catch((error) => {
          console.error("Error sending email:", error)
          sendResponse({
            success: false,
            message: "Error sending email: " + (error.message || "Unknown error"),
          })
        })
    })

    return true // Keep the message channel open for async response
  }

  // Handle content script injection
  if (request.action === "injectContentScript") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && (tabs[0].url.includes("chat.openai.com") || tabs[0].url.includes("chatgpt.com"))) {
        // First check if content script is already loaded
        chrome.tabs.sendMessage(tabs[0].id, { action: "ping" }, (pingResponse) => {
          if (chrome.runtime.lastError) {
            // Content script is not loaded, inject it
            chrome.scripting
              .executeScript({
                target: { tabId: tabs[0].id },
                files: ["content.js"],
              })
              .then(() => {
                console.log("Content script manually injected")
                sendResponse({ success: true, message: "Content script injected" })
              })
              .catch((error) => {
                console.error("Error injecting content script:", error)
                sendResponse({ success: false, message: "Failed to inject content script" })
              })
          } else {
            // Content script is already loaded
            console.log("Content script already loaded")
            sendResponse({ success: true, message: "Content script already loaded" })
          }
        })
      } else {
        sendResponse({ success: false, message: "Not on ChatGPT page" })
      }
    })

    return true // Keep the message channel open for async response
  }

  return true
})

// Inject content script when visiting ChatGPT
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    (tab.url.includes("chat.openai.com") || tab.url.includes("chatgpt.com"))
  ) {
    console.log("ChatGPT page loaded, checking if content script needs injection")

    // Check if content script is already injected
    chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
      // If we get an error, the content script is not loaded
      if (chrome.runtime.lastError) {
        console.log("Content script not detected, injecting")
        chrome.scripting
          .executeScript({
            target: { tabId: tabId },
            files: ["content.js"],
          })
          .then(() => console.log("Content script injected on page load"))
          .catch((err) => console.error("Error injecting content script:", err))
      } else {
        console.log("Content script already loaded, skipping injection")
      }
    })
  }
})
