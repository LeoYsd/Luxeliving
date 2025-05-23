import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChatContext } from "../App";
import ChatBot from "@/components/ChatBot";
import PropertyCard from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Property } from "@shared/schema";

export default function Properties() {
  const { isChatOpen } = useContext(ChatContext);
  const [location, setLocation] = useState("");
  const [bedrooms, setBedrooms] = useState("any");
  const [priceRange, setPriceRange] = useState([0, 200000]);

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const filteredProperties = properties?.filter((property) => {
    const matchesLocation = location === "" || property.location.toLowerCase().includes(location.toLowerCase());
    const matchesBedrooms = bedrooms === "any" || property.bedrooms.toString() === bedrooms;
    const matchesPrice = property.pricePerNight >= priceRange[0] && property.pricePerNight <= priceRange[1];
    return matchesLocation && matchesBedrooms && matchesPrice;
  });

  return (
    <div className="pt-24 pb-12 min-h-screen">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Find Your Perfect Stay</h1>

        {/* Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block mb-2 text-sm font-medium">Location</label>
              <Input
                type="text"
                placeholder="Enter location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Bedrooms</label>
              <Select value={bedrooms} onValueChange={setBedrooms}>
                <SelectTrigger>
                  <SelectValue placeholder="Any bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Price Range: ₦{priceRange[0].toLocaleString()} - ₦{priceRange[1].toLocaleString()}</label>
              <Slider
                min={0}
                max={200000}
                step={5000}
                value={priceRange}
                onValueChange={setPriceRange}
                className="my-4"
              />
            </div>
          </div>
          <Button className="mt-4 bg-primary hover:bg-primary/90">Apply Filters</Button>
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredProperties && filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No properties found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters for more results</p>
            <Button onClick={() => {
              setLocation("");
              setBedrooms("any");
              setPriceRange([0, 200000]);
            }}>
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {/* ChatBot */}
      {isChatOpen && <ChatBot />}
    </div>
  );
}
