import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertPropertySchema, Property } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Save, Trash } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Extend the property schema with some validation
const propertyFormSchema = insertPropertySchema
  .extend({
    // Make some fields optional for easier form handling
    zipCode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    weeklyRate: z.number().optional(),
    monthlyRate: z.number().optional(),
    securityDeposit: z.number().optional(),
    cleaningFee: z.number().optional(),
    longStayDiscount: z.number().optional(),
    maxStay: z.number().optional(),
    videoUrl: z.string().optional(),
    // Add additional validation
    name: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    propertyType: z.string().min(1, "Property type is required"),
    listingType: z.string().min(1, "Listing type is required"),
    fullAddress: z.string().min(5, "Address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    country: z.string().min(2, "Country is required"),
    bedrooms: z.number().min(1, "Must have at least 1 bedroom"),
    bathrooms: z.number().min(1, "Must have at least 1 bathroom"),
    maxGuests: z.number().min(1, "Must allow at least 1 guest"),
    squareFeet: z.number().min(1, "Size must be greater than 0"),
    pricePerNight: z.number().min(1, "Price must be greater than 0"),
    imageUrl: z.string().url("Image URL must be a valid URL"),
    amenities: z.array(z.string()).min(1, "Must select at least one amenity"),
  });

type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export default function PropertyForm() {
  const params = useParams();
  const propertyId = params.id ? parseInt(params.id) : null;
  const isEditing = !!propertyId;
  const [, navigate] = useLocation();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("basics");
  const [isDeleting, setIsDeleting] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  // Fetch property data if editing
  const { data: property, isLoading: isLoadingProperty } = useQuery<Property>({
    queryKey: [`/api/properties/${propertyId}`],
    enabled: isEditing,
  });

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      name: "",
      description: "",
      propertyType: "",
      listingType: "",
      fullAddress: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
      location: "", // This will be constructed from address fields
      latitude: undefined,
      longitude: undefined,
      bedrooms: 1,
      bathrooms: 1,
      bedTypes: [],
      maxGuests: 1,
      squareFeet: 0,
      pricePerNight: 0,
      weeklyRate: undefined,
      monthlyRate: undefined,
      securityDeposit: undefined,
      cleaningFee: undefined,
      longStayDiscount: undefined,
      currency: "NGN",
      minStay: 1,
      maxStay: undefined,
      blockedDates: [],
      imageUrl: "",
      imageGallery: [],
      videoUrl: "",
      amenities: [],
      houseRules: [],
      checkInTime: "14:00",
      checkOutTime: "11:00",
      featured: false,
      isNew: true,
      isActive: true,
      reviews: [],
    },
  });

  // Populate form when property data is loaded
  useEffect(() => {
    if (property) {
      // Reset the form with property data
      form.reset({
        ...property,
        // Handle nullable fields
        latitude: property.latitude || undefined,
        longitude: property.longitude || undefined,
        weeklyRate: property.weeklyRate || undefined,
        monthlyRate: property.monthlyRate || undefined,
        securityDeposit: property.securityDeposit || undefined,
        cleaningFee: property.cleaningFee || undefined,
        longStayDiscount: property.longStayDiscount || undefined,
        maxStay: property.maxStay || undefined,
        videoUrl: property.videoUrl || "",
        zipCode: property.zipCode || "",
      });
    }
  }, [property, form]);

  // Create/update mutation
  const mutation = useMutation({
    mutationFn: async (data: PropertyFormValues) => {
      // Construct location field from address components
      const locationString = `${data.city}, ${data.state}, ${data.country}`;
      const propertyData = { ...data, location: locationString };
      
      const url = isEditing 
        ? `/api/properties/${propertyId}` 
        : "/api/properties";
      
      const method = isEditing ? "PUT" : "POST";
      const res = await apiRequest(method, url, propertyData);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save property");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      if (propertyId) {
        queryClient.invalidateQueries({ queryKey: [`/api/properties/${propertyId}`] });
      }
      
      toast({
        title: isEditing ? "Property updated" : "Property created",
        description: isEditing 
          ? "Your property has been updated successfully"
          : "Your property has been created successfully",
      });
      
      navigate("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!propertyId) return;
      
      const res = await apiRequest("DELETE", `/api/properties/${propertyId}`);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete property");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      
      toast({
        title: "Property deleted",
        description: "The property has been deleted successfully",
      });
      
      navigate("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PropertyFormValues) => {
    mutation.mutate(data);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      setIsDeleting(true);
      deleteMutation.mutate();
    }
  };

  if (isLoadingProperty) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const amenitiesList = [
    "Wi-Fi",
    "Air Conditioning",
    "Fully Equipped Kitchen",
    "TV / Streaming Services",
    "Washer / Dryer",
    "Parking",
    "Pool",
    "Gym",
    "Security Features",
    "Pet-Friendly",
    "Elevator",
    "Generator / Backup Power",
    "Ocean View",
    "Garden",
    "Balcony",
    "BBQ Grill",
    "Hot Tub",
    "Beach Access",
  ];

  const houseRules = [
    { id: "smoking", label: "Smoking Allowed" },
    { id: "pets", label: "Pets Allowed" },
    { id: "parties", label: "Events/Parties Allowed" },
    { id: "children", label: "Children Friendly" },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/admin")} 
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? "Edit Property" : "Add New Property"}
        </h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="details">Details & Pricing</TabsTrigger>
          <TabsTrigger value="amenities">Amenities & Rules</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <TabsContent value="basics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Modern 2-Bedroom Apartment in Lekki"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A descriptive title for your property
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Apartment">Apartment</SelectItem>
                          <SelectItem value="House">House</SelectItem>
                          <SelectItem value="Villa">Villa</SelectItem>
                          <SelectItem value="Studio">Studio</SelectItem>
                          <SelectItem value="Bungalow">Bungalow</SelectItem>
                          <SelectItem value="Duplex">Duplex</SelectItem>
                          <SelectItem value="Penthouse">Penthouse</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="listingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select listing type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Entire place">Entire place</SelectItem>
                          <SelectItem value="Private room">Private room</SelectItem>
                          <SelectItem value="Shared room">Shared room</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your property, nearby attractions, etc."
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed description of your property.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active Listing
                        </FormLabel>
                        <FormDescription>
                          Property will be visible and bookable
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Featured Property
                        </FormLabel>
                        <FormDescription>
                          Display on homepage and in featured listings
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="fullAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="123 Main Street, Apartment 4B"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Lagos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Region</FormLabel>
                      <FormControl>
                        <Input placeholder="Lagos State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Nigeria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP / Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="100001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="6.4351"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormDescription>
                          For map display purposes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="3.4170"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormDescription>
                          For map display purposes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <h3 className="text-lg font-semibold md:col-span-2">
                  Accommodation Details
                </h3>

                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Bedrooms</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Bathrooms</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxGuests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Number of Guests</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="squareFeet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size (sq meters/feet)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="md:col-span-2 my-4" />

                <h3 className="text-lg font-semibold md:col-span-2 mt-2">
                  Pricing & Fees
                </h3>

                <FormField
                  control={form.control}
                  name="pricePerNight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Night (NGN)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NGN">NGN (Nigerian Naira)</SelectItem>
                          <SelectItem value="USD">USD (US Dollar)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                          <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weeklyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weekly Rate (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="For 7+ nights"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="monthlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Rate (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="For 30+ nights"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cleaningFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cleaning Fee (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="securityDeposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Security Deposit (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="longStayDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Long Stay Discount % (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Percentage discount for longer stays"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="md:col-span-2 my-4" />

                <h3 className="text-lg font-semibold md:col-span-2 mt-2">
                  Stay Requirements
                </h3>

                <FormField
                  control={form.control}
                  name="minStay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Stay (Nights)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxStay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Stay (Nights, Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="No maximum if left blank"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="checkInTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-in Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="checkOutTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-out Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="amenities" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="amenities"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-lg font-semibold">Amenities</FormLabel>
                        <FormDescription>
                          Select all amenities available at this property
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {amenitiesList.map((amenity) => (
                          <FormField
                            key={amenity}
                            control={form.control}
                            name="amenities"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={amenity}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(amenity)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, amenity])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== amenity
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {amenity}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-4" />

                <div className="mb-4">
                  <Label className="text-lg font-semibold">House Rules</Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Select what is allowed at your property
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {houseRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox id={rule.id} />
                      <Label htmlFor={rule.id}>{rule.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The main image for your property listing. Must be a valid URL.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("imageUrl") && (
                  <div className="relative w-full h-64 bg-gray-100 rounded-md overflow-hidden">
                    <img
                      src={form.watch("imageUrl")}
                      alt="Property preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=Invalid+Image+URL";
                      }}
                    />
                  </div>
                )}

                <Alert>
                  <AlertTitle>Additional Media</AlertTitle>
                  <AlertDescription>
                    In this version, only the primary image URL is supported. 
                    Future updates will allow for multiple image uploads and video tours.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <div className="flex justify-between mt-8 px-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin")}
              >
                Cancel
              </Button>

              <div className="flex gap-4">
                {isEditing && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting || mutation.isPending}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Property
                      </>
                    )}
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEditing ? "Update Property" : "Save Property"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
}
