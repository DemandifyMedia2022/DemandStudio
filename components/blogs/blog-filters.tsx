"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

const CATEGORIES_MAP: Record<string, string[]> = {
  "Trending Topic": ["Artificial Intelligence", "Cybersecurity", "Cloud", "Software", "Mobile", "Technology"],
  "FinTeq": ["Banking Tech", "Wealth Tech", "SoftTech", "PayTech", "InsurTech", "FinTeq"],
  "CXTeq": ["CX Automation", "Customer Journey", "Customer Data Platform"],
  "HRTeq": ["HCM", "HRMS", "Learning & Development", "Payroll Management", "Recruitment & Staff Augmentation"],
  "MarTeq": []
}

export function BlogFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const category = searchParams.get("category") || ""
  const subcategory = searchParams.get("subcategory") || ""
  const status = searchParams.get("status") || ""

  const subcategories = category ? CATEGORIES_MAP[category] || [] : []

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
      if (key === "category") {
        params.delete("subcategory")
      }
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push("?")
  }

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="w-[180px]">
        <Select value={status || "all"} onValueChange={(val: string) => updateFilters("status", val)}>
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-[180px]">
        <Select value={category || "all"} onValueChange={(val) => updateFilters("category", val)}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.keys(CATEGORIES_MAP).map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {category && category !== "MarTeq" && (
        <div className="w-[180px]">
          <Select value={subcategory || "all"} onValueChange={(val) => updateFilters("subcategory", val)}>
            <SelectTrigger>
              <SelectValue placeholder="All Subcategories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subcategories</SelectItem>
              {subcategories.map((sub) => (
                <SelectItem key={sub} value={sub}>
                  {sub}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(category || subcategory || status) && (
        <Button variant="ghost" onClick={clearFilters} className="h-10">
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  )
}
