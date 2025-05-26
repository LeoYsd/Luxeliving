import express from "express";
import { getChatbotReply, sendWhatsAppMessage } from "./whatsapp";

const router = express.Router();

// Webhook verification (GET)
router.get("/webhook", (req, res) => {
  const verify_token = process.env.WHATSAPP_VERIFY_TOKEN || "my_verify_token";
  if (req.query["hub.verify_token"] === verify_token) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

// Webhook message handler (POST)
router.post("/webhook", async (req, res) => {
  // Log the incoming webhook for debugging
  console.log("Received WhatsApp webhook:", JSON.stringify(req.body, null, 2));

  // Extract message text and sender
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];
  const from = message?.from; // WhatsApp user number
  const text = message?.text?.body;

  if (text && from) {
    try {
      // Get AI response
      const aiReply = await getChatbotReply(text, from);
      
      // Send reply via WhatsApp
      await sendWhatsAppMessage(from, aiReply);
      
      console.log(`Processed message from ${from}: ${text}`);
    } catch (error) {
      console.error("Error processing WhatsApp message:", error);
    }
  }

  res.sendStatus(200);
});

export default router; 