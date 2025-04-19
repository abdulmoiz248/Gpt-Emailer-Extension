document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["pendingEmail"], (result) => {
    if (result.pendingEmail) {
      const emailData = result.pendingEmail

      // Display email details
      document.getElementById("recipient").textContent = emailData.to
      document.getElementById("subject").textContent = emailData.subject
      document.getElementById("body").textContent = emailData.body

      // Set up account selection buttons
      document.getElementById("personal-account").addEventListener("click", () => {
        sendEmail("personal", emailData)
      })

      document.getElementById("education-account").addEventListener("click", () => {
        sendEmail("education", emailData)
      })

      // Set up account configuration buttons
      document.getElementById("setup-personal").addEventListener("click", () => {
        setupAccount("personal")
      })

      document.getElementById("setup-education").addEventListener("click", () => {
        setupAccount("education")
      })
    } else {
      // No pending email, show error
      document.body.innerHTML = `
        <div class="p-4 text-center">
          <p class="text-red-500">No email data found. Please try again.</p>
        </div>
      `
    }
  })
})

// Send email with selected account
function sendEmail(account, emailData) {
  chrome.runtime.sendMessage({
    action: "sendEmail",
    account: account,
    emailData: emailData,
  })

  // Show sending status
  document.body.innerHTML = `
    <div class="p-4 text-center">
      <p class="text-blue-500">Sending email from ${account} account...</p>
      <p class="mt-2">You can close this window. A notification will appear when complete.</p>
    </div>
  `

  // Close popup after a delay
  setTimeout(() => {
    window.close()
  }, 2000)
}

// Add this function to handle account setup
function setupAccount(account) {
  // Show setup status
  document.body.innerHTML = `
    <div class="p-4 text-center">
      <p class="text-blue-500">Setting up ${account} account...</p>
      <p class="mt-2">You'll need to authorize access to your Google account.</p>
    </div>
  `

  // Send message to background script to set up the account
  chrome.runtime.sendMessage(
    {
      action: "setupAccount",
      account: account,
    },
    (response) => {
      if (response && response.success) {
        document.body.innerHTML = `
        <div class="p-4 text-center">
          <p class="text-green-500">${account} account set up successfully!</p>
          <button id="back-button" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded">
            Back to Email
          </button>
        </div>
      `
        document.getElementById("back-button").addEventListener("click", () => {
          window.location.reload()
        })
      } else {
        document.body.innerHTML = `
        <div class="p-4 text-center">
          <p class="text-red-500">Failed to set up ${account} account.</p>
          <p class="mt-1 text-sm">${response?.error || "Unknown error"}</p>
          <button id="back-button" class="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded">
            Back to Email
          </button>
        </div>
      `
        document.getElementById("back-button").addEventListener("click", () => {
          window.location.reload()
        })
      }
    },
  )
}
