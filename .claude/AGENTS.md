# Vessel Management System - Agent Architecture

## Overview

This document defines the multi-agent architecture for the Vessel Management System, enabling coordinated development across:

- **Mobile App** (React Native/Expo): `./` (this repo)
- **Backend** (Spring Boot Java 21): `../Vessel-Management-App-Backend`
- **Frontend Web** (Next.js): `../Vessel-Management-App-Frontend/w-shipping-ops`

## Project Paths

```
MOBILE_ROOT=/Users/sadradezdar/Documents/Vessel Management System/mobile-apps-team-07
BACKEND_ROOT=/Users/sadradezdar/Documents/Vessel Management System/Vessel-Management-App-Backend
FRONTEND_ROOT=/Users/sadradezdar/Documents/Vessel Management System/Vessel-Management-App-Frontend/w-shipping-ops
```

---

## Agent Hierarchy

```
Root Orchestrator
├── Planning Agent
│   ├── Prompt Engineer Sub-Agent
│   ├── Architecture Decision Sub-Agent
│   └── Task Breakdown Sub-Agent
│
├── Testing Agent
│   ├── Unit Test Mobile Sub-Agent
│   ├── Unit Test Backend Sub-Agent
│   ├── Unit Test Frontend Sub-Agent
│   ├── E2E Test Sub-Agent
│   ├── Integration Test Sub-Agent
│   └── Test Coverage Sub-Agent
│
├── Mobile Development Agent
│   ├── UI/UX Sub-Agent (NativeWind/shadcn)
│   ├── API Integration Sub-Agent
│   ├── State Management Sub-Agent (TanStack Query)
│   ├── Navigation Sub-Agent (Expo Router)
│   ├── Offline/Caching Sub-Agent (SQLite)
│   └── Native Features Sub-Agent
│
├── Backend Development Agent
│   ├── Controller Sub-Agent
│   ├── Service Layer Sub-Agent
│   ├── Repository/JPA Sub-Agent
│   ├── Security/Auth Sub-Agent (JWT)
│   ├── Document Processing Sub-Agent (PDF/OCR)
│   ├── API Documentation Sub-Agent (OpenAPI)
│   └── Database Migration Sub-Agent
│
├── Frontend Development Agent
│   ├── UI/UX Sub-Agent (shadcn/Tailwind)
│   ├── Page/Route Sub-Agent (Next.js App Router)
│   ├── State Management Sub-Agent
│   ├── API Integration Sub-Agent
│   ├── i18n Sub-Agent
│   └── SSR/Performance Sub-Agent
│
└── Cross-Platform Agent
    ├── API Contract Sub-Agent
    ├── DTO/Type Sync Sub-Agent
    ├── Schema Migration Sub-Agent
    └── Design System Sub-Agent
```

---

## Agent Definitions

### 1. Root Orchestrator

**Role**: Coordinates all agents, delegates tasks, manages cross-project workflows

**Capabilities**:
- Parse user requests and route to appropriate agents
- Spawn parallel agents for independent tasks
- Aggregate results from multiple agents
- Handle cross-project dependencies

**Trigger Phrases**:
- "Build feature X" → Analyzes scope, delegates to relevant agents
- "Fix bug in Y" → Identifies affected layers, coordinates fix
- "Run all tests" → Spawns Testing Agent with all sub-agents

---

### 2. Planning Agent

**Role**: Strategic planning, prompt engineering, architecture decisions

#### Sub-Agents:

| Sub-Agent | Trigger | Output |
|-----------|---------|--------|
| **Prompt Engineer** | "Create prompt for...", "Optimize prompt..." | Refined prompts for other agents |
| **Architecture Decision** | "Design...", "Choose between...", "Evaluate..." | ADR (Architecture Decision Record) |
| **Task Breakdown** | "Plan implementation of...", "Break down..." | Ordered task list with dependencies |

---

### 3. Testing Agent

**Role**: Manage all testing across the stack

#### Sub-Agents:

| Sub-Agent | Scope | Commands |
|-----------|-------|----------|
| **Unit Test Mobile** | `__tests__/` | `npm test`, `npm run test:coverage` |
| **Unit Test Backend** | `src/test/java/` | `./mvnw test` |
| **Unit Test Frontend** | `src/__tests__/` | `npm test` |
| **E2E Test** | `e2e/` | `npm run e2e:ios`, `npm run e2e:android` |
| **Integration Test** | Cross-service | Custom integration scripts |
| **Test Coverage** | All | Generate coverage reports |

---

### 4. Mobile Development Agent

**Role**: React Native/Expo mobile app development

#### Sub-Agents:

| Sub-Agent | Responsibility | Key Paths |
|-----------|---------------|-----------|
| **UI/UX** | Components, styling, animations | `components/`, `components/ui/` |
| **API Integration** | Service layer, network calls | `services/` |
| **State Management** | TanStack Query, caching | `hooks/queries/`, `context/` |
| **Navigation** | Expo Router, deep linking | `app/` |
| **Offline/Caching** | SQLite, offline-first | `lib/database/` |
| **Native Features** | Camera, file system, haptics | Platform-specific code |

---

### 5. Backend Development Agent

**Role**: Spring Boot Java backend development

#### Sub-Agents:

| Sub-Agent | Responsibility | Package |
|-----------|---------------|---------|
| **Controller** | REST endpoints, validation | `controller/` |
| **Service Layer** | Business logic | `service/` |
| **Repository/JPA** | Database operations, entities | `repository/`, `model/` |
| **Security/Auth** | JWT, Spring Security | `config/` |
| **Document Processing** | PDF/Excel parsing, OCR | `processing/` |
| **API Documentation** | OpenAPI/Swagger | `springdoc` annotations |
| **Database Migration** | Schema changes | `resources/` |

---

### 6. Frontend Development Agent

**Role**: Next.js web frontend development

#### Sub-Agents:

| Sub-Agent | Responsibility | Key Paths |
|-----------|---------------|-----------|
| **UI/UX** | Components, shadcn/ui, Tailwind | `src/components/`, `src/components/ui/` |
| **Page/Route** | App Router pages, layouts | `src/app/` |
| **State Management** | React hooks, context | `src/hooks/` |
| **API Integration** | Service layer, fetch | `src/services/` |
| **i18n** | Internationalization | `src/i18n/` |
| **SSR/Performance** | Server components, caching | Next.js config |

---

### 7. Cross-Platform Agent

**Role**: Maintain consistency across mobile, backend, and frontend

#### Sub-Agents:

| Sub-Agent | Responsibility |
|-----------|---------------|
| **API Contract** | Ensure all clients match backend API |
| **DTO/Type Sync** | TypeScript types ↔ Java DTOs |
| **Schema Migration** | Database changes across platforms |
| **Design System** | Consistent UI patterns |

---

## Usage Examples

### Example 1: Add New Feature

```
User: "Add vessel tracking with live location updates"

Orchestrator:
1. → Planning Agent (Task Breakdown): Break into tasks
2. → Backend Agent (Controller + Service): Create tracking endpoint
3. → Mobile Agent (API + UI): Integrate and display
4. → Frontend Agent (Page + UI): Integrate and display
5. → Testing Agent: Add tests for all layers
6. → Cross-Platform Agent: Verify consistency
```

### Example 2: Fix a Bug

```
User: "Login fails on mobile after token expires"

Orchestrator:
1. → Mobile Agent (API Integration): Investigate token refresh
2. → Backend Agent (Security): Check JWT expiration logic
3. → Testing Agent (Unit + E2E): Add regression tests
```

### Example 3: Run Tests

```
User: "Run all tests and fix failures"

Orchestrator (parallel):
├── Testing Agent (Unit Mobile)
├── Testing Agent (Unit Backend)
├── Testing Agent (Unit Frontend)
└── Testing Agent (E2E)

Then: Aggregate results, fix failures
```

---

## Agent Invocation Syntax

When working with Claude Code, invoke agents using:

```
@planning - Invoke Planning Agent
@testing - Invoke Testing Agent
@mobile - Invoke Mobile Development Agent
@backend - Invoke Backend Development Agent
@frontend - Invoke Frontend Development Agent
@cross-platform - Invoke Cross-Platform Agent
```

Or use specific sub-agents:

```
@testing:unit:mobile - Mobile unit tests only
@mobile:ui - UI/UX sub-agent only
@backend:controller - Controller sub-agent only
```

---

## Configuration Files

- `AGENTS.md` - This file (agent definitions)
- `prompts/` - Detailed prompts for each agent
- `settings.json` - Claude Code settings
