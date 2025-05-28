import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChatContext } from "../App";
import ChatBot from "@/components/ChatBot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";
import { AgentStats, Booking, Lead } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function AgentDashboard() {
  const { isChatOpen } = useContext(ChatContext);
  const [timePeriod, setTimePeriod] = useState("month");
  const { logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: agentStats, isLoading: statsLoading } = useQuery<AgentStats>({
    queryKey: ["/api/agent/stats"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/agent/leads"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/agent/bookings"],
  });

  const performanceData = [
    { name: 'Jan', leads: 4, bookings: 1, commission: 15000 },
    { name: 'Feb', leads: 6, bookings: 2, commission: 22000 },
    { name: 'Mar', leads: 8, bookings: 3, commission: 35000 },
    { name: 'Apr', leads: 10, bookings: 4, commission: 42000 },
    { name: 'May', leads: 12, bookings: 5, commission: 55000 },
    { name: 'Jun', leads: 16, bookings: 7, commission: 72000 },
  ];

  return (
    <div className="pt-24 pb-12 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Agent Dashboard</h1>
            <p className="text-gray-600">Track your referrals and commissions</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center bg-white p-2 rounded-lg shadow">
            <span className="font-semibold text-gray-700 mr-2">Your Referral Code:</span>
            <span className="bg-primary-50 text-primary px-3 py-1 rounded text-lg font-mono">
              {agentStats?.referralCode || "AGT001"}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Leads</CardDescription>
              <CardTitle className="text-4xl">{agentStats?.activeLeads || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {agentStats?.leadsChangePercentage && agentStats.leadsChangePercentage > 0 ? (
                  <span className="text-green-600">↑ {agentStats.leadsChangePercentage}% from last month</span>
                ) : (
                  <span className="text-red-600">↓ {Math.abs(agentStats?.leadsChangePercentage || 0)}% from last month</span>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Confirmed Bookings</CardDescription>
              <CardTitle className="text-4xl">{agentStats?.confirmedBookings || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {agentStats?.bookingsChangePercentage && agentStats.bookingsChangePercentage > 0 ? (
                  <span className="text-green-600">↑ {agentStats.bookingsChangePercentage}% from last month</span>
                ) : (
                  <span className="text-red-600">↓ {Math.abs(agentStats?.bookingsChangePercentage || 0)}% from last month</span>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Conversion Rate</CardDescription>
              <CardTitle className="text-4xl">{agentStats?.conversionRate || 0}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Based on lead-to-booking conversion
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Earnings (₦)</CardDescription>
              <CardTitle className="text-4xl">{(agentStats?.earnings || 0).toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {agentStats?.earningsChangePercentage && agentStats.earningsChangePercentage > 0 ? (
                  <span className="text-green-600">↑ {agentStats.earningsChangePercentage}% from last month</span>
                ) : (
                  <span className="text-red-600">↓ {Math.abs(agentStats?.earningsChangePercentage || 0)}% from last month</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Charts */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <CardTitle>Performance Overview</CardTitle>
              <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                <button 
                  className={`px-3 py-1 rounded-md text-sm ${timePeriod === 'week' ? 'bg-white shadow' : ''}`}
                  onClick={() => setTimePeriod('week')}
                >
                  Week
                </button>
                <button 
                  className={`px-3 py-1 rounded-md text-sm ${timePeriod === 'month' ? 'bg-white shadow' : ''}`}
                  onClick={() => setTimePeriod('month')}
                >
                  Month
                </button>
                <button 
                  className={`px-3 py-1 rounded-md text-sm ${timePeriod === 'year' ? 'bg-white shadow' : ''}`}
                  onClick={() => setTimePeriod('year')}
                >
                  Year
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={performanceData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="commission"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorCommission)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Leads and Bookings */}
        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : leads && leads.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.clientName}</TableCell>
                          <TableCell>{lead.contact}</TableCell>
                          <TableCell>{new Date(lead.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
                              lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                              lead.status === 'Qualified' ? 'bg-green-100 text-green-800' : 
                              'bg-red-100 text-red-800'
                            }`}>
                              {lead.status}
                            </span>
                          </TableCell>
                          <TableCell>{lead.location}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No leads found. Start referring clients to generate leads.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Confirmed Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : bookings && bookings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Commission</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.clientName}</TableCell>
                          <TableCell>{booking.clientEmail}</TableCell>
                          <TableCell>{new Date(booking.checkIn).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(booking.checkOut).toLocaleDateString()}</TableCell>
                          <TableCell>{booking.propertyName}</TableCell>
                          <TableCell>{booking.status}</TableCell>
                          <TableCell>₦{(booking.totalAmount || 0).toLocaleString()}</TableCell>
                          <TableCell>₦{(booking.commission || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No bookings found. When your referrals complete their bookings, they'll appear here.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={performanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="leads" fill="#93C5FD" name="Leads" />
                      <Bar dataKey="bookings" fill="#3B82F6" name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Logout Button */}
        <div className="mt-8 flex justify-center">
          <Button onClick={async () => {
            await logout();
            navigate("/agent/auth");
          }}>
            Logout
          </Button>
        </div>
      </div>

      {/* ChatBot */}
      {isChatOpen && <ChatBot />}
    </div>
  );
}
