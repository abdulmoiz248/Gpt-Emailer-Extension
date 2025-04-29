// GPT Emailer Content Script
console.log("GPT Emailer content script loaded v11")

// Global variables for state management
const processedMessageIds = new Set() // Track which messages we've already processed
let popupCurrentlyShown = false
let processingInProgress = false
const BACKEND_URL = "https://gpt-emailer-extension.vercel.app/api/send-email" // Backend URL to send email data

// Function to detect and extract email data from ChatGPT responses
function detectEmailData() {
  // Don't detect if popup is already shown or processing is in progress
  if (popupCurrentlyShown || processingInProgress) return

  processingInProgress = true
  console.log("Checking for email data in page")

  try {
    // Look for message elements that might contain the email data
    const messages = document.querySelectorAll(
      '.markdown-content, .prose, div[data-message-author-role="assistant"], .text-message, .message-content',
    )

    messages.forEach((message) => {
      // Generate a more reliable unique identifier for the message
      const messageContent = message.textContent || ""
      const messageId = generateMessageId(message, messageContent)

      // Skip if we've already processed this message
      if (processedMessageIds.has(messageId)) return

      // Check if this message contains the sendEmail keyword at the beginning
      if (messageContent.trim().startsWith("sendEmail")) {
        console.log("Found NEW message with sendEmail keyword")

        // Mark this message as processed immediately to prevent duplicate processing
        processedMessageIds.add(messageId)

        // Try to find JSON in the message
        const jsonMatch =
          messageContent.match(/sendEmail\s*```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
          messageContent.match(/sendEmail\s*(\{[\s\S]*?\})/) ||
          messageContent.match(/```(?:json)?\s*(\{[\s\S]*?"to"[\s\S]*?\})\s*```/)

        if (jsonMatch && jsonMatch[1]) {
          try {
            // Parse the JSON data
            const jsonStr = jsonMatch[1].trim()
            console.log("Extracted JSON string:", jsonStr)

            // Handle escaped quotes and newlines that might be in the JSON
            const cleanedJson = jsonStr.replace(/\\"/g, '"').replace(/\\n/g, "\n")

            const emailData = JSON.parse(cleanedJson)
            console.log("Parsed email data:", emailData)

            if (emailData.to && emailData.subject && emailData.body) {
              // Store the email data temporarily
              chrome.storage.local.set({ currentEmailData: emailData }, () => {
                console.log("Email data stored in local storage")
                // Open the popup to select account
                showAccountSelectionPopup(emailData)
              })
              return // Exit after finding valid email data
            }
          } catch (error) {
            console.error("Error parsing email data:", error)
          }
        } else {
          console.log("No valid JSON format found in the message")

          // Try to extract JSON directly from code blocks
          const codeBlocks = message.querySelectorAll("pre code, code")

          for (const codeBlock of codeBlocks) {
            const codeText = codeBlock.textContent || ""
            if (codeText.includes('"to"') && codeText.includes('"subject"') && codeText.includes('"body"')) {
              try {
                const emailData = JSON.parse(codeText)
                console.log("Parsed email data from code block:", emailData)

                if (emailData.to && emailData.subject && emailData.body) {
                  chrome.storage.local.set({ currentEmailData: emailData }, () => {
                    console.log("Email data stored in local storage")
                    showAccountSelectionPopup(emailData)
                  })
                  return // Exit after finding valid email data
                }
              } catch (error) {
                console.error("Error parsing code block:", error)
              }
            }
          }
        }
      }
    })
  } finally {
    processingInProgress = false
  }
}

// Generate a more reliable unique identifier for a message element
function generateMessageId(element, content) {
  // Create a hash from the first 100 chars of content to make it more unique
  const contentHash = hashString(content.substring(0, 100))

  // Get position in parent to help with uniqueness
  const position = Array.from(element.parentNode?.children || []).indexOf(element)

  // Use any existing IDs if available
  const elementId = element.id || element.dataset.messageId || ""

  return `msg_${elementId}_${contentHash}_${position}`
}

// Simple string hashing function
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

// Function to show the account selection popup
function showAccountSelectionPopup(emailData) {
  console.log("Showing account selection popup")

  // Set flag to prevent multiple popups
  popupCurrentlyShown = true

  // Remove any existing popups
  const existingPopup = document.getElementById("gpt-emailer-popup")
  if (existingPopup) {
    existingPopup.remove()
  }

  // Create popup container
  const popup = document.createElement("div")
  popup.id = "gpt-emailer-popup"
  popup.className = "gpt-emailer-popup"

  // Create popup content with email preview
  popup.innerHTML = `
    <div class="gpt-emailer-popup-content">
      <div class="gpt-emailer-popup-header">
        <h2>Send Email</h2>
        <button id="gpt-emailer-close-btn" class="gpt-emailer-close-btn">&times;</button>
      </div>
      
      <div class="gpt-emailer-email-preview">
        <div><strong>To:</strong> ${emailData.to}</div>
        <div><strong>Subject:</strong> ${emailData.subject}</div>
        <div class="gpt-emailer-email-body"><strong>Body:</strong> <div class="email-body-content">${emailData.body.replace(/\n/g, "<br>")}</div></div>
      </div>
      
      <p>Choose which account to send from:</p>
      <div class="gpt-emailer-account-buttons">
        <button id="personal-account-btn" class="gpt-emailer-btn">Personal Account</button>
        <button id="education-account-btn" class="gpt-emailer-btn">Education Account</button>
      </div>
      <button id="gpt-emailer-cancel-btn" class="gpt-emailer-btn gpt-emailer-cancel-btn">Cancel</button>
    </div>
  `

  // Add popup to the page
  document.body.appendChild(popup)

  // Add event listeners to buttons
  const personalAccountBtn = document.getElementById("personal-account-btn")
  if (personalAccountBtn) {
    personalAccountBtn.addEventListener("click", () => {
      sendEmailWithSelectedAccount("personal", emailData)
    })
  }

  const educationAccountBtn = document.getElementById("education-account-btn")
  if (educationAccountBtn) {
    educationAccountBtn.addEventListener("click", () => {
      sendEmailWithSelectedAccount("education", emailData)
    })
  }

  const cancelBtn = document.getElementById("gpt-emailer-cancel-btn")
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      closePopup()
    })
  }

  const closeBtn = document.getElementById("gpt-emailer-close-btn")
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closePopup()
    })
  }

  // Add styles for the popup
  addStyles()

  // Also close popup when clicking outside
  popup.addEventListener("click", (event) => {
    if (event.target === popup) {
      closePopup()
    }
  })
}

function closePopup() {
  const popup = document.getElementById("gpt-emailer-popup")
  if (popup) {
    popup.remove()
  }

  // Reset popup flag
  popupCurrentlyShown = false
}

// Function to add styles
function addStyles() {
  // Check if styles already exist
  if (document.getElementById("gpt-emailer-styles")) return

  const style = document.createElement("style")
  style.id = "gpt-emailer-styles"
  style.textContent =`
  .gpt-emailer-email-preview {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  margin: 24px 0;
  text-align: left;
  border: 1px solid #cccccc;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  color: #333333;
  font-size: 16px;
}

.gpt-emailer-email-preview div {
  margin-bottom: 16px;
  font-size: 16px;
  line-height: 1.6;
  color: #333333;
}

.gpt-emailer-email-body {
  max-height: 180px;
  overflow-y: auto;
  white-space: pre-wrap;
  padding: 16px;
  background-color: #ffffff;
  color: #333333;
  border-radius: 8px;
  border: 1px solid #dddddd;
  scrollbar-width: thin;
  scrollbar-color: #10a37f #f0f0f0;
}

.email-body-content {
  white-space: pre-wrap;
  background-color: #ffffff;
  color: #333333;
  line-height: 1.6;
  font-family: Arial, sans-serif;
  font-size: 15px;
}

/* Email preview specific elements */
.gpt-emailer-email-to,
.gpt-emailer-email-subject {
  padding: 8px 0;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  align-items: center;
}

.gpt-emailer-email-to strong,
.gpt-emailer-email-subject strong {
  min-width: 80px;
  font-weight: 600;
  color: #555555;
}

.gpt-emailer-account-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 28px 0;
}

.gpt-emailer-account-buttons .gpt-emailer-btn {
  background-color: #10a37f;
  color: white;
  box-shadow: 0 4px 12px rgba(16, 163, 127, 0.3);
  font-weight: 600;
  font-size: 18px;
  padding: 16px 24px;
  border-radius: 12px;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.gpt-emailer-account-buttons .gpt-emailer-btn:hover {
  background-color: #0d8c6d;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 163, 127, 0.4);
}`
  document.head.appendChild(style)
}

// Function to send email with selected account
function sendEmailWithSelectedAccount(accountType, emailData) {
  console.log(`Sending email with ${accountType} account`)

  // Close popup before sending
  closePopup()

  // Show sending toast
  showToast("Sending email data to backend...", "info")

  // Get account credentials
  chrome.storage.sync.get([accountType + "Account"], (result) => {
    const account = result[accountType + "Account"]

    if (!account || !account.email || !account.password) {
      showToast("Email account not configured. Please set up your accounts in the extension options.", "error")
      return
    }

    // Prepare data to send to backend
    const dataToSend = {
      to: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
      email: account.email,
      password: account.password,
      accountType: accountType,
    }
     
    console.log("Sending data to backend:", { ...dataToSend, password: "***" })
         
    // Send data to backend
    fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        console.log("Backend response:", data)
        showToast(data.message || "Email sent successfully!", "success")
      })
      .catch((error) => {
        console.error("Error sending to backend:", error)
        showToast("Failed to send email data to backend: " + error.message, "error")
      })
  })
}

// Function to show toast notifications
function showToast(message, type = "info") {
  console.log(`Showing toast: ${message} (${type})`)

  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById("gpt-emailer-toast-container")

  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.id = "gpt-emailer-toast-container"
    toastContainer.className = "gpt-emailer-toast-container"
    document.body.appendChild(toastContainer)
  }

  // Create toast element
  const toast = document.createElement("div")
  toast.className = `gpt-emailer-toast gpt-emailer-toast-${type}`
  toast.textContent = message

  // Set background color based on type
  if (type === "success") {
    toast.style.backgroundColor = "#10a37f"
    toast.style.border = "1px solid #0d8c6d"
  } else if (type === "error") {
    toast.style.backgroundColor = "#e53935"
    toast.style.border = "1px solid #c62828"
  } else {
    toast.style.backgroundColor = "#2196f3"
    toast.style.border = "1px solid #1976d2"
  }

  // Add toast to container
  toastContainer.appendChild(toast)

  // Remove toast after 5 seconds
  setTimeout(() => {
    toast.style.animation = "gpt-emailer-toast-fade-out 0.3s ease-out forwards"
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }, 5000)
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "manualDetection") {
    console.log("Received manual detection request")
    // Reset flags for manual detection
    popupCurrentlyShown = false
    processingInProgress = false
    // Clear processed messages to force re-detection
    processedMessageIds.clear()
    detectEmailData()
    sendResponse({ success: true, message: "Manual detection triggered" })
  }

  if (request.action === "detectEmail") {
    // Reset flags for detection
    popupCurrentlyShown = false
    processingInProgress = false
    detectEmailData()
    sendResponse({ success: true })
  }

  return true
})

// Set up a MutationObserver to detect when new messages are added
const observer = new MutationObserver((mutations) => {
  if (!popupCurrentlyShown && !processingInProgress) {
    // Check if any new message elements were added
    let newMessagesAdded = false

    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if this is a message element or contains message elements
            if (
              node.classList &&
              (node.classList.contains("markdown-content") ||
                node.classList.contains("prose") ||
                node.classList.contains("message-content"))
            ) {
              newMessagesAdded = true
              break
            }

            // Check for message elements inside the added node
            const messageElements = node.querySelectorAll(
              '.markdown-content, .prose, div[data-message-author-role="assistant"], .text-message, .message-content',
            )

            if (messageElements.length > 0) {
              newMessagesAdded = true
              break
            }
          }
        }
      }

      if (newMessagesAdded) break
    }

    if (newMessagesAdded) {
      console.log("New message elements detected, checking for email data")
      setTimeout(detectEmailData, 500) // Small delay to ensure content is fully rendered
    }
  }
})

// Start observing the document body for changes
observer.observe(document.body, {
  childList: true,
  subtree: true,
})

// Modify the initial detection delay to ensure it doesn't run too early:

// Initial check when the script loads - with a longer delay to ensure page is fully loaded
setTimeout(() => {
  console.log("Running initial email detection check")
  detectEmailData()
}, 3000)

// Notify that content script is loaded
chrome.runtime.sendMessage({ action: "contentScriptLoaded" })

// Add a listener for the ping message at the end of the file:

// Listen for ping to check if content script is loaded
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ping") {
    sendResponse({ status: "alive" })
  }
  return true
})
