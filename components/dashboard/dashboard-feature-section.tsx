"use client"

import { ArrowRight, Code2, Play } from "lucide-react"
import Link from "next/link"

export function DashboardFeatureSection() {
    return (
        <div className="w-full space-y-12 py-12">
            <div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-2">
                    The power of headless, The ease of visual
                </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            STRUCTURED CONTENT
                        </p>
                        <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
                            Structured content for modern apps
                        </h3>
                    </div>

                    <p className="text-lg text-muted-foreground leading-relaxed">
                        DemandStudio gives developers flexible APIs while empowering content teams with a beautiful, intuitive editor.
                    </p>

                    <div className="pt-2">
                        <Link
                            href="#"
                            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            LEARN ABOUT DEMAND STUDIO <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </div>
                </div>

                <div className="relative rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 shadow-2xl">
                    <div className="p-1 bg-zinc-100 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-white/5 flex items-center gap-2 px-4 h-9">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8 bg-zinc-50 dark:bg-zinc-950/50 min-h-[300px] flex flex-col justify-center">
                        <div className="space-y-4">
                            <h4 className="text-2xl font-semibold text-zinc-900 dark:text-white">Real-time collaboration</h4>
                            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm text-sm">
                                Build faster with type-safe SDKs and instant API generation.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-white dark:bg-zinc-900/80 rounded-lg p-3 flex items-center gap-3 border border-zinc-200 dark:border-white/5">
                                <div className="h-8 w-8 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Play className="h-4 w-4 fill-current" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Instant API Preview</div>
                                    <div className="text-xs text-zinc-500">Live Data</div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-zinc-900/80 rounded-lg p-3 flex items-center gap-3 border border-zinc-200 dark:border-white/5 ml-8">
                                <div className="h-8 w-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <Code2 className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Type-safe SDKs</div>
                                    <div className="text-xs text-zinc-500">TypeScript</div>
                                </div>
                                <div className="p-1">
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 rounded-full bg-zinc-600"></div>
                                        <div className="w-1 h-1 rounded-full bg-zinc-600"></div>
                                        <div className="w-1 h-1 rounded-full bg-zinc-600"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>




            < div className="grid md:grid-cols-2 gap-12 items-center pt-12" >
                {/* Visual Side (Left) */}
                <div className="relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 shadow-2xl h-[400px] group" >
                    {/* Background Code Layer */}
                    <div className="absolute inset-0 p-6 font-mono text-xs text-zinc-500 bg-white/50 dark:bg-zinc-900/50" >
                        <div className="space-y-1 opacity-40">
                            <p><span className="text-purple-400">export</span> <span className="text-blue-400">const</span> article = &#123;</p>
                            <p className="pl-4">type: <span className="text-green-400">"document"</span>,</p>
                            <p className="pl-4">name: <span className="text-green-400">"article"</span>,</p>
                            <p className="pl-4">title: <span className="text-green-400">"Article"</span>,</p>
                            <p className="pl-4">fields: [</p>
                            <p className="pl-8">defineField&#40;&#123;</p>
                            <p className="pl-12">type: <span className="text-green-400">"string"</span>,</p>
                            <p className="pl-12">name: <span className="text-green-400">"title"</span>,</p>
                            <p className="pl-12">title: <span className="text-green-400">"Title"</span>,</p>
                            <p className="pl-8">&#125;&#41;,</p>
                            <p className="pl-8">defineField&#40;&#123;</p>
                            <p className="pl-12">type: <span className="text-green-400">"slug"</span>,</p>
                            <p className="pl-12">name: <span className="text-green-400">"slug"</span>,</p>
                            <p className="pl-8">&#125;&#41;,</p>
                            <p className="pl-4">]</p>
                            <p>&#125;</p>
                        </div>
                    </div >

                    {/* Foreground Form Layer */}
                    < div className="absolute inset-0 flex items-center justify-center p-6" >
                        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden transform transition-transform group-hover:scale-[1.02] duration-500">
                            <div className="p-3 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-800/50 flex justify-between items-center">
                                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Article Editor</span>
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                                    <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                                </div>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-zinc-500">Title</label>
                                    <div className="px-3 py-2 rounded bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/10 text-sm text-zinc-700 dark:text-zinc-300">
                                        The Summit
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between">
                                        <label className="text-xs text-zinc-500">Eyebrow</label>
                                        <div className="w-4 h-4 rounded-full bg-pink-500/20 text-pink-500 text-[10px] flex items-center justify-center">LM</div>
                                    </div>
                                    <div className="px-3 py-2 rounded bg-zinc-50 dark:bg-zinc-950/50 border border-pink-500/30 text-sm text-zinc-700 dark:text-zinc-300 flex items-center">
                                        Onwards: upwards<span className="w-0.5 h-4 bg-pink-500 ml-0.5 animate-pulse"></span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-zinc-500">Publishing date</label>
                                    <div className="px-3 py-2 rounded bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/10 text-sm text-zinc-700 dark:text-zinc-300 flex justify-between items-center">
                                        <span>2025-03-30</span>
                                        <div className="w-3 h-3 border border-zinc-400 dark:border-zinc-600 rounded-sm"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div >
                </div >

                {/* Text Side (Right) */}
                < div className="space-y-6" >
                    <div className="space-y-2">
                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            DEVELOPER-FIRST
                        </p>
                        <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
                            Schema as code, not clicks
                        </h3>
                    </div>

                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Define your content models in code and version with Git. No more point-and-click interfaces or accidental downtime caused by accidental database migrations.
                    </p>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Enjoy TypeGen, custom field validation rules, and fast local development with hot module reloading.
                    </p>

                    <div className="pt-2">
                        <Link
                            href="#"
                            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            LEARN ABOUT SCHEMA <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </div>
                </div >
            </div>
        </div>
    )
}
