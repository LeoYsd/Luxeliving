import { Switch, Route } from "wouter";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Properties from "@/pages/Properties";
import PropertyDetails from "@/pages/PropertyDetails";
import AgentDashboard from "@/pages/AgentDashboard";
import StartBooking from "@/pages/StartBooking";
import AuthPage from "@/pages/AuthPage";
import AdminAuthPage from "@/pages/AdminAuthPage";
import AgentAuthPage from "@/pages/AgentAuthPage";
import AdminDashboard from "@/pages/AdminDashboard";
import PropertyForm from "@/pages/PropertyForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import { useState, createContext } from "react";
import { AuthProvider } from "@/hooks/use-auth";
import Privacy from "./pages/Privacy";

// Create context for chatbot visibility
export interface ChatContextType {
  isChatOpen: boolean;
  toggleChat: () => void;
}

export const ChatContext = createContext<ChatContextType>({
  isChatOpen: false,
  toggleChat: () => {
    console.log('Default toggleChat called');
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/properties" component={Properties} />
      <Route path="/property/:id" component={PropertyDetails} />
      <Route path="/agent-dashboard" component={AgentDashboard} />
      <Route path="/start-booking" component={StartBooking} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin/auth" component={AdminAuthPage} />
      <Route path="/agent/auth" component={AgentAuthPage} />
      <Route path="/privacy" component={Privacy} />
      <ProtectedRoute path="/admin" component={AdminDashboard} adminOnly={true} />
      <ProtectedRoute path="/admin/properties/new" component={PropertyForm} adminOnly={true} />
      <ProtectedRoute path="/admin/properties/:id" component={PropertyForm} adminOnly={true} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const toggleChat = () => {
    console.log('Toggling chat, current state:', isChatOpen);
    setIsChatOpen(!isChatOpen);
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ChatContext.Provider value={{ isChatOpen, toggleChat }}>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Router />
              </main>
              <Footer />
              {isChatOpen && <ChatBot />}
            </div>
            <Toaster />
          </ChatContext.Provider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
