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
    <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[96%] max-w-screen-xl rounded-full bg-primary-black/80 px-8 py-3 shadow-lg backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Building className="text-primary-gold h-6 w-6" />
              <h1 className="text-xl font-bold font-heading text-primary-gold hidden md:block">Luxe Living</h1>
            </div>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/">
            <div className={`hover:text-secondary-gold font-medium cursor-pointer ${location === '/' ? 'text-primary-gold' : 'text-primary-gold'}`}>Home</div>
          </Link>
          <Link href="/properties">
            <div className={`hover:text-secondary-gold font-medium cursor-pointer ${location === '/properties' ? 'text-primary-gold' : 'text-primary-gold'}`}>Properties</div>
          </Link>
          <Link href="/start-booking">
            <div className={`hover:text-secondary-gold font-medium cursor-pointer ${location === '/start-booking' ? 'text-primary-gold' : 'text-primary-gold'}`}>Start Booking</div>
          </Link>
          <Link href="/#how-it-works">
            <div className={`hover:text-secondary-gold font-medium cursor-pointer text-primary-gold`}>How It Works</div>
          </Link>
          <Link href="/#for-agents">
            <div className={`hover:text-secondary-gold font-medium cursor-pointer text-primary-gold`}>For Agents</div>
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
            className="bg-primary-gold text-primary-black px-6 py-2 rounded-full hover:bg-secondary-gold transition flex items-center"
          >
            <MessageSquare className="h-5 w-5 mr-2" />
            {!isMobile && <span>Chat with AI</span>}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <div className="flex items-center space-x-1">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-gold" />
                </div>
                <ChevronDown className="h-4 w-4 text-primary-gold" />
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
