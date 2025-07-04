import { useContext } from "react";
import { ChatContext } from "../App";
import ChatBot from "@/components/ChatBot";
import FeaturedProperties from "@/components/FeaturedProperties";
import HowItWorks from "@/components/HowItWorks";
import AgentPromo from "@/components/AgentPromo";
import { useLocation } from "wouter";

export default function Home() {
  const { isChatOpen, toggleChat } = useContext(ChatContext);
  const [, setLocation] = useLocation();

  const handleStartBooking = () => {
    setLocation("/start-booking");
  };

  const handleBecomeAgent = () => {
    setLocation("/agent/auth");
  };

  const handleAIAssistant = (query: string) => {
    if (!isChatOpen) {
      toggleChat();
    }
    // The message will be handled by the ChatBot component
    setTimeout(() => {
      const event = new CustomEvent('chat-message', { detail: query });
      window.dispatchEvent(event);
    }, 100);
  };

  return (
    <div className="pt-20 min-h-screen">
      {/* Hero Section */}
      <section className="bg-primary-black text-primary-gold py-12 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading mb-4">
                Find Your Perfect Short-Let With AI
              </h1>
              <p className="text-lg md:text-xl mb-6 opacity-90 text-secondary-gold">
                Our AI-powered booking assistant helps you find luxury stays that match your preferences in seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleStartBooking}
                  className="bg-primary-gold text-primary-black px-6 py-3 rounded-lg font-medium hover:bg-secondary-gold transition"
                >
                  Start Booking
                </button>
                <button 
                  onClick={handleBecomeAgent}
                  className="bg-transparent border border-primary-gold text-primary-gold px-6 py-3 rounded-lg font-medium hover:bg-primary-gold hover:text-primary-black transition"
                >
                  Become an Agent
                </button>
              </div>
            </div>
            <div className="md:w-5/12">
              <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="bg-gray-700 p-4 rounded-lg mb-4">
                  <div className="flex items-center mb-2">
                    <i className="fas fa-robot text-primary-gold mr-2"></i>
                    <h3 className="font-medium text-primary-gold">AI Booking Assistant</h3>
                  </div>
                  <p className="text-secondary-gold text-sm">
                    Hi there! I'm your AI booking assistant. I can help you find the perfect short-let apartment. Just tell me what you're looking for!
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handleAIAssistant("I need a place this weekend")}
                    className="text-left bg-gray-700 hover:bg-gray-600 transition p-3 rounded-lg flex items-center text-primary-gold"
                  >
                    <i className="fas fa-calendar-alt text-primary-gold mr-3"></i>
                    <span>I need a place this weekend</span>
                  </button>
                  <button 
                    onClick={() => handleAIAssistant("Show me places in Lekki")}
                    className="text-left bg-gray-700 hover:bg-gray-600 transition p-3 rounded-lg flex items-center text-primary-gold"
                  >
                    <i className="fas fa-map-marker-alt text-primary-gold mr-3"></i>
                    <span>Show me places in Lekki</span>
                  </button>
                  <button 
                    onClick={() => handleAIAssistant("I need 2 bedrooms for 4 guests")}
                    className="text-left bg-gray-700 hover:bg-gray-600 transition p-3 rounded-lg flex items-center text-primary-gold"
                  >
                    <i className="fas fa-users text-primary-gold mr-3"></i>
                    <span>I need 2 bedrooms for 4 guests</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <FeaturedProperties />

      {/* How It Works Section */}
      <HowItWorks />

      {/* Agent Promo Section */}
      <AgentPromo />

      {/* ChatBot */}
      {isChatOpen && <ChatBot />}
    </div>
  );
}
