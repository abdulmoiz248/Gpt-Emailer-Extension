# GPT Emailer Extension – Chrome Plugin for Smart Gmail Automation ✉️

**GPT Emailer Extension** is a Chrome extension that allows users to generate and send context-aware emails using OpenAI's GPT model, integrated directly with Gmail APIs.

## 🔍 What It Does

* 🧠 Uses GPT to generate smart email content based on context
* 📩 Sends emails directly via Gmail API
* 🧩 Fully functional Chrome Extension with popup, background, and content scripts


## 🛠️ Tech Stack

* **Frontend:** HTML, Tailwind CSS, Vanilla JS
* **GPT Integration:** OpenAI API (browser context)
* **Email Service:** Nodemailer
* **Chrome APIs:** chrome.identity, chrome.runtime, chrome.storage




## 🧪 Setup Instructions

1. Clone the repo:

```bash
git clone https://github.com/abdulmoiz248/Gpt-Emailer-Extension
cd Gpt-Emailer-Extension
```

2. Replace credentials:

   * Add your Google Client ID in `background.js`
   * Ensure OAuth consent is configured properly for Chrome Extensions
3. Load the extension:

   * Go to `chrome://extensions`
   * Enable Developer Mode
   * Click "Load unpacked" and select the project directory

## ⚠️ Notes

* Make sure OAuth scopes are correctly set for Gmail access
* Extension only works on domains where permissions are granted (e.g., Gmail)

## 💡 Use Case

Perfect for freelancers, professionals, or businesses who want to quickly auto-generate email replies, marketing drafts, or formal responses directly from the browser.

## 🤝 Contributions

Feel free to fork and enhance! Add multi-language support, smarter prompt templates, or scheduled email features.

---

Built with ☕, GPT, and patience by Abdul Moiz
