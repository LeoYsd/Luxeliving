import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "sk-dummy-key";

// Log if we're using the API key or fallback
console.log("OpenAI API Key Status:", OPENAI_API_KEY === "sk-dummy-key" ? "Using fallback responses" : "Using OpenAI API");

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

/**
 * Get a reply from the chatbot based on the user's message
 * @param message The user's message
 * @returns The chatbot's reply
 */
export async function getChatbotReply(message: string): Promise<string> {
  try {
    // If no OpenAI API key is provided, use a fallback response
    if (OPENAI_API_KEY === "sk-dummy-key") {
      return getLocalBotResponse(message);
    }
    
    console.log("Sending message to OpenAI:", message);
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using a more stable model
      messages: [
        {
          role: "system",
          content: `You are an AI booking assistant for Luxe Living, a short-let luxury property booking platform. 
          Your name is LuxeBot and you help users find and book short-let apartments. Be helpful, conversational, and provide relevant information about the
          booking process, properties, or guide users to enter their preferences such as location, dates, number of guests,
          and budget. Keep responses concise (under a few sentences) and focused on helping the user book a property.
          If asked about specific property details that you don't know, suggest that the user can browse available properties on the website.`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 150,
    });

    const reply = response.choices[0].message.content;
    console.log("Received response from OpenAI:", reply);
    return reply || "I'm sorry, I couldn't process your request at the moment.";
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
export async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp credentials not configured');
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}
