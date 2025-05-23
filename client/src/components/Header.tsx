import { useContext } from "react";
import { Link, useLocation } from "wouter";
import { ChatContext } from "../App";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageSquare, Building, User, ChevronDown, Search, CalendarCheck, LineChart, UserCircle, LogOut } from "lucide-react";

export default function Header() {
  const { toggleChat } = useContext(ChatContext);
  const [location] = useLocation();
  const isMobile = useIsMobile();

  return (
    <header className="bg-white shadow fixed top-0 left-0 right-0 z-10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Building className="text-primary h-6 w-6" />
              <h1 className="text-xl font-bold font-heading text-dark hidden md:block">Luxe Living</h1>
            </div>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/">
            <div className={`text-dark hover:text-primary font-medium cursor-pointer ${location === '/' ? 'text-primary' : ''}`}>Home</div>
          </Link>
          <Link href="/properties">
            <div className={`text-dark hover:text-primary font-medium cursor-pointer ${location === '/properties' ? 'text-primary' : ''}`}>Properties</div>
          </Link>
          <Link href="/start-booking">
            <div className={`text-dark hover:text-primary font-medium cursor-pointer ${location === '/start-booking' ? 'text-primary' : ''}`}>Start Booking</div>
          </Link>
          <Link href="/#how-it-works">
            <div className={`text-dark hover:text-primary font-medium cursor-pointer`}>How It Works</div>
          </Link>
          <Link href="/#for-agents">
            <div className={`text-dark hover:text-primary font-medium cursor-pointer`}>For Agents</div>
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Chat button clicked');
              toggleChat();
            }} 
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition flex items-center"
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            {!isMobile && <span>Chat with AI</span>}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="flex items-center space-x-1">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/properties">
                <DropdownMenuItem className="cursor-pointer">
                  <div className="flex items-center w-full">
                    <Search className="h-4 w-4 mr-2" />
                    <span>Browse Properties</span>
                  </div>
                </DropdownMenuItem>
              </Link>
              <Link href="/start-booking">
                <DropdownMenuItem className="cursor-pointer">
                  <div className="flex items-center w-full">
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    <span>Start Booking</span>
                  </div>
                </DropdownMenuItem>
              </Link>
              <Link href="/agent-dashboard">
                <DropdownMenuItem className="cursor-pointer">
                  <div className="flex items-center w-full">
                    <i className="fas fa-chart-line mr-2"></i>
                    <span>Agent Dashboard</span>
                  </div>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <Link href="/auth">
                <DropdownMenuItem className="cursor-pointer">
                  <div className="flex items-center w-full">
                    <i className="fas fa-user-circle mr-2"></i>
                    <span>My Account</span>
                  </div>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={() => {
                  fetch('/api/logout', { method: 'POST' })
                    .then(() => {
                      window.location.href = '/';
                    })
                    .catch(err => console.error('Logout error:', err));
              }} className="cursor-pointer">
                <div className="flex items-center w-full">
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  <span>Logout</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
