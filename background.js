chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "showEmailPopup") {
    // Store email data temporarily
    chrome.storage.local.set({ pendingEmail: request.emailData }, () => {
      // Create a popup window for account selection
      chrome.windows.create({
        url: "popup.html",
        type: "popup",
        width: 400,
        height: 300,
      })
    })
  } else if (request.action === "sendEmail") {
    sendEmail(request.account, request.emailData)
      .then((result) => {
        // Show success notification
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "showToast",
          success: true,
          message: "Email sent successfully!",
        })
      })
      .catch((error) => {
        // Show error notification
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "showToast",
          success: false,
          message: "Failed to send email: " + error.message,
        })
      })
  } else if (request.action === "setupAccount") {
    setupAccount(request.account)
      .then(() => {
        sendResponse({ success: true })
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message })
      })
    return true // Keep the message channel open for async response
  }

  return true // Keep the message channel open for async responses
})

// Function to send email using Gmail API
async function sendEmail(account, emailData) {
  // Get the appropriate token based on account selection
  const token = await getAuthToken(account)

  // Get the stored email addresses
  const result = await new Promise((resolve) => {
    chrome.storage.local.get(["personalEmail", "educationEmail"], resolve)
  })

  const fromEmail =
    account === "personal"
      ? result.personalEmail || "Your Personal Email"
      : result.educationEmail || "Your Education Email"

  // Encode email in base64
  const emailContent = [
    "From: " + fromEmail,
    "To: " + emailData.to,
    "Subject: " + emailData.subject,
    "",
    emailData.body,
  ].join("\r\n")

  const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  // Send email using Gmail API
  const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: encodedEmail,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to send email")
  }

  return await response.json()
}

// Get auth token for the selected account
async function getAuthToken(account) {
  return new Promise((resolve, reject) => {
    // Get stored tokens
    chrome.storage.local.get(["personalToken", "educationToken"], (result) => {
      const tokenKey = account === "personal" ? "personalToken" : "educationToken"

      // If we already have a token for this account, use it
      if (result[tokenKey]) {
        resolve(result[tokenKey])
        return
      }

      // Otherwise, we need to authenticate
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
        } else {
          // Store the token for this account
          const update = {}
          update[tokenKey] = token
          chrome.storage.local.set(update)
          resolve(token)
        }
      })
    })
  })
}

async function setupAccount(account) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        // Store the token for this account
        const update = {}
        update[account === "personal" ? "personalToken" : "educationToken"] = token
        chrome.storage.local.set(update, () => {
          // Also store the email address
          chrome.identity.getProfileUserInfo((userInfo) => {
            const emailUpdate = {}
            emailUpdate[account === "personal" ? "personalEmail" : "educationEmail"] = userInfo.email
            chrome.storage.local.set(emailUpdate, resolve)
          })
        })
      }
    })
  })
}
