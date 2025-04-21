// GPT Emailer Content Script
console.log("GPT Emailer content script loaded v7")

// Global variables for state management
let lastProcessedContent = ""
let lastEmailSentTimestamp = 0
let popupCurrentlyShown = false
const DETECTION_COOLDOWN = 15000 // 15 seconds cooldown after sending email

// Function to detect and extract email data from ChatGPT responses
function detectEmailData() {
  // Don't detect if we recently sent an email (cooldown period)
  const now = Date.now()
  if (now - lastEmailSentTimestamp < DETECTION_COOLDOWN) return

  // Don't detect if popup is already shown
  if (popupCurrentlyShown) return

  console.log("Checking for email data in page")

  // Look for elements that might contain the email data
  const messages = document.querySelectorAll(
    '.markdown-content, .prose, div[data-message-author-role="assistant"], .text-message, .message-content, pre, code, p, .text-base',
  )

  let foundEmailData = false
  let currentPageContent = ""

  messages.forEach((message) => {
    currentPageContent += message.textContent || ""
  })

  // If we've already processed this exact content, skip
  if (currentPageContent === lastProcessedContent) {
    return
  }

  messages.forEach((message) => {
    if (foundEmailData) return

    const content = message.textContent || ""

    // Check if this message contains the sendEmail keyword
    if (content.includes("sendEmail")) {
      console.log("Found message with sendEmail keyword")

      // Try to find JSON in the message
      // This regex is more flexible to match different JSON formats ChatGPT might produce
      const jsonMatch =
        content.match(/sendEmail\s*```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
        content.match(/sendEmail\s*(\{[\s\S]*?\})/) ||
        content.match(/```(?:json)?\s*(\{[\s\S]*?"to"[\s\S]*?\})\s*```/)

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
            foundEmailData = true
            lastProcessedContent = currentPageContent

            // Store the email data temporarily
            chrome.storage.local.set({ currentEmailData: emailData }, () => {
              console.log("Email data stored in local storage")
              // Open the popup to select account
              showAccountSelectionPopup(emailData)
            })
          }
        } catch (error) {
          console.error("Error parsing email data:", error)
        }
      } else {
        console.log("No valid JSON format found in the message")

        // Try to extract JSON directly from code blocks
        const codeBlocks = document.querySelectorAll("pre code, code")

        codeBlocks.forEach((codeBlock) => {
          if (foundEmailData) return

          const codeText = codeBlock.textContent || ""
          if (codeText.includes('"to"') && codeText.includes('"subject"') && codeText.includes('"body"')) {
            try {
              const emailData = JSON.parse(codeText)
              console.log("Parsed email data from code block:", emailData)

              if (emailData.to && emailData.subject && emailData.body) {
                foundEmailData = true
                lastProcessedContent = currentPageContent

                chrome.storage.local.set({ currentEmailData: emailData }, () => {
                  console.log("Email data stored in local storage")
                  showAccountSelectionPopup(emailData)
                })
              }
            } catch (error) {
              console.error("Error parsing code block:", error)
            }
          }
        })
      }
    }
  })

  if (!foundEmailData) {
    // Try a more aggressive approach - look for any JSON with email-like structure
    const allText = document.body.textContent || ""
    const jsonBlocks = allText.match(/\{[\s\S]*?"to"[\s\S]*?"subject"[\s\S]*?"body"[\s\S]*?\}/g)

    if (jsonBlocks && jsonBlocks.length > 0) {
      jsonBlocks.forEach((jsonBlock) => {
        if (foundEmailData) return

        try {
          const emailData = JSON.parse(jsonBlock)
          if (emailData.to && emailData.subject && emailData.body) {
            console.log("Found email data in page text:", emailData)
            foundEmailData = true
            lastProcessedContent = currentPageContent

            chrome.storage.local.set({ currentEmailData: emailData }, () => {
              showAccountSelectionPopup(emailData)
            })
          }
        } catch (error) {
          // Ignore parsing errors in this aggressive approach
        }
      })
    }
  }
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
        <div class="gpt-emailer-email-body"><strong>Body:</strong> ${emailData.body}</div>
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
      sendEmailWithSelectedAccount("personal")
    })
  }

  const educationAccountBtn = document.getElementById("education-account-btn")
  if (educationAccountBtn) {
    educationAccountBtn.addEventListener("click", () => {
      sendEmailWithSelectedAccount("education")
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

  // Set cooldown to prevent immediate re-detection
  lastEmailSentTimestamp = Date.now()
}

// Function to add styles
function addStyles() {
  // Check if styles already exist
  if (document.getElementById("gpt-emailer-styles")) return

  const style = document.createElement("style")
  style.id = "gpt-emailer-styles"
  style.textContent = `
    .gpt-emailer-popup {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: Arial, sans-serif;
    }
    
    .gpt-emailer-popup-content {
      background-color: #ffffff;
      padding: 28px;
      border-radius: 12px;
      box-shadow: 0 6px 30px rgba(0, 0, 0, 0.4);
      max-width: 550px;
      width: 90%;
      text-align: center;
      border: 3px solid #10a37f;
      position: relative;
    }
    
    .gpt-emailer-popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 12px;
    }
    
    .gpt-emailer-popup h2 {
      margin: 0;
      color: #10a37f;
      font-size: 28px;
      font-weight: bold;
    }
    
    .gpt-emailer-close-btn {
      background: #f0f0f0;
      border: none;
      color: #333;
      font-size: 28px;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    }
    
    .gpt-emailer-close-btn:hover {
      background-color: #e0e0e0;
      color: #000;
      transform: scale(1.1);
    }
    
    .gpt-emailer-email-preview {
      background-color: #f5f5f5;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: left;
      border: 1px solid #ddd;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .gpt-emailer-email-preview div {
      margin-bottom: 12px;
      font-size: 16px;
    }
    
    .gpt-emailer-email-body {
      max-height: 150px;
      overflow-y: auto;
      white-space: pre-wrap;
      padding: 12px;
      background-color: #ffffff;
      border-radius: 6px;
      border: 1px solid #eee;
    }
    
    .gpt-emailer-account-buttons {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin: 24px 0;
    }
    
    .gpt-emailer-btn {
      padding: 16px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      transition: all 0.2s;
    }
    
    .gpt-emailer-account-buttons .gpt-emailer-btn {
      background-color: #10a37f;
      color: white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .gpt-emailer-account-buttons .gpt-emailer-btn:hover {
      background-color: #0d8c6d;
      transform: translateY(-3px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.3);
    }
    
    .gpt-emailer-cancel-btn {
      background-color: #f0f0f0;
      color: #333;
      margin-top: 12px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .gpt-emailer-cancel-btn:hover {
      background-color: #e0e0e0;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .gpt-emailer-toast-container {
      position: fixed;
      bottom: 30px;
      right: 30px;
      z-index: 10001;
    }
    
    .gpt-emailer-toast {
      padding: 16px 20px;
      margin-top: 12px;
      border-radius: 8px;
      color: white;
      font-size: 16px;
      font-weight: bold;
      max-width: 350px;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
      animation: gpt-emailer-toast-fade-in 0.3s ease-out forwards;
    }
    
    @keyframes gpt-emailer-toast-fade-in {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes gpt-emailer-toast-fade-out {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-20px); }
    }
  `

  document.head.appendChild(style)
}

// Function to send email with selected account
function sendEmailWithSelectedAccount(accountType) {
  console.log(`Sending email with ${accountType} account`)

  // Update the timestamp to prevent immediate re-detection
  lastEmailSentTimestamp = Date.now()

  // Get the stored email data
  chrome.storage.local.get(["currentEmailData"], (result) => {
    const emailData = result.currentEmailData

    if (!emailData) {
      showToast("No email data found. Please try again later.", "error")
      closePopup()
      return
    }

    // Close popup before sending to prevent multiple popups
    closePopup()

    // Show sending toast
    showToast("Sending email...", "info")

    // Send message to background script to handle email sending
    chrome.runtime.sendMessage({ action: "sendEmail", emailData, accountType }, (response) => {
      console.log("Received response from background script:", response)

      // Show success or error toast
      if (response && response.success) {
        showToast(response.message || "Email sent successfully!", "success")
      } else {
        showToast(response?.message || "Failed to send email. Please try again.", "error")
      }
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

// Add a click event listener to detect when the user clicks the "sendEmail" button
document.addEventListener("click", (event) => {
  // Check if the clicked element is a button or has text content containing "sendEmail"
  if (
    event.target &&
    (event.target.tagName === "BUTTON" || (event.target.textContent && event.target.textContent.includes("sendEmail")))
  ) {
    console.log("Detected click on sendEmail element")
    setTimeout(detectEmailData, 500)
  }
})

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "manualDetection") {
    console.log("Received manual detection request")
    // Force detection even if cooldown is active
    lastEmailSentTimestamp = 0
    lastProcessedContent = "" // Reset processed content to force detection
    popupCurrentlyShown = false // Reset popup flag
    detectEmailData()
    sendResponse({ success: true, message: "Manual detection triggered" })
  }

  if (request.action === "detectEmail") {
    // Force detection even if cooldown is active
    lastEmailSentTimestamp = 0
    lastProcessedContent = "" // Reset processed content to force detection
    popupCurrentlyShown = false // Reset popup flag
    detectEmailData()
    sendResponse({ success: true })
  }

  return true
})

// Set up a MutationObserver to detect when new messages are added
const observer = new MutationObserver((mutations) => {
  // Check if we're in the cooldown period
  const now = Date.now()
  if (now - lastEmailSentTimestamp >= DETECTION_COOLDOWN && !popupCurrentlyShown) {
    // Wait a bit for the DOM to settle
    setTimeout(detectEmailData, 500)
  }
})

// Start observing the document body for changes
observer.observe(document.body, {
  childList: true,
  subtree: true,
})

// Initial check when the script loads
setTimeout(() => {
  detectEmailData()
}, 1000)

// Notify that content script is loaded
chrome.runtime.sendMessage({ action: "contentScriptLoaded" })
