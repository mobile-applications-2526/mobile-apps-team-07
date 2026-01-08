# Quick Reference - Agent Commands

## Agent Invocation

Use these patterns when asking Claude to work on specific areas:

### Planning
```
@planning - Full planning workflow
@planning:prompt - Create optimized prompts
@planning:architecture - Make architecture decisions
@planning:tasks - Break down features into tasks
```

### Testing
```
@testing - Run all tests
@testing:unit:mobile - Mobile Jest tests
@testing:unit:backend - Backend JUnit tests
@testing:unit:frontend - Frontend tests
@testing:e2e - Detox E2E tests
@testing:coverage - Generate coverage reports
```

### Mobile Development
```
@mobile - Mobile development
@mobile:ui - UI components with NativeWind
@mobile:api - API services
@mobile:state - TanStack Query hooks
@mobile:navigation - Expo Router
@mobile:offline - SQLite caching
```

### Backend Development
```
@backend - Backend development
@backend:controller - REST controllers
@backend:service - Business logic
@backend:repository - JPA/database
@backend:security - Auth/JWT
@backend:document - PDF/OCR processing
```

### Frontend Development
```
@frontend - Frontend development
@frontend:ui - shadcn/ui components
@frontend:page - Next.js pages
@frontend:api - Service layer
@frontend:i18n - Translations
```

### Cross-Platform
```
@cross-platform - Cross-platform sync
@cross-platform:api - API contract verification
@cross-platform:types - DTO/Type sync
@cross-platform:design - Design system consistency
```

---

## Common Workflows

### Adding a New Feature
1. `@planning:tasks` - Break down the feature
2. `@backend:controller` + `@backend:service` - Build API
3. `@cross-platform:types` - Sync TypeScript types
4. `@mobile:api` + `@mobile:ui` - Build mobile
5. `@frontend:api` + `@frontend:ui` - Build web
6. `@testing` - Add tests

### Fixing a Bug
1. Identify affected platform(s)
2. `@{platform}` - Fix the bug
3. `@testing:unit:{platform}` - Add regression test
4. `@cross-platform:api` - Verify consistency

### Running Tests
```bash
# All platforms
source .claude/workspace-commands.sh && test_all

# Mobile only
npm test

# Backend only
cd ../Vessel-Management-App-Backend && ./mvnw test

# E2E
npm run e2e:ios
```

---

## File Locations

### Mobile (this repo)
| Type | Location |
|------|----------|
| Pages | `app/` |
| Components | `components/` |
| Services | `services/` |
| Hooks | `hooks/` |
| Types | `types/` |
| Tests | `__tests__/` |
| E2E Tests | `e2e/` |

### Backend
| Type | Location |
|------|----------|
| Controllers | `src/main/java/.../controller/` |
| Services | `src/main/java/.../service/` |
| Repositories | `src/main/java/.../repository/` |
| DTOs | `src/main/java/.../dto/` |
| Tests | `src/test/java/` |

### Frontend
| Type | Location |
|------|----------|
| Pages | `src/app/` |
| Components | `src/components/` |
| Services | `src/services/` |
| Hooks | `src/hooks/` |
| Types | `src/types/` |

---

## Tech Stack Summary

| Platform | Framework | UI | State | Testing |
|----------|-----------|-----|-------|---------|
| Mobile | React Native/Expo | NativeWind | TanStack Query | Jest, Detox |
| Backend | Spring Boot 3.5 | - | JPA | JUnit 5, MockMVC |
| Frontend | Next.js 14 | shadcn/ui | React Hooks | Jest |

---

## Useful Commands

```bash
# Load workspace commands
source .claude/workspace-commands.sh

# Show all commands
workspace_help

# Quick navigation
cdm  # mobile
cdb  # backend
cdf  # frontend

# Development servers
dev_mobile
dev_backend
dev_frontend

# Testing
test_all
test_mobile
test_backend
```
