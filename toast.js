function createToast(message, success) {
  // Remove any existing toast
  const existingToast = document.getElementById("chatgpt-email-toast")
  if (existingToast) {
    existingToast.remove()
  }

  // Create new toast
  const toast = document.createElement("div")
  toast.id = "chatgpt-email-toast"
  toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
    success ? "bg-green-500" : "bg-red-500"
  } text-white`
  toast.textContent = message

  // Add to page
  document.body.appendChild(toast)

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.add("opacity-0", "transition-opacity", "duration-500")
    setTimeout(() => {
      toast.remove()
    }, 500)
  }, 3000)
}

// Listen for toast messages from background script
if (typeof chrome !== "undefined" && chrome.runtime) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showToast") {
      createToast(request.message, request.success)
    }
  })
} else {
  console.warn("Chrome runtime environment not detected. Toast messages from background script will not be received.")
}

// Inject toast styles
const style = document.createElement("style")
style.textContent = `
  #chatgpt-email-toast {
    transition: opacity 0.5s ease-in-out;
  }
`
document.head.appendChild(style)
