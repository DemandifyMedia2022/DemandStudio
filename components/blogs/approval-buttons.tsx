"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Check, X, Loader2, FileText, Image as ImageIcon, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ApprovalButtonsProps {
    blogId: string
    blogData?: any
}

export function ApprovalButtons({ blogId, blogData }: ApprovalButtonsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [rejectReason, setRejectReason] = useState("")
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)

    const handleApprove = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/blogs/${blogId}/publish`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                }
            })

            if (response.ok) {
                toast.success("Blog published successfully")
                setIsPreviewDialogOpen(false)
                router.refresh()
            } else {
                const data = await response.json()
                toast.error(data.error || "Failed to publish blog")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/blogs/${blogId}/reject`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ rejectionReason: rejectReason })
            })

            if (response.ok) {
                toast.success("Blog rejected")
                setIsRejectDialogOpen(false)
                setIsPreviewDialogOpen(false)
                router.refresh()
            } else {
                const data = await response.json()
                toast.error(data.error || "Failed to reject blog")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const faqs = blogData?.faqs ? (typeof blogData.faqs === 'string' ? JSON.parse(blogData.faqs) : blogData.faqs) : []

    return (
        <div className="flex gap-1">
            <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8"
                        title="Review Content"
                    >
                        <FileText className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Review AI Generated Content</DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="flex-1 mt-4 pr-4">
                        <div className="space-y-6 pb-6">
                            <section className="space-y-2">
                                <h3 className="font-bold text-lg border-b pb-1">Full Content</h3>
                                <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded border whitespace-pre-wrap font-sans">
                                    {blogData?.content}
                                </div>
                            </section>

                            {faqs.length > 0 && (
                                <section className="space-y-2">
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        FAQs
                                    </h3>
                                    <div className="space-y-3">
                                        {faqs.map((faq: any, i: number) => (
                                            <div key={i} className="p-3 bg-white border rounded shadow-sm">
                                                <p className="font-semibold text-sm">Q: {faq.question}</p>
                                                <p className="text-sm text-gray-600 mt-1">A: {faq.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {blogData?.imagePrompt && (
                                <section className="space-y-2">
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <ImageIcon className="h-5 w-5" />
                                        Image Prompt
                                    </h3>
                                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded text-sm italic">
                                        "{blogData.imagePrompt}"
                                    </div>
                                </section>
                            )}
                        </div>
                    </ScrollArea>

                    <DialogFooter className="border-t pt-4 flex sm:justify-between items-center">
                        <div className="flex gap-2">
                            <Button variant="destructive" onClick={() => setIsRejectDialogOpen(true)} disabled={loading}>
                                Reject
                            </Button>
                            <Button variant="default" onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Approve & Publish
                            </Button>
                        </div>
                        <Button variant="ghost" onClick={() => setIsPreviewDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button
                variant="outline"
                size="icon"
                className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8"
                onClick={handleApprove}
                disabled={loading}
                title="Quick Approve"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>

            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                        disabled={loading}
                        title="Quick Reject"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject AI Draft</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Label htmlFor="reason">Reason for rejection (optional)</Label>
                        <Textarea
                            id="reason"
                            placeholder="Explain why this content was rejected..."
                            value={rejectReason}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject Content
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
