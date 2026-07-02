"use client"

import * as React from "react"
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Key,
  Settings,
  Users,
  Building,
  Database,
  Layers,
  LogOut,
  Globe,
  ArrowLeft,
  ImageIcon,
} from "lucide-react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenuButton,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Types
type User = {
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string
}

type Org = {
  id: string
  name: string
  slug: string
}

type ContentType = {
  id: string
  name: string
  slug: string
}

export function AppSidebar({
  user,
  role = "user",
  org,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: User, role?: "admin" | "user" | "org", org?: Org }) {
  const pathname = usePathname()
  const [orgs, setOrgs] = React.useState<Org[]>([])
  const [pendingCount, setPendingCount] = React.useState(0)


  // Fetch data only for regular users and org view context
  React.useEffect(() => {
    // We might need orgs list even in org view if we want to switch orgs, 
    // but for now let's keep it simple. fetching orgs is useful for "user" role primarily.
    if (role === "user") {
      fetch("/api/organizations")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setOrgs(data)
        })
        .catch(console.error)
    }

    if (role === "admin") {
      // Fetch pending comments count for admin
      fetch("/api/comments?status=pending&limit=1")
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.total === "number") {
            setPendingCount(data.total)
          }
        })
        .catch(console.error)
    }
  }, [role])

  // Construct Data based on role
  const data = React.useMemo(() => {
    if (role === "admin") {
      return {
        user: {
          name: user.name || "Admin",
          email: user.email || "",
          avatar: user.image || "",
        },
        teams: [],
        navMain: [
          {
            title: "Admin Portal",
            url: "#",
            icon: Settings,
            isActive: true,
            items: [
              {
                title: "Overview",
                url: "/dashboard/admin",
                isActive: pathname === "/dashboard/admin",
              },
              {
                title: "Organizations",
                url: "/dashboard/admin/organizations",
                isActive: pathname.startsWith("/dashboard/admin/organizations"),
              },
              {
                title: "Users",
                url: "/dashboard/admin/users",
                isActive: pathname.startsWith("/dashboard/admin/users"),
              },
              {
                title: "Comments",
                url: "/dashboard/admin/comments",
                isActive: pathname.startsWith("/dashboard/admin/comments"),
                badge: pendingCount,
              },
              {
                title: "Settings",
                url: "/dashboard/admin/settings",
                isActive: pathname.startsWith("/dashboard/admin/settings"),
              },
            ],
          },
        ],
      }
    }

    if (role === "org" && org) {
      return {
        user: {
          name: user.name || "User",
          email: user.email || "",
          avatar: user.image || "",
        },
        teams: [], // We display the single Org in header
        navMain: [
          {
            title: org.name,
            url: "#",
            icon: Building,
            isActive: true,
            items: [
              {
                title: "Overview",
                url: `/dashboard/${org.slug}`,
                isActive: pathname === `/dashboard/${org.slug}` || pathname === `/dashboard/${org.slug}/`,
              },
              {
                title: "Projects",
                url: `/dashboard/${org.slug}/projects`,
                isActive: pathname.startsWith(`/dashboard/${org.slug}/projects`),
              },
              {
                title: "Members",
                url: `/dashboard/${org.slug}/members`,
                isActive: pathname.startsWith(`/dashboard/${org.slug}/members`),
              },
              {
                title: "Media Library",
                url: `/dashboard/${org.slug}/media`,
                isActive: pathname.startsWith(`/dashboard/${org.slug}/media`),
              },
              {
                title: "Settings",
                url: `/dashboard/${org.slug}/settings`,
                isActive: pathname.startsWith(`/dashboard/${org.slug}/settings`),
              },
            ],
          },
        ],
      }
    }

    // User Data (Default)
    return {
      user: {
        name: user.name || "User",
        email: user.email || "",
        avatar: user.image || "",
      },
      teams: orgs.map(org => ({
        name: org.name,
        logo: Building, // Placeholder logo
        plan: "Organization",
        url: `/dashboard/${org.slug}`
      })),
      navMain: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
          isActive: pathname === "/dashboard",
          items: [],
        },
        {
          title: "Content",
          url: "#",
          icon: FileText,
          isActive: true,
          items: [
            {
              title: "Posts",
              url: "/dashboard/posts",
              isActive: pathname.startsWith("/dashboard/posts"),
            },
            {
              title: "Blogs",
              url: "/dashboard/blogs",
              isActive: pathname.startsWith("/dashboard/blogs"),
            },
            {
              title: "Comments",
              url: "/dashboard/comments",
              isActive: pathname.startsWith("/dashboard/comments"),
            },
            {
              title: "Events",
              url: "/dashboard/events",
              isActive: pathname.startsWith("/dashboard/events"),
            },
            {
              title: "Media Library",
              url: "/dashboard/media",
              isActive: pathname.startsWith("/dashboard/media"),
            },
            {
              title: "Advertisements",
              url: "/dashboard/advertisements",
              isActive: pathname.startsWith("/dashboard/advertisements"),
            },
          ],
        },
        {
          title: "Developer",
          url: "#",
          icon: Key,
          items: [
            {
              title: "API Keys",
              url: "/dashboard/api-keys",
              isActive: pathname.startsWith("/dashboard/api-keys"),
            },
            {
              title: "API Docs",
              url: "/dashboard/api-docs",
              isActive: pathname.startsWith("/dashboard/api-docs"),
            },
          ],
        },

      ],
    }
  }, [role, user, pathname, orgs, org])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {role === "user" && data.teams.length > 0 && (
          <TeamSwitcher teams={data.teams} />
        )}
        {role === "admin" && (
          <div className="flex items-center gap-2 px-4 py-2 font-bold text-lg text-sidebar-foreground">
            <Settings className="h-6 w-6" />
            <span className="truncate">Admin Portal</span>
          </div>
        )}
        {role === "org" && org && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-4 py-2 font-bold text-lg text-sidebar-foreground">
              <Building className="h-6 w-6" />
              <span className="truncate">{org.name}</span>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {role === "org" && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/dashboard" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span>Back to Dashboard</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
