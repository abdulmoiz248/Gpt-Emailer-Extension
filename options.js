document.addEventListener("DOMContentLoaded", () => {
  // Load current account settings
  loadAccountSettings()

  // Load extension settings
  loadExtensionSettings()

  // Set up event listeners
  document.getElementById("setup-personal").addEventListener("click", () => {
    setupAccount("personal")
  })

  document.getElementById("setup-education").addEventListener("click", () => {
    setupAccount("education")
  })

  document.getElementById("remove-personal").addEventListener("click", () => {
    removeAccount("personal")
  })

  document.getElementById("remove-education").addEventListener("click", () => {
    removeAccount("education")
  })

  document.getElementById("save-settings").addEventListener("click", saveSettings)
})

// Load account settings
function loadAccountSettings() {
  chrome.storage.local.get(["personalToken", "educationToken", "personalEmail", "educationEmail"], (result) => {
    // Update personal account info
    if (result.personalToken && result.personalEmail) {
      document.getElementById("personal-status").textContent = "Configured"
      document.getElementById("personal-status").className = "text-green-600"
      document.getElementById("personal-email").textContent = result.personalEmail
      document.getElementById("remove-personal").classList.remove("hidden")
    }

    // Update education account info
    if (result.educationToken && result.educationEmail) {
      document.getElementById("education-status").textContent = "Configured"
      document.getElementById("education-status").className = "text-green-600"
      document.getElementById("education-email").textContent = result.educationEmail
      document.getElementById("remove-education").classList.remove("hidden")
    }
  })
}

// Load extension settings
function loadExtensionSettings() {
  chrome.storage.local.get(["autoDetect"], (result) => {
    document.getElementById("auto-detect").checked = result.autoDetect !== false // Default to true
  })
}

// Set up an account
function setupAccount(account) {
  chrome.runtime.sendMessage(
    {
      action: "setupAccount",
      account: account,
    },
    (response) => {
      if (response && response.success) {
        // Reload account settings to show the updated info
        loadAccountSettings()
      } else {
        alert(`Failed to set up ${account} account: ${response?.error || "Unknown error"}`)
      }
    },
  )
}

// Remove an account
function removeAccount(account) {
  const tokenKey = account === "personal" ? "personalToken" : "educationToken"
  const emailKey = account === "personal" ? "personalEmail" : "educationEmail"

  chrome.storage.local.remove([tokenKey, emailKey], () => {
    // Reload account settings to show the updated info
    loadAccountSettings()
  })
}

// Save extension settings
function saveSettings() {
  const autoDetect = document.getElementById("auto-detect").checked

  chrome.storage.local.set({ autoDetect }, () => {
    const saveStatus = document.getElementById("save-status")
    saveStatus.classList.remove("hidden")

    // Hide the status message after 2 seconds
    setTimeout(() => {
      saveStatus.classList.add("hidden")
    }, 2000)
  })
}
