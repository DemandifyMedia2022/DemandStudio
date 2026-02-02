"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm, ControllerRenderProps } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { LayoutDashboard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

const formSchema = z.object({
    organizationName: z.string().min(2, { message: "Organization name must be at least 2 characters." }),
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
})

type FormValues = z.infer<typeof formSchema>

export default function SignupPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            organizationName: "",
            name: "",
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Something went wrong")
            }

            toast.success("Account created successfully!")
            router.push("/login?registered=true")
        } catch (error) {
            if (error instanceof Error) {
                toast.error(error.message)
            } else {
                toast.error("An unknown error occurred")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
            <div className="flex flex-col min-h-screen">
                {/* Top Left Branding */}
                <div className="p-8 flex items-center gap-2">
                    <LayoutDashboard className="h-6 w-6 text-primary" />
                    <span className="font-bold text-xl">DemandStudio</span>
                </div>

                {/* Centered Form */}
                <div className="flex-1 flex items-center justify-center p-8">
                    <Card className="w-full max-w-[400px] shadow-lg border-opacity-50">
                        <CardHeader className="text-center space-y-1">
                            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                            <CardDescription>
                                Enter your email below to create your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                                    <FormField
                                        control={form.control}
                                        name="organizationName"
                                        render={({ field }: { field: ControllerRenderProps<FormValues, "organizationName"> }) => (
                                            <FormItem>
                                                <FormLabel>Organization Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Acme Corp" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }: { field: ControllerRenderProps<FormValues, "name"> }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }: { field: ControllerRenderProps<FormValues, "email"> }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="m@example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }: { field: ControllerRenderProps<FormValues, "password"> }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="********" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                                        {isLoading ? "Creating account..." : "Sign Up"}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground w-full">
                                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                                <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
                            </div>
                            <div className="text-center text-sm w-full">
                                Already have an account?{" "}
                                <Link href="/login" className="underline text-primary">
                                    Login
                                </Link>
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                {/* Bottom Powered By */}
                <div className="p-6 text-center text-sm text-muted-foreground">
                    Powered by Demand Tech
                </div>
            </div>

            {/* Right Side Image */}
            <div className="hidden bg-muted lg:block relative">
                <div className="h-full w-full relative">
                    <img
                        src="/ui/login-page/login-light.png"
                        alt="Signup Light Mode"
                        className="absolute inset-0 h-full w-full object-cover dark:hidden"
                    />
                    <img
                        src="/ui/login-page/login-dark.png"
                        alt="Signup Dark Mode"
                        className="absolute inset-0 h-full w-full object-cover hidden dark:block"
                    />
                </div>
            </div>
        </div>
    )
}
