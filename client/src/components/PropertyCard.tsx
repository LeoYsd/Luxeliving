import { Link } from "wouter";
import { Property } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Card className="bg-primary-black text-primary-gold rounded-xl shadow-md overflow-hidden hover:shadow-lg transition border border-secondary-gold">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={property.imageUrl} 
          alt={property.name} 
          className="w-full h-full object-cover"
        />
        {property.featured && (
          <div className="absolute top-3 right-3 bg-primary-gold text-primary-black px-2 py-1 rounded text-sm font-medium">
            Featured
          </div>
        )}
        {property.isNew && (
          <div className="absolute top-3 right-3 bg-secondary-gold text-primary-black px-2 py-1 rounded text-sm font-medium">
            New
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-primary-gold truncate">{property.name}</h3>
          <span className="font-bold text-lg text-secondary-gold">₦{property.pricePerNight.toLocaleString()}/night</span>
        </div>
        <div className="flex items-center text-secondary-gold text-sm mb-3">
          <i className="fas fa-map-marker-alt mr-1"></i>
          <span>{property.location}</span>
        </div>
        <div className="flex justify-between text-sm mb-3 text-secondary-gold">
          <div className="flex items-center">
            <i className="fas fa-bed mr-1"></i>
            <span>{property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
          </div>
          <div className="flex items-center">
            <i className="fas fa-bath mr-1"></i>
            <span>{property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
          </div>
          <div className="flex items-center">
            <i className="fas fa-users mr-1"></i>
            <span>{property.maxGuests} {property.maxGuests === 1 ? 'Guest' : 'Guests'}</span>
          </div>
        </div>
        <div className="flex mt-2 space-x-2">
          <Link href={`/property/${property.id}`}>
            <Button variant="gold-black" className="flex-1">
              Book Now
            </Button>
          </Link>
          <Button variant="outline" size="icon" className="border border-primary-gold text-primary-gold hover:bg-primary-gold hover:text-primary-black">
            <i className="far fa-heart"></i>
          </Button>
        </div>
      </div>
    </Card>
  );
}
