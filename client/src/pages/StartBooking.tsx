import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useLocation } from "wouter";
import { Property } from "@shared/schema";

const bookingFormSchema = z.object({
  propertyId: z.string({
    required_error: "Please select a property",
  }),
  checkIn: z.date({
    required_error: "Check-in date is required",
  }),
  checkOut: z.date({
    required_error: "Check-out date is required",
  }),
  guests: z.string().transform(val => parseInt(val, 10)),
  referralCode: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function StartBooking() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // Extract propertyId from URL query string if present
  const searchParams = new URLSearchParams(window.location.search);
  const propertyIdFromUrl = searchParams.get('propertyId');

  // Get all properties for the dropdown
  const { data: properties = [], isLoading: propertiesLoading } = useQuery<any[]>({
    queryKey: ["/api/properties"],
  });

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      propertyId: propertyIdFromUrl || "",
      guests: 1,
      referralCode: "",
    },
  });
  
  // Set the propertyId when it changes in the URL
  useEffect(() => {
    if (propertyIdFromUrl) {
      form.setValue("propertyId", propertyIdFromUrl);
    }
  }, [propertyIdFromUrl, form]);

  const watchCheckIn = form.watch("checkIn");
  const watchPropertyId = form.watch("propertyId");
  
  // Get the selected property details
  const { data: propertyData, isLoading: propertyLoading } = useQuery<Property>({
    queryKey: ["/api/properties", watchPropertyId],
    enabled: !!watchPropertyId,
  });

  useEffect(() => {
    if (propertyData) {
      setSelectedProperty(propertyData);
    }
  }, [propertyData]);

  async function onSubmit(data: BookingFormValues) {
    setIsSubmitting(true);
    try {
      // Calculate total amount based on property price and number of days
      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      const property = selectedProperty;
      const totalAmount = property ? property.pricePerNight * nights : 0;
      
      const bookingData = {
        propertyId: parseInt(data.propertyId, 10),
        checkIn: data.checkIn.toISOString(),
        checkOut: data.checkOut.toISOString(),
        guests: data.guests,
        totalAmount,
        referralCode: data.referralCode,
      };

      const response = await apiRequest("POST", "/api/bookings", bookingData);
      const booking = await response.json();

      toast({
        title: "Booking Successful",
        description: `Your booking at ${property?.name} has been confirmed.`,
      });
      
      // Redirect to a success page or booking details page
      setLocation(`/property/${data.propertyId}`);
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Start Your Booking</h1>

        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Fill in the details to book your perfect short-term stay</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Property</FormLabel>
                      <Select
                        disabled={propertiesLoading}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a property" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties?.map((property) => (
                            <SelectItem key={property.id} value={property.id.toString()}>
                              {property.name} - {property.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose from our selection of premium properties.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchPropertyId && selectedProperty && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900">{selectedProperty.name || 'Selected Property'}</h3>
                    <div className="mt-2 text-sm text-gray-600">
                      <p><span className="font-medium">Location:</span> {selectedProperty.location || 'N/A'}</p>
                      <p><span className="font-medium">Price per night:</span> ₦{selectedProperty.pricePerNight?.toLocaleString() || '0'}</p>
                      <p><span className="font-medium">Bedrooms:</span> {selectedProperty.bedrooms || 'N/A'}</p>
                      <p><span className="font-medium">Max Guests:</span> {selectedProperty.maxGuests || 'N/A'}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-6">
                  <FormField
                    control={form.control}
                    name="checkIn"
                    render={({ field }) => (
                      <FormItem className="flex flex-col flex-1">
                        <FormLabel>Check-in Date</FormLabel>
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          className="rounded-md border"
                        />
                        <FormDescription>
                          Your check-in date.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="checkOut"
                    render={({ field }) => (
                      <FormItem className="flex flex-col flex-1">
                        <FormLabel>Check-out Date</FormLabel>
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => 
                            date < new Date() || 
                            (watchCheckIn && date <= watchCheckIn)
                          }
                          className="rounded-md border"
                        />
                        <FormDescription>
                          Your check-out date.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="guests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Guests</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the number of guests staying.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referralCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Code (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter agent referral code if you have one"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        If you were referred by an agent, enter their referral code here
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Processing...</span>
                      <i className="fas fa-spinner fa-spin"></i>
                    </>
                  ) : (
                    "Complete Booking"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
