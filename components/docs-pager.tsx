import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface DocsPagerProps {
    prev?: {
        title: string
        href: string
    }
    next?: {
        title: string
        href: string
    }
}

export function DocsPager({ prev, next }: DocsPagerProps) {
    return (
        <div className="flex flex-row items-center justify-between mt-10 space-x-4">
            {prev ? (
                <Link
                    href={prev.href}
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-auto w-full max-w-[50%] flex-col items-start justify-start whitespace-normal p-4 hover:bg-muted/50"
                    )}
                >
                    <div className="flex flex-row items-center text-sm text-muted-foreground">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                    </div>
                    <div className="font-medium text-foreground mt-1">{prev.title}</div>
                </Link>
            ) : (
                <div className="w-full max-w-[50%]" />
            )}
            {next ? (
                <Link
                    href={next.href}
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "h-auto w-full max-w-[50%] flex-col items-end justify-end whitespace-normal p-4 hover:bg-muted/50 ml-auto text-right"
                    )}
                >
                    <div className="flex flex-row items-center text-sm text-muted-foreground">
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </div>
                    <div className="font-medium text-foreground mt-1">{next.title}</div>
                </Link>
            ) : (
                <div className="w-full max-w-[50%]" />
            )}
        </div>
    )
}
