import { Link } from "wouter";
import { Property } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Card className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={property.imageUrl} 
          alt={property.name} 
          className="w-full h-full object-cover"
        />
        {property.featured && (
          <div className="absolute top-3 right-3 bg-primary text-white px-2 py-1 rounded text-sm font-medium">
            Featured
          </div>
        )}
        {property.isNew && (
          <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded text-sm font-medium">
            New
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-dark truncate">{property.name}</h3>
          <span className="font-bold text-lg text-primary">₦{property.pricePerNight.toLocaleString()}/night</span>
        </div>
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <i className="fas fa-map-marker-alt mr-1"></i>
          <span>{property.location}</span>
        </div>
        <div className="flex justify-between text-sm mb-3">
          <div className="flex items-center">
            <i className="fas fa-bed text-gray-500 mr-1"></i>
            <span>{property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
          </div>
          <div className="flex items-center">
            <i className="fas fa-bath text-gray-500 mr-1"></i>
            <span>{property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
          </div>
          <div className="flex items-center">
            <i className="fas fa-users text-gray-500 mr-1"></i>
            <span>{property.maxGuests} {property.maxGuests === 1 ? 'Guest' : 'Guests'}</span>
          </div>
        </div>
        <div className="flex mt-2 space-x-2">
          <Link href={`/property/${property.id}`}>
            <Button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition flex-1">
              Book Now
            </Button>
          </Link>
          <Button variant="outline" size="icon" className="border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 transition">
            <i className="far fa-heart"></i>
          </Button>
        </div>
      </div>
    </Card>
  );
}
