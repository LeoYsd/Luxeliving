import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const agentLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const agentRegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Please enter a valid email"),
  fullName: z.string().min(2, "Full name is required"),
  referralCode: z.string().min(3, "Referral code is required"),
});

type AgentLoginFormValues = z.infer<typeof agentLoginSchema>;
type AgentRegisterFormValues = z.infer<typeof agentRegisterSchema>;

export default function AgentAuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register, logout, user } = useAuth();
  const [, navigate] = useLocation();

  const loginForm = useForm<AgentLoginFormValues>({
    resolver: zodResolver(agentLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<AgentRegisterFormValues>({
    resolver: zodResolver(agentRegisterSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      fullName: "",
      referralCode: "",
    },
  });

  const onLoginSubmit = async (data: AgentLoginFormValues) => {
    setIsSubmitting(true);
    try {
      const user = await login(data.username, data.password);
      if (user) {
        window.location.href = "/agent";
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegisterSubmit = async (data: AgentRegisterFormValues) => {
    setIsSubmitting(true);
    try {
      // First register the user
      const user = await register(
        data.username,
        data.password,
        data.email,
        data.fullName,
        false // Set isAdmin to false for agent registration
      );

      if (user) {
        // Then create the agent record
        const response = await fetch('/api/agent/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: data.username,
            name: data.fullName,
            email: data.email,
            referralCode: data.referralCode,
            commissionRate: 0.1, // Default commission rate
            status: 'Active'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create agent record');
        }

        window.location.href = "/agent";
      }
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Luxe Living Agent Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Agent access for property management
          </p>
          {user && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">
                Currently logged in as: <span className="font-semibold">{user.username}</span>
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  logout().then(() => {
                    navigate("/agent/auth");
                  });
                }}
              >
                Logout
              </Button>
            </div>
          )}
        </div>

        <Tabs value={tab} onValueChange={(t) => setTab(t as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Agent Login</TabsTrigger>
            <TabsTrigger value="register">Agent Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Agent Login</CardTitle>
                <CardDescription>
                  Enter your agent credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your username"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Logging in..." : "Login as Agent"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create Agent Account</CardTitle>
                <CardDescription>
                  Register a new agent account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Choose a username"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your full name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="referralCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referral Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your referral code"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Create a password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating account..." : "Create Agent Account"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 