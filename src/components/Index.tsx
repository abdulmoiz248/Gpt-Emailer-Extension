
'use client'
import React from "react";
import { motion } from "framer-motion";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const popIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 200,
      damping: 15
    }
  }
};

const codeBlockReveal = {
  hidden: { opacity: 0, height: 0 },
  visible: { 
    opacity: 1, 
    height: "auto",
    transition: { 
      duration: 0.5,
      ease: "easeOut" 
    }
  }
};

const Index = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div 
        className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.h1 
          className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-500"
          variants={fadeIn}
        >
          GPT Emailer API
        </motion.h1>

        <motion.div 
          className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-200 dark:border-gray-700"
          variants={popIn}
        >
          <motion.h2 
            className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200"
            variants={fadeIn}
          >
            API Documentation
          </motion.h2>

          <motion.div 
            className="mb-8 space-y-4"
            variants={staggerContainer}
          >
            <motion.h3 
              className="text-xl font-medium mb-2 text-gray-800 dark:text-gray-200"
              variants={fadeIn}
            >
              Send Email Endpoint
            </motion.h3>
            
            <motion.div variants={fadeIn}>
              <p className="mb-2">
                <code className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md font-mono">
                  POST /api/send-email
                </code>
              </p>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                Sends an email using the provided credentials and email data.
              </p>
            </motion.div>

            <motion.div variants={staggerContainer}>
              <motion.h4 
                className="font-medium mb-2 text-gray-800 dark:text-gray-200"
                variants={fadeIn}
              >
                Request Body:
              </motion.h4>
              
              <motion.pre 
                className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-x-auto mb-6 font-mono text-sm"
                variants={codeBlockReveal}
              >
{`{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "body": "Email body content",
  "email": "your-email@gmail.com",
  "password": "your-app-password"
}`}
              </motion.pre>
            </motion.div>

            <motion.div variants={staggerContainer}>
              <motion.h4 
                className="font-medium mb-2 text-gray-800 dark:text-gray-200"
                variants={fadeIn}
              >
                Response:
              </motion.h4>
              
              <motion.pre 
                className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-x-auto font-mono text-sm"
                variants={codeBlockReveal}
              >
{`{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "unique-message-id"
}`}
              </motion.pre>
            </motion.div>
          </motion.div>

          <motion.div 
            className="mb-8"
            variants={fadeIn}
          >
            <h3 className="text-xl font-medium mb-3 text-gray-800 dark:text-gray-200">
              Error Handling
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              The API returns appropriate error messages and status codes:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-700 dark:text-gray-300">
              <li>400 - Bad Request (missing fields or invalid account type)</li>
              <li>500 - Server Error (email sending failed)</li>
            </ul>
          </motion.div>

          <motion.div 
            className="p-5 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl border border-yellow-200 dark:border-yellow-800"
            variants={popIn}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <h3 className="text-lg font-medium mb-2 text-yellow-800 dark:text-yellow-200">
              ⚠️ Security Note
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              This API handles email credentials. Ensure you're using HTTPS and consider implementing additional
              security measures like API keys or authentication for production use.
            </p>
          </motion.div>
        </motion.div>

        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p className="text-gray-700 dark:text-gray-300">
            Status: <motion.span 
              className="text-green-500 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.5, 1] }}
              transition={{ times: [0, 0.2, 0.5, 1], duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              API Running
            </motion.span>
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default Index;