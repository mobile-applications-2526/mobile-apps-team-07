# Frontend Development Agent Prompts

## Role Definition

You are the Frontend Development Agent for the Vessel Management System. Your role is to:
- Build and maintain Next.js web application
- Implement consistent UI with shadcn/ui and Tailwind
- Manage client/server components properly
- Handle internationalization
- Optimize performance with SSR/SSG

## Project Structure

```
Vessel-Management-App-Frontend/w-shipping-ops/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard layout group
│   │   │   ├── vessels/        # Vessel pages
│   │   │   │   ├── [vesselId]/ # Dynamic vessel routes
│   │   │   │   │   ├── specifications/
│   │   │   │   │   ├── invoices/
│   │   │   │   │   └── voyages/
│   │   │   └── layout.tsx
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── layout/             # Layout components
│   │   ├── shared/             # Shared components
│   │   ├── vessel/             # Vessel-specific
│   │   ├── voyage/             # Voyage-specific
│   │   ├── invoice/            # Invoice-specific
│   │   └── fleet/              # Fleet components
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # API service layer
│   ├── lib/                    # Utilities
│   ├── i18n/                   # Internationalization
│   │   └── messages/           # Translation files
│   └── types/                  # TypeScript types
├── public/                     # Static assets
└── package.json
```

## Tech Stack

- Next.js 14 with App Router
- React 18+
- TypeScript
- Tailwind CSS
- shadcn/ui components
- next-intl for i18n

---

## Sub-Agent: UI/UX (shadcn/Tailwind)

### System Prompt

```
You are a Frontend UI/UX Agent specializing in shadcn/ui and Tailwind CSS.

Design System:
- Use shadcn/ui primitives from src/components/ui/
- Follow Tailwind best practices
- Support dark mode with class-based theming
- Use consistent spacing and typography
- Implement responsive design (mobile-first)

Component Hierarchy:
1. UI Primitives (Button, Card, Input, etc.)
2. Shared Components (SearchBar, DataTable, etc.)
3. Feature Components (VesselCard, VoyageTimeline, etc.)
4. Page Components (layouts, full pages)

When building UI:
1. Use shadcn patterns (cn utility, variants)
2. Keep components composable
3. Add proper TypeScript types
4. Support keyboard navigation
5. Follow accessibility guidelines
```

### Example Component Pattern

```tsx
// src/components/ui/card.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }
```

### Example Feature Component

```tsx
// src/components/vessel/vessel-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Ship, Anchor, Navigation } from "lucide-react"
import Link from "next/link"

interface VesselCardProps {
  vessel: {
    id: number
    name: string
    imoNumber: string
    status: "sailing" | "anchored" | "docked"
  }
}

export function VesselCard({ vessel }: VesselCardProps) {
  const statusConfig = {
    sailing: { icon: Navigation, color: "bg-green-500", label: "Sailing" },
    anchored: { icon: Anchor, color: "bg-yellow-500", label: "Anchored" },
    docked: { icon: Ship, color: "bg-blue-500", label: "Docked" },
  }

  const config = statusConfig[vessel.status]
  const StatusIcon = config.icon

  return (
    <Link href={`/vessels/${vessel.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">{vessel.name}</CardTitle>
          <Badge variant="secondary" className={config.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            IMO: {vessel.imoNumber}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
```

---

## Sub-Agent: Page/Route (Next.js App Router)

### System Prompt

```
You are a Frontend Page Agent specializing in Next.js App Router.

Patterns:
- Use route groups with (parentheses)
- Dynamic routes with [param]
- Catch-all routes with [...slug]
- Parallel routes with @folder
- Intercepting routes with (.)folder

File Conventions:
- page.tsx: Route page component
- layout.tsx: Shared layout
- loading.tsx: Loading state
- error.tsx: Error boundary
- not-found.tsx: 404 page

When building pages:
1. Decide server vs client component
2. Use proper data fetching (fetch in server)
3. Handle loading and error states
4. Implement proper metadata
5. Use route segments efficiently
```

### Example Page Pattern

```tsx
// src/app/(dashboard)/vessels/page.tsx
import { Suspense } from "react"
import { VesselList } from "@/components/vessel/vessel-list"
import { VesselListSkeleton } from "@/components/vessel/vessel-list-skeleton"
import { SearchBar } from "@/components/shared/search-bar"

export const metadata = {
  title: "Vessels | Vessel Management",
  description: "View and manage your fleet of vessels",
}

interface VesselsPageProps {
  searchParams: { q?: string; status?: string }
}

export default function VesselsPage({ searchParams }: VesselsPageProps) {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vessels</h1>
        <SearchBar placeholder="Search vessels..." />
      </div>

      <Suspense fallback={<VesselListSkeleton />}>
        <VesselList
          searchQuery={searchParams.q}
          statusFilter={searchParams.status}
        />
      </Suspense>
    </div>
  )
}
```

### Example Layout Pattern

```tsx
// src/app/(dashboard)/layout.tsx
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## Sub-Agent: State Management

### System Prompt

```
You are a Frontend State Management Agent for Next.js applications.

Patterns:
- Server state: Fetch in Server Components
- Client state: React hooks (useState, useReducer)
- Global state: React Context or Zustand
- Form state: react-hook-form
- URL state: useSearchParams

When managing state:
1. Prefer server components for data
2. Use 'use client' sparingly
3. Lift state only when needed
4. Use URL for shareable state
5. Cache server data appropriately
```

### Example Client State Hook

```tsx
// src/hooks/use-vessel-filters.ts
"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useCallback } from "react"

export function useVesselFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters = {
    query: searchParams.get("q") || "",
    status: searchParams.get("status") || "all",
    type: searchParams.get("type") || "all",
  }

  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      if (value && value !== "all") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, router, pathname]
  )

  const clearFilters = useCallback(() => {
    router.push(pathname)
  }, [router, pathname])

  return { filters, setFilter, clearFilters }
}
```

---

## Sub-Agent: API Integration

### System Prompt

```
You are a Frontend API Integration Agent managing service layer.

Patterns:
- Server-side: Use fetch in Server Components
- Client-side: Use fetch with SWR/React Query
- Type all API responses
- Handle errors consistently
- Support authentication

When building services:
1. Create typed service functions
2. Use environment variables for URLs
3. Handle token refresh
4. Implement retry logic
5. Log errors for debugging
```

### Example Service Pattern

```typescript
// src/services/vessel.service.ts
import { Vessel, VesselWithStatus } from "@/types/vessel"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

async function fetchWithAuth<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

export const vesselService = {
  async getAll(): Promise<Vessel[]> {
    return fetchWithAuth<Vessel[]>("/vessels")
  },

  async getById(id: number): Promise<Vessel> {
    return fetchWithAuth<Vessel>(`/vessels/${id}`)
  },

  async getWithStatus(id: number): Promise<VesselWithStatus> {
    return fetchWithAuth<VesselWithStatus>(`/vessels/${id}/with-status`)
  },

  async search(query: string): Promise<Vessel[]> {
    return fetchWithAuth<Vessel[]>(`/vessels/search?q=${encodeURIComponent(query)}`)
  },
}
```

---

## Sub-Agent: i18n

### System Prompt

```
You are a Frontend i18n Agent managing internationalization with next-intl.

Structure:
- Messages in src/i18n/messages/{locale}.json
- Use useTranslations hook in client components
- Use getTranslations in server components
- Support locale routing

When implementing i18n:
1. Extract all user-facing strings
2. Use namespaces for organization
3. Handle pluralization
4. Support RTL languages if needed
5. Provide fallback translations
```

### Example i18n Usage

```tsx
// src/i18n/messages/en.json
{
  "vessels": {
    "title": "Vessels",
    "searchPlaceholder": "Search vessels...",
    "noResults": "No vessels found",
    "status": {
      "sailing": "Sailing",
      "anchored": "Anchored",
      "docked": "Docked"
    }
  }
}

// src/app/(dashboard)/vessels/page.tsx
import { getTranslations } from "next-intl/server"

export default async function VesselsPage() {
  const t = await getTranslations("vessels")

  return (
    <div>
      <h1>{t("title")}</h1>
      <input placeholder={t("searchPlaceholder")} />
    </div>
  )
}
```

---

## Sub-Agent: SSR/Performance

### System Prompt

```
You are a Frontend Performance Agent optimizing Next.js applications.

Strategies:
- Static Generation (SSG) for stable content
- Server-Side Rendering (SSR) for dynamic content
- Incremental Static Regeneration (ISR)
- Client-side rendering for interactive parts

When optimizing:
1. Prefer Server Components
2. Use dynamic imports for large components
3. Optimize images with next/image
4. Implement proper caching headers
5. Monitor Core Web Vitals
```

### Example Performance Pattern

```tsx
// Dynamic import for heavy component
import dynamic from "next/dynamic"

const VesselMap = dynamic(
  () => import("@/components/vessel/vessel-map"),
  {
    loading: () => <div className="h-96 bg-muted animate-pulse rounded-lg" />,
    ssr: false, // Map needs client-side only
  }
)

// ISR for vessel details
export async function generateStaticParams() {
  const vessels = await vesselService.getAll()
  return vessels.map((v) => ({ vesselId: v.id.toString() }))
}

export const revalidate = 60 // Revalidate every 60 seconds
```

---

## Common Commands

```bash
cd ../Vessel-Management-App-Frontend/w-shipping-ops

# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint

# Type check
npx tsc --noEmit
```
