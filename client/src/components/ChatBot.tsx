import { useContext, useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { ChatContext } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChatbotResponse } from "@/lib/openai";
import { Property } from "@shared/schema";
import { Loader2, Bot, User, Home, MapPin, X, ArrowRight, Send } from "lucide-react";

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: response.reply,
        timestamp: new Date(),
        contentType: 'text'
      };
      
      // Send basic text response
      setTimeout(() => {
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
        
        // For property search, follow up with property recommendations
        if (intent === 'find-property') {
          setIsTyping(true);
          setTimeout(() => {
            handlePropertyRecommendation(text);
            setIsTyping(false);
          }, 1000);
        }
        // For availability check, show the form
        else if (intent === 'check-availability') {
          setIsTyping(true);
          setTimeout(() => {
            showAvailabilityForm();
            setIsTyping(false);
          }, 1000);
        }
        // For referral code, show the form
        else if (intent === 'referral-code') {
          setIsTyping(true);
          setTimeout(() => {
            showReferralCodeForm();
            setIsTyping(false);
          }, 1000);
        }
      }, 1000);
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      
      setTimeout(() => {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          text: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later.",
          timestamp: new Date(),
          contentType: 'text'
        };
        
        setMessages((prev) => [...prev, errorMessage]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col h-96 sm:h-[32rem]">
        <div className="bg-primary text-white p-4 flex justify-between items-center">
          <div className="flex items-center">
            <Bot className="h-5 w-5 mr-2" />
            <h3 className="font-medium">Luxe Living AI Assistant</h3>
          </div>
          <button onClick={toggleChat} className="text-white hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="chat-container flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start ${message.type === 'user' ? 'justify-end' : ''}`}>
              {message.type === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2 flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'} rounded-lg p-3`}>
                <p className="text-sm">{message.text}</p>
                {message.contentType === 'property-recommendations' && message.properties && (
                  <div className="mt-3 space-y-2">
                    {message.properties.map((property) => (
                      <Link key={property.id} href={`/property/${property.id}`}>
                        <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition cursor-pointer">
                          <h4 className="font-medium text-sm">{property.name}</h4>
                          <p className="text-xs text-gray-600">{property.location}</p>
                          <p className="text-xs text-primary mt-1">₦{property.pricePerNight.toLocaleString()} per night</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {message.contentType === 'referral-form' && (
                  <div className="mt-3">
                    <Input
                      placeholder="Enter your referral code"
                      className="w-full"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage(`I have a referral code: ${(e.target as HTMLInputElement).value}`);
                        }
                      }}
                    />
                  </div>
                )}
                {message.contentType === 'availability-check' && (
                  <div className="mt-3 space-y-2">
                    <Input
                      type="date"
                      className="w-full"
                      onChange={(e) => {
                        setChatState(prev => ({
                          ...prev,
                          preferredDates: {
                            ...prev.preferredDates,
                            checkIn: new Date(e.target.value)
                          }
                        }));
                      }}
                    />
                    <Input
                      type="date"
                      className="w-full"
                      onChange={(e) => {
                        setChatState(prev => ({
                          ...prev,
                          preferredDates: {
                            ...prev.preferredDates,
                            checkOut: new Date(e.target.value)
                          }
                        }));
                      }}
                    />
                    <Button
                      className="w-full"
                      onClick={() => {
                        const { preferredDates } = chatState;
                        if (preferredDates?.checkIn && preferredDates?.checkOut) {
                          handleSendMessage(`I want to check availability from ${preferredDates.checkIn.toLocaleDateString()} to ${preferredDates.checkOut.toLocaleDateString()}`);
                        }
                      }}
                    >
                      Check Availability
                    </Button>
                  </div>
                )}
                <span className="text-xs opacity-75 mt-1 block">{formatTime(message.timestamp)}</span>
              </div>
              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-2 flex-shrink-0">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(inputValue);
                }
              }}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button onClick={() => handleSendMessage(inputValue)}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-2">
            {quickReplies.map((reply) => (
              <Button
                key={reply}
                variant="outline"
                size="sm"
                onClick={() => handleSendMessage(reply)}
                className="flex-1"
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
