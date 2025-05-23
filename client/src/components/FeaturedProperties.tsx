import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import PropertyCard from "@/components/PropertyCard";

export default function FeaturedProperties() {
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties/featured"],
  });

  return (
    <section className="py-12 bg-light">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-dark">Featured Properties</h2>
          <a href="/properties" className="text-primary hover:text-primary/90 font-medium flex items-center">
            View all <i className="fas fa-arrow-right ml-2"></i>
          </a>
        </div>

        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-2">No featured properties available</h3>
            <p className="text-gray-600">Check back later for new listings</p>
          </div>
        )}
      </div>
    </section>
  );
}
