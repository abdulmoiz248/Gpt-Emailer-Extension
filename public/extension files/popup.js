// Popup script
document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded")

  // Update account status
  updateAccountStatus()

  // Check if we're on a ChatGPT page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const statusMessage = document.getElementById("status-message")
    if (tabs[0] && !(tabs[0].url.includes("chat.openai.com") || tabs[0].url.includes("chatgpt.com"))) {
      statusMessage.textContent = "Please navigate to ChatGPT to use this extension"
      statusMessage.className = "status-message info"
      statusMessage.style.display = "block"
    }
  })

  // Set up button listeners
  document.getElementById("options-btn").addEventListener("click", () => {
    chrome.runtime.openOptionsPage()
  })

  // Manually trigger email detection
  document.getElementById("detect-btn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && (tabs[0].url.includes("chat.openai.com") || tabs[0].url.includes("chatgpt.com"))) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "manualDetection" }, (response) => {
          if (chrome.runtime.lastError) {
            showStatus("Content script not loaded. Try reinjecting the script.", "error")
            return
          }

          if (response && response.success) {
            showStatus("Email detection triggered!", "success")
          } else {
            showStatus("Failed to trigger detection. Try reinjecting the script.", "error")
          }
        })
      } else {
        showStatus("Please navigate to ChatGPT to use this feature", "error")
      }
    })
  })

  document.getElementById("inject-btn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "injectContentScript" }, (response) => {
      if (response && response.success) {
        showStatus("Content script injected successfully", "success")
      } else {
        showStatus(response?.message || "Failed to inject script", "error")
      }
    })
  })
})

// Function to update account status
function updateAccountStatus() {
  chrome.storage.sync.get(["personalAccount", "educationAccount"], (result) => {
    // Update personal account status
    const personalStatus = document.getElementById("personal-status")
    const personalEmail = document.getElementById("personal-email")

    if (result.personalAccount && result.personalAccount.email) {
      personalStatus.className = "status-indicator configured"
      personalEmail.textContent = result.personalAccount.email
    } else {
      personalStatus.className = "status-indicator not-configured"
      personalEmail.textContent = "Not configured"
    }

    // Update education account status
    const educationStatus = document.getElementById("education-status")
    const educationEmail = document.getElementById("education-email")

    if (result.educationAccount && result.educationAccount.email) {
      educationStatus.className = "status-indicator configured"
      educationEmail.textContent = result.educationAccount.email
    } else {
      educationStatus.className = "status-indicator not-configured"
      educationEmail.textContent = "Not configured"
    }
  })
}

// Function to show status message
function showStatus(message, type) {
  const statusElement = document.getElementById("status-message")
  statusElement.textContent = message
  statusElement.className = `status-message ${type}`
  statusElement.style.display = "block"

  // Hide after 3 seconds
  setTimeout(() => {
    statusElement.style.display = "none"
  }, 3000)
}
