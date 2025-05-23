import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ChatContext } from "../App";
import ChatBot from "@/components/ChatBot";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Property } from "@shared/schema";
import { format } from "date-fns";

export default function PropertyDetails() {
  const { isChatOpen } = useContext(ChatContext);
  const [, params] = useRoute("/property/:id");
  const [, setLocation] = useLocation();
  const propertyId = params?.id ? parseInt(params.id) : -1;

  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [guests, setGuests] = useState(2);

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: [`/api/properties/${propertyId}`],
  });

  const handleBooking = () => {
    // Redirect to the StartBooking page
    setLocation(`/start-booking?propertyId=${propertyId}`);
  };

  if (isLoading) {
    return (
      <div className="pt-24 pb-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="pt-24 pb-12 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
            <p className="mb-6">The property you are looking for does not exist or has been removed.</p>
            <Button className="bg-primary hover:bg-primary/90" asChild>
              <a href="/properties">Browse Properties</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Property Images and Info */}
          <div className="w-full lg:w-2/3">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{property.name}</h1>
              <div className="flex items-center text-gray-500 mb-4">
                <i className="fas fa-map-marker-alt mr-2"></i>
                <span>{property.location}</span>
              </div>
              <div className="relative h-96 rounded-lg overflow-hidden">
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
              </div>
            </div>

            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="py-4">
                <h3 className="text-xl font-semibold mb-3">Property Details</h3>
                <p className="text-gray-700 mb-4">{property.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <i className="fas fa-bed text-primary text-xl mb-2"></i>
                    <span className="text-sm text-gray-600">
                      {property.bedrooms} {property.bedrooms === 1 ? "Bedroom" : "Bedrooms"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <i className="fas fa-bath text-primary text-xl mb-2"></i>
                    <span className="text-sm text-gray-600">
                      {property.bathrooms} {property.bathrooms === 1 ? "Bathroom" : "Bathrooms"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <i className="fas fa-users text-primary text-xl mb-2"></i>
                    <span className="text-sm text-gray-600">
                      {property.maxGuests} {property.maxGuests === 1 ? "Guest" : "Guests"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                    <i className="fas fa-ruler-combined text-primary text-xl mb-2"></i>
                    <span className="text-sm text-gray-600">{property.squareFeet} sqft</span>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="amenities" className="py-4">
                <h3 className="text-xl font-semibold mb-3">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      <i className="fas fa-check text-primary mr-2"></i>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="location" className="py-4">
                <h3 className="text-xl font-semibold mb-3">Location Information</h3>
                <p className="text-gray-700">
                  This property is located in {property.location}. The neighborhood offers convenient access to shopping, dining, and entertainment options.
                </p>
                <div className="h-64 bg-gray-200 rounded-lg mt-4 flex items-center justify-center">
                  <span className="text-gray-500">Map would be displayed here</span>
                </div>
              </TabsContent>
              <TabsContent value="reviews" className="py-4">
                <h3 className="text-xl font-semibold mb-3">Guest Reviews</h3>
                {property.reviews && property.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {property.reviews.map((review, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start mb-2">
                          <div className="mr-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <i className="fas fa-user text-gray-500"></i>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold">{review.name}</h4>
                            <div className="flex items-center mt-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <i
                                  key={i}
                                  className={`fas fa-star ${
                                    i < review.rating ? "text-yellow-400" : "text-gray-300"
                                  } mr-1`}
                                ></i>
                              ))}
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No reviews yet for this property.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Booking Card */}
          <div className="w-full lg:w-1/3">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold mb-1">₦{property.pricePerNight.toLocaleString()}</h3>
                  <p className="text-gray-600">per night</p>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium">Dates</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="justify-start text-left font-normal"
                          >
                            {dateRange.from ? (
                              format(dateRange.from, "MMM dd, yyyy")
                            ) : (
                              <span>Check-in</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) =>
                              setDateRange({ ...dateRange, from: date })
                            }
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="justify-start text-left font-normal"
                          >
                            {dateRange.to ? (
                              format(dateRange.to, "MMM dd, yyyy")
                            ) : (
                              <span>Check-out</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) =>
                              setDateRange({ ...dateRange, to: date })
                            }
                            disabled={(date) =>
                              date < new Date() ||
                              (dateRange.from ? date <= dateRange.from : false)
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium">Guests</label>
                    <Select
                      value={guests.toString()}
                      onValueChange={(value) => setGuests(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of guests" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...Array(property.maxGuests)].map((_, index) => (
                          <SelectItem key={index + 1} value={(index + 1).toString()}>
                            {index + 1} {index === 0 ? "Guest" : "Guests"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium">Referral Code (Optional)</label>
                    <Input type="text" placeholder="Enter referral code" />
                  </div>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    size="lg"
                    onClick={handleBooking}
                  >
                    Book Now
                  </Button>

                  {dateRange.from && dateRange.to && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between">
                        <span>
                          ₦{property.pricePerNight.toLocaleString()} x{" "}
                          {Math.ceil(
                            (dateRange.to.getTime() - dateRange.from.getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          nights
                        </span>
                        <span>
                          ₦
                          {(
                            property.pricePerNight *
                            Math.ceil(
                              (dateRange.to.getTime() - dateRange.from.getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service fee</span>
                        <span>₦{(property.pricePerNight * 0.1).toLocaleString()}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>
                          ₦
                          {(
                            property.pricePerNight *
                              Math.ceil(
                                (dateRange.to.getTime() - dateRange.from.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              ) +
                            property.pricePerNight * 0.1
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ChatBot */}
      {isChatOpen && <ChatBot />}
    </div>
  );
}
