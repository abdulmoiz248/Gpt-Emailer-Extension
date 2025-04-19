// Monitor ChatGPT responses for sendEmail pattern
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      mutation.addedNodes.forEach((node) => {
        // Check if the node is an element that might contain our pattern
        if (node.nodeType === Node.ELEMENT_NODE) {
          checkForEmailPattern(node)
        }
      })
    }
  })
})

// Start observing the entire document body
observer.observe(document.body, { childList: true, subtree: true })

// Check if the content contains the sendEmail pattern
function checkForEmailPattern(node) {
  const content = node.textContent || ""

  // Check if content contains "sendEmail" keyword
  if (content.includes("sendEmail")) {
    console.log("Found sendEmail pattern!") // Debug log

    try {
      let jsonStr = ""

      // Check if JSON is inside a code block (\`\`\`json ... \`\`\`)
      if (content.includes("```json")) {
        const codeBlockStart = content.indexOf("```json") + 7 // Length of \`\`\`json
        const codeBlockEnd = content.indexOf("```", codeBlockStart)

        if (codeBlockEnd !== -1) {
          jsonStr = content.substring(codeBlockStart, codeBlockEnd).trim()
          console.log("Extracted JSON from code block:", jsonStr) // Debug log
        }
      }
      // If not in code block, try to extract JSON directly
      else {
        const jsonStartIndex = content.indexOf("{")
        const jsonEndIndex = content.lastIndexOf("}") + 1

        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
          jsonStr = content.substring(jsonStartIndex, jsonEndIndex)
          console.log("Extracted JSON directly:", jsonStr) // Debug log
        }
      }

      // If we found JSON, try to parse it
      if (jsonStr) {
        try {
          const emailData = JSON.parse(jsonStr)

          if (emailData.to && emailData.subject && emailData.body) {
            console.log("Valid email data found:", emailData) // Debug log

            // Show account selection popup
            chrome.runtime.sendMessage({
              action: "showEmailPopup",
              emailData: emailData,
            })
          } else {
            console.log("Missing required email fields") // Debug log
          }
        } catch (jsonError) {
          console.error("JSON parsing error:", jsonError)
        }
      } else {
        console.log("Could not find JSON data") // Debug log
      }
    } catch (error) {
      console.error("Error processing email data:", error)
    }
  }
}

// Add a simple test function that can be called from the console
window.testEmailExtension = () => {
  const testData = {
    to: "test@example.com",
    subject: "Test Subject",
    body: "This is a test email body",
  }

  chrome.runtime.sendMessage({
    action: "showEmailPopup",
    emailData: testData,
  })

  console.log("Test function executed")
}

// Add a function to test with code block format
window.testWithCodeBlock = () => {
  const testElement = document.createElement("div")
  testElement.textContent = `sendEmail
\`\`\`json
{
  "to": "test@example.com",
  "subject": "Test Subject",
  "body": "This is a test email body"
}
\`\`\``

  document.body.appendChild(testElement)
  checkForEmailPattern(testElement)
  document.body.removeChild(testElement)
}
