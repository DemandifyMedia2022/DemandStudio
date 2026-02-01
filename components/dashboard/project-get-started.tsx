"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IntroDisclosure } from "@/components/ui/intro-disclosure"
import { Key, FileText, Globe, Send, ArrowRight, Copy } from "lucide-react"

interface ProjectGetStartedProps {
    orgSlug: string
    projectSlug: string
}

export function ProjectGetStarted({ orgSlug, projectSlug }: ProjectGetStartedProps) {
    const [open, setOpen] = useState(false)

    const steps = [
        {
            title: "Create API Key",
            short_description: "Generate an API key to access your content.",
            full_description: "First, you need an API key to authenticate your requests. Go to the API Keys section and create a new key.",
            action: {
                label: "Go to API Keys",
                href: `/dashboard/${orgSlug}/projects/${projectSlug}/api-keys`
            },
            media: {
                type: "image" as const,
                src: "/ui/start-tour/step1.png",
                alt: "API Key Creation"
            }
        },
        {
            title: "Create Content",
            short_description: "Define your content structure and add items.",
            full_description: "Use the Content Builder to define schemas (Content Types) and then create content items based on those schemas.",
            action: {
                label: "Go to Builder",
                href: `/dashboard/${orgSlug}/projects/${projectSlug}/builder`
            },
            media: {
                type: "image" as const,
                src: "/ui/start-tour/step2.png",
                alt: "Content Builder"
            }
        },
        {
            title: "Link CORS",
            short_description: "Allow your frontend to access the API.",
            full_description: "Add your frontend application's URL to the CORS Origins list to allow it to fetch data from the CMS.",
            action: {
                label: "Manage CORS",
                href: `/dashboard/${orgSlug}/projects/${projectSlug}/developer/cors-origins`
            },
            media: {
                type: "image" as const,
                src: "/ui/start-tour/step3.png",
                alt: "CORS Settings"
            }
        },
        {
            title: "Publish",
            short_description: "Make your content live.",
            full_description: "Once you have created content, make sure to publish it so it is available via the public API.",
            action: {
                label: "View Content",
                href: `/dashboard/${orgSlug}/projects/${projectSlug}/content/posts` // Defaulting to posts as an example
            },
            media: {
                type: "image" as const,
                src: "/ui/start-tour/step4.png",
                alt: "Publishing Content"
            }
        }
    ]

    return (
        <>
            <div className="w-full rounded-xl bg-card text-card-foreground p-6 md:p-8 relative overflow-hidden border border-border shadow-sm">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <div className="flex gap-4">
                        <div className="w-24 h-24 rounded-full border-4 border-foreground/20"></div>
                        <div className="w-12 h-12 rounded-full bg-foreground/20 mt-8"></div>
                    </div>
                </div>

                <div className="relative z-10 max-w-2xl space-y-4">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                        Ready to build?
                    </h2>
                    <p className="text-base text-muted-foreground max-w-lg">
                        Follow our quick start guide to set up your project, create content, and connect your frontend.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-2">
                        <Button
                            onClick={() => setOpen(true)}
                            size="default"
                            className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold px-6"
                        >
                            GET STARTED
                        </Button>
                    </div>
                </div>
            </div>

            <IntroDisclosure
                steps={steps}
                open={open}
                setOpen={setOpen}
                featureId="project-onboarding"
                forceVariant="desktop"
            />
        </>
    )
}
