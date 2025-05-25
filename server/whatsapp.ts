import OpenAI from "openai";
import axios from 'axios';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "sk-dummy-key";

// Log if we're using the API key or fallback
console.log("OpenAI API Key Status:", OPENAI_API_KEY === "sk-dummy-key" ? "Using fallback responses" : "Using OpenAI API");

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
  throw new Error('Missing required WhatsApp configuration');
}

// Store conversation context for each user
const conversationContext = new Map<string, Array<OpenAI.Chat.ChatCompletionMessageParam>>();

/**
 * Get a reply from the chatbot based on the user's message
 * @param message The user's message
 * @param from The user's phone number (for context)
 * @returns The chatbot's reply
 */
export async function getChatbotReply(message: string, from: string): Promise<string> {
  try {
    // If no OpenAI API key is provided, use a fallback response
    if (OPENAI_API_KEY === "sk-dummy-key") {
      return getLocalBotResponse(message);
    }

    // Get or initialize conversation context for this user
    let context = conversationContext.get(from) || [];
    if (context.length === 0) {
      // Initialize with system message if this is a new conversation
      context = [{
        role: "system",
        content: `You are LuxeBot, an AI booking assistant for Luxe Living, a short-let luxury property booking platform.
        Your role is to help users find and book short-let apartments. Be helpful, conversational, and professional.
        
        Key responsibilities:
        1. Help users find properties based on their preferences
        2. Guide users through the booking process
        3. Provide information about locations, amenities, and pricing
        4. Handle inquiries about availability and special requests
        
        Important guidelines:
        - Keep responses concise (2-3 sentences maximum)
        - Always ask for missing information (location, dates, guests, budget)
        - If asked about specific property details you don't know, suggest browsing the website
        - For pricing questions, mention our range is ₦35,000 to ₦120,000 per night
        - For booking, guide users to select dates and click 'Book Now'
        - If a referral code is mentioned, acknowledge it and ensure proper credit
        
        Current available locations: Lagos (Lekki, Ikoyi, Victoria Island), Abuja, Port Harcourt`
      }];
    }

    // Add user message to context
    context.push({ role: "user", content: message });

    // Keep only last 10 messages for context
    if (context.length > 11) { // 1 system message + 10 conversation messages
      context = [context[0], ...context.slice(-10)];
    }

    console.log("Sending message to OpenAI:", message);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Using GPT-4 for better understanding and responses
      messages: context,
      max_tokens: 150,
      temperature: 0.7, // Add some creativity while staying focused
      presence_penalty: 0.6, // Encourage diverse responses
      frequency_penalty: 0.3, // Reduce repetition
    });

    const reply = response.choices[0].message.content;
    if (!reply) {
      throw new Error("No response received from OpenAI");
    }
    
    // Add assistant's response to context
    context.push({ role: "assistant", content: reply });
    conversationContext.set(from, context);

    console.log("Received response from OpenAI:", reply);
    return reply;
  } catch (error) {
    console.error("Error getting response from OpenAI:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return "I'm having trouble connecting to my brain right now. Please try again later.";
  }
}

/**
 * Fallback function that provides canned responses when no OpenAI API key is available
 */
function getLocalBotResponse(message: string): string {
  message = message.toLowerCase();
  
  if (message.includes("hi") || message.includes("hello") || message.includes("hey")) {
    return "Hello! I'm LuxeBot, your AI booking assistant. How can I help you find the perfect short-let apartment today?";
  } else if (
    message.includes("property") || 
    message.includes("apartment") || 
    message.includes("find")
  ) {
    return "I can help you find a property! Could you tell me your preferred location, budget, and dates?";
  } else if (
    message.includes("availability") || 
    message.includes("check") || 
    message.includes("available")
  ) {
    return "I'd be happy to check availability for you. Which property are you interested in, and when would you like to stay?";
  } else if (
    message.includes("referral") || 
    message.includes("code") || 
    message.includes("agent")
  ) {
    return "Great! Please enter your referral code, and I'll make sure the referring agent gets credited for your booking.";
  } else if (
    message.includes("lagos") || 
    message.includes("lekki") || 
    message.includes("ikoyi") || 
    message.includes("victoria island")
  ) {
    return "We have several properties in that area! What's your budget and how many bedrooms do you need?";
  } else if (
    message.includes("weekend") || 
    message.includes("holiday") || 
    message.includes("vacation")
  ) {
    return "Looking for a weekend getaway? I can show you our available luxury properties. What area are you interested in?";
  } else if (
    message.includes("bedroom") || 
    message.includes("bed") || 
    message.includes("sleep") || 
    message.includes("guests")
  ) {
    return "I can find you a place with the perfect number of bedrooms. What's your preferred location and price range?";
  } else if (
    message.includes("price") || 
    message.includes("cost") || 
    message.includes("budget") || 
    message.includes("expensive") || 
    message.includes("cheap")
  ) {
    return "Our luxury properties range from ₦35,000 to ₦120,000 per night. What's your budget range so I can find the best options for you?";
  } else if (
    message.includes("book") || 
    message.includes("reserve") || 
    message.includes("confirm")
  ) {
    return "To book a property, simply select your preferred dates and number of guests, then click the 'Book Now' button. You can also include a referral code if you have one!";
  } else {
    return "Thanks for your message. To help you better, could you provide more details about what you're looking for? (location, dates, budget, number of guests)";
  }
}

/**
 * Send a message via WhatsApp API
 * @param to The recipient's phone number
 * @param message The message to send
 */
export async function sendWhatsAppMessage(to: string, message: string) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('WhatsApp message sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}
