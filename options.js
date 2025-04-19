// Options page script
document.addEventListener("DOMContentLoaded", () => {
  console.log("Options page loaded")

  // Load saved accounts
  loadAccounts()

  // Set up save buttons
  document.getElementById("save-personal").addEventListener("click", () => {
    saveAccount("personal")
  })

  document.getElementById("save-education").addEventListener("click", () => {
    saveAccount("education")
  })
})

// Function to load saved accounts
function loadAccounts() {
  chrome.storage.sync.get(["personalAccount", "educationAccount"], (result) => {
    if (result.personalAccount) {
      document.getElementById("personal-email").value = result.personalAccount.email || ""
      document.getElementById("personal-password").value = result.personalAccount.password || ""
    }

    if (result.educationAccount) {
      document.getElementById("education-email").value = result.educationAccount.email || ""
      document.getElementById("education-password").value = result.educationAccount.password || ""
    }
  })
}

// Function to save account
function saveAccount(type) {
  const email = document.getElementById(`${type}-email`).value
  const password = document.getElementById(`${type}-password`).value

  if (!email || !password) {
    showStatus("Please enter both email and password", "error")
    return
  }

  const account = { email, password }
  const data = {}
  data[`${type}Account`] = account

  chrome.storage.sync.set(data, () => {
    showStatus(`${type.charAt(0).toUpperCase() + type.slice(1)} account saved successfully`, "success")
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
