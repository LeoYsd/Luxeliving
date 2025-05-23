import express from "express";
const router = express.Router();

// Webhook verification (GET)
router.get("/webhook", (req, res) => {
  const verify_token = "my_verify_token"; // Set this to a secure value and use the same in Meta portal
  if (req.query["hub.verify_token"] === verify_token) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

// Webhook message handler (POST)
router.post("/webhook", (req, res) => {
  // Log the incoming webhook for debugging
  console.log("Received WhatsApp webhook:", JSON.stringify(req.body, null, 2));

  // Example: Extract message text and sender
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];
  const from = message?.from; // WhatsApp user number
  const text = message?.text?.body;

  if (text && from) {
    // Here you would call your AI assistant logic and send a reply via WhatsApp API
    // Example: await sendWhatsAppMessage(from, aiReply);
    console.log(`Message from ${from}: ${text}`);
  }

  res.sendStatus(200);
});

export default router; 