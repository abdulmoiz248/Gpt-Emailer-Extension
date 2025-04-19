// Simple background script that handles email sending
console.log("GPT Emailer background script loaded")

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

      // Simulate email sending (in a real extension, you'd use an email API here)
      // Simulate a delay and send success response
      
      setTimeout(() => {
        sendResponse({ success: true, message: "Email sent successfully!" })
      }, 1000)
    })

    return true // Keep the message channel open for async response
  }

  // Handle content script injection
  if (request.action === "injectContentScript") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && (tabs[0].url.includes("chat.openai.com") || tabs[0].url.includes("chatgpt.com"))) {
        chrome.scripting
          .executeScript({
            target: { tabId: tabs[0].id },
            files: ["content.js"],
          })
          .then(() => {
            sendResponse({ success: true, message: "Content script injected" })
          })
          .catch((error) => {
            console.error("Error injecting content script:", error)
            sendResponse({ success: false, message: "Failed to inject content script" })
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
    console.log("ChatGPT page loaded, injecting content script")
    chrome.scripting
      .executeScript({
        target: { tabId: tabId },
        files: ["content.js"],
      })
      .then(() => console.log("Content script injected on page load"))
      .catch((err) => console.error("Error injecting content script:", err))
  }
})
