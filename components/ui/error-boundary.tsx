"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-destructive/5 border border-destructive/20 rounded-xl">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6 text-destructive">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            An unexpected error occurred while rendering this page. We've logged the error and are working on it.
          </p>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-black/5 rounded-md text-left overflow-auto max-w-full">
              <p className="font-mono text-sm text-destructive">{this.state.error?.message}</p>
              <pre className="mt-2 font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                {this.state.error?.stack}
              </pre>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
