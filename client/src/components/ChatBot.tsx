import { useContext, useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { ChatContext } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChatbotResponse } from "@/lib/openai";
import { Property } from "@shared/schema";
import { Loader2, Bot, User, Home, MapPin, X, ArrowRight, Send } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Message {
  id: string;
  type: 'bot' | 'user';
  text: string;
  timestamp: Date;
  contentType?: 'text' | 'property-recommendations' | 'referral-form' | 'availability-check';
  properties?: Property[];
}

interface ChatState {
  lastQuery?: string;
  preferredLocation?: string;
  preferredDates?: {
    checkIn?: Date;
    checkOut?: Date;
  };
  guestCount?: number;
  budget?: number;
}

const quickReplies = [
  "Find a property",
  "Check availability",
  "Enter referral code"
];

export default function ChatBot() {
  const { toggleChat } = useContext(ChatContext);
  console.log('ChatBot component rendered');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: "Hello! I'm your Luxe Living AI assistant. How can I help you find the perfect short-let stay today?",
      timestamp: new Date(),
      contentType: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatState, setChatState] = useState<ChatState>({});
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: "smooth",
          block: "end"
        });
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Listen for custom chat messages
  useEffect(() => {
    const handleChatMessage = (event: CustomEvent) => {
      handleSendMessage(event.detail);
    };

    window.addEventListener('chat-message', handleChatMessage as EventListener);
    return () => {
      window.removeEventListener('chat-message', handleChatMessage as EventListener);
    };
  }, []);

  // Fetch properties for recommendations
  const fetchProperties = async () => {
    try {
      const response = await apiRequest('GET', '/api/properties/featured');
      const data = await response.json();
      setRecentProperties(data);
      return data;
    } catch (error) {
      console.error('Error fetching properties:', error);
      return [];
    }
  };

  // Process message intent
  const processMessageIntent = (text: string): string => {
    text = text.toLowerCase();
    
    if (text.includes('find') || text.includes('property') || text.includes('apartment') || text.includes('place')) {
      return 'find-property';
    } else if (text.includes('available') || text.includes('check') || text.includes('book')) {
      return 'check-availability';
    } else if (text.includes('referral') || text.includes('code')) {
      return 'referral-code';
    }
    
    return 'general';
  };

  // Handle property recommendations
  const handlePropertyRecommendation = async (userText: string) => {
    try {
      // If we don't have properties loaded yet, fetch them
      if (recentProperties.length === 0) {
        await fetchProperties();
      }

      // Extract location information from text if available
      const locationTerms = ['lagos', 'lekki', 'ikoyi', 'victoria island', 'ikeja', 'ajah'];
      let location = '';
      
      for (const term of locationTerms) {
        if (userText.toLowerCase().includes(term)) {
          location = term;
          setChatState(prev => ({ ...prev, preferredLocation: term }));
          break;
        }
      }

      // Extract guest count if mentioned
      const guestMatch = userText.match(/(\d+)\s*(?:guests?|people|persons?)/i);
      if (guestMatch) {
        const guestCount = parseInt(guestMatch[1]);
        setChatState(prev => ({ ...prev, guestCount }));
      }

      // Create recommendation message
      let recommendationText = `Here are some properties I recommend${location ? ` in ${location}` : ''}:`;
      
      // Use property recommendations or just featured properties
      let propertiesToShow = recentProperties;

      if (location) {
        propertiesToShow = recentProperties.filter(p => 
          p.location.toLowerCase().includes(location.toLowerCase())
        );
      }

      if (propertiesToShow.length === 0) {
        propertiesToShow = recentProperties;
        recommendationText = `I don't have properties specifically${location ? ` in ${location}` : ''} at the moment, but here are some popular options:`;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: recommendationText,
        timestamp: new Date(),
        contentType: 'property-recommendations',
        properties: propertiesToShow
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error handling property recommendation:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: "I'm sorry, I couldn't fetch property recommendations at the moment.",
        timestamp: new Date(),
        contentType: 'text'
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Show referral code entry form
  const showReferralCodeForm = () => {
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      text: "Please enter your referral code below:",
      timestamp: new Date(),
      contentType: 'referral-form'
    };
    
    setMessages((prev) => [...prev, botMessage]);
    setShowReferralForm(true);
  };

  // Show availability check form
  const showAvailabilityForm = () => {
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      text: "Please provide the details to check availability:",
      timestamp: new Date(),
      contentType: 'availability-check'
    };
    
    setMessages((prev) => [...prev, botMessage]);
  };

  // Main message handler
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Update chat context with the last query
    setChatState(prev => ({ ...prev, lastQuery: text }));

    // Create and add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text,
      timestamp: new Date(),
      contentType: 'text'
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Determine message intent
    const intent = processMessageIntent(text);

    // For exact quick reply matches, handle specially
    if (text === "Find a property") {
      setTimeout(() => {
        setIsTyping(false);
        handlePropertyRecommendation(text);
      }, 1000);
      return;
    } else if (text === "Check availability") {
      setTimeout(() => {
        setIsTyping(false);
        showAvailabilityForm();
      }, 1000);
      return;
    } else if (text === "Enter referral code") {
      setTimeout(() => {
        setIsTyping(false);
        showReferralCodeForm();
      }, 1000);
      return;
    }

    try {
      // Get AI response
      const response = await getChatbotResponse(text);
      
      // Basic bot response
      const botMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'bot',
        text: response.reply || "I'm sorry, I couldn't process your request.",
        timestamp: new Date(),
        contentType: 'text'
      };
      
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);

    } catch (error) {
      console.error('Error getting chatbot response:', error);
      setIsTyping(false);

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(), // Unique ID
        type: 'bot',
        text: "I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date(),
        contentType: 'text'
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleQuickReplyClick = (reply: string) => {
    handleSendMessage(reply);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 w-full max-w-sm rounded-lg shadow-lg transition-transform duration-300 ease-in-out transform bg-white"
    >
      {/* Chatbot Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300" style={{ backgroundColor: '#183B4E' }}>
        <div className="flex items-center space-x-2">
          <Bot className="h-6 w-6 text-primary-gold" />
          <h3 className="text-lg font-bold text-primary-gold">AI Booking Assistant</h3>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleChat}
          className="text-primary-gold hover:bg-gray-700"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Chat Messages Area */}
      <div className="p-4 h-80 overflow-y-auto space-y-4" style={{ scrollbarWidth: 'none' }}>
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[70%] p-3 rounded-lg 
                ${message.type === 'user' 
                  ? 'bg-primary-gold text-primary-black' 
                  : 'bg-gray-200 text-gray-800'
                }
              `}
            >
              {message.contentType === 'property-recommendations' ? (
                <div>
                  <p className="mb-2 font-semibold text-gray-800">{message.text}</p>
                  <div className="grid grid-cols-1 gap-3">
                    {message.properties?.map(property => (
                      <Card key={property.id} className="bg-white text-gray-800 p-3 shadow">
                        <h4 className="font-bold text-primary-gold mb-1 truncate">{property.name}</h4>
                        <p className="text-sm mb-2 text-gray-600">₦{property.pricePerNight.toLocaleString()}/night</p>
                        <Link href={`/property/${property.id}`} className="text-primary-gold hover:underline text-sm">
                          View Details <ArrowRight className="inline-block h-3 w-3 ml-1" />
                        </Link>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : message.contentType === 'referral-form' ? (
                <div>
                  <p className="mb-2 text-gray-800">{message.text}</p>
                  {showReferralForm && (
                    <div className="flex flex-col gap-2 mt-2">
                      <Input 
                        placeholder="Enter code" 
                        className="bg-white text-gray-800 border-gray-300 focus-visible:ring-primary-gold"
                      />
                      <Button variant="gold-black" className="w-full">Submit Code</Button>
                    </div>
                  )}
                </div>
              ) : message.contentType === 'availability-check' ? (
                 <div>
                  <p className="mb-2 text-gray-800">{message.text}</p>
                  <p className="text-sm italic text-gray-600">Availability check form goes here...</p>
                 </div>
              ) : (
                <p className="text-gray-800">{message.text}</p>
              )}
              <span className={`block mt-1 text-xs 
                ${message.type === 'user' ? 'text-primary-black/70' : 'text-gray-600'}
              `}>
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="max-w-[70%] p-3 rounded-lg bg-gray-200 text-gray-800">
               <div className="flex items-center">
                 <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary-gold" />
                 <span>Typing...</span>
               </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Quick Replies */}
      {!isTyping && messages.length <= 1 && (
        <div className="p-4 border-t border-gray-300 flex flex-wrap gap-2">
          {quickReplies.map((reply, index) => (
            <Button 
              key={index} 
              variant="outline" 
              size="sm" 
              onClick={() => handleQuickReplyClick(reply)}
              className="border-primary-gold text-primary-gold hover:bg-primary-gold hover:text-primary-black"
            >
              {reply}
            </Button>
          ))}
        </div>
      )}

      {/* Chat Input Area */}
      <div className="p-4 border-t border-gray-300 flex items-center space-x-2">
        <Input
          className="flex-1 bg-white text-gray-800 border-gray-300 focus-visible:ring-primary-gold"
          placeholder="Type a message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage(inputValue);
            }
          }}
        />
        <Button 
          type="submit" 
          size="icon" 
          onClick={() => handleSendMessage(inputValue)}
          className="bg-primary-gold text-primary-black hover:bg-secondary-gold"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
