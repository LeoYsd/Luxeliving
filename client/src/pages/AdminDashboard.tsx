import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Property } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Plus, Home, PenTool, Calendar, Settings } from "lucide-react";

export default function AdminDashboard() {
  const { user, isAdmin, logout } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if not admin
  if (user && !isAdmin) {
    navigate("/");
    return null;
  }

  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>(
    { 
      queryKey: ["/api/properties"],
      enabled: !!user && isAdmin,
    }
  );

  const handleLogout = async () => {
    await logout();
    navigate("/admin/auth");
  };

  const handleAddProperty = () => {
    navigate("/admin/properties/new");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Luxe Living Shortlets</p>
        </div>
        <nav className="mt-6">
          <div className="px-4 py-2 bg-primary/10 border-l-4 border-primary">
            <div className="flex items-center">
              <Home className="h-5 w-5 text-primary" />
              <span className="mx-4 font-medium text-primary">Properties</span>
            </div>
          </div>
          <div className="px-4 py-2 hover:bg-gray-100 border-l-4 border-transparent">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="mx-4 font-medium">Bookings</span>
            </div>
          </div>
          <div className="px-4 py-2 hover:bg-gray-100 border-l-4 border-transparent">
            <div className="flex items-center">
              <PenTool className="h-5 w-5 text-gray-500" />
              <span className="mx-4 font-medium">Agents</span>
            </div>
          </div>
          <div className="px-4 py-2 hover:bg-gray-100 border-l-4 border-transparent">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-gray-500" />
              <span className="mx-4 font-medium">Settings</span>
            </div>
          </div>
        </nav>
        <div className="p-4 absolute bottom-0 w-64">
          <Button onClick={handleLogout} variant="outline" className="w-full justify-start">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Properties</h1>
          <Button onClick={handleAddProperty}>
            <Plus className="h-4 w-4 mr-2" /> Add Property
          </Button>
        </div>

        {/* Properties List */}
        {propertiesLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties?.map((property) => (
              <Card key={property.id} className="overflow-hidden">
                <div className="h-48 bg-gray-200 relative">
                  <img
                    src={property.imageUrl}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                  {property.featured && (
                    <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded">
                      Featured
                    </div>
                  )}
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{property.name}</CardTitle>
                  <CardDescription>{property.location}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex space-x-4 text-sm">
                    <div>
                      <span className="font-medium">{property.bedrooms}</span>{" "}
                      Beds
                    </div>
                    <div>
                      <span className="font-medium">
                        {property.bathrooms}
                      </span>{" "}
                      Baths
                    </div>
                    <div>
                      <span className="font-medium">
                        {property.maxGuests}
                      </span>{" "}
                      Guests
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-medium text-primary">
                      ₦{property.pricePerNight.toLocaleString()}
                    </span>{" "}
                    per night
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/properties/${property.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/property/${property.id}`)}
                  >
                    View
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {properties?.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8">
                <h3 className="text-lg font-medium">No properties found</h3>
                <p className="text-gray-500 mt-2">
                  Get started by adding your first property.
                </p>
                <Button onClick={handleAddProperty} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" /> Add Property
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
