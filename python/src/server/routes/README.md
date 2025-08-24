# Type-Safe Routing System

This directory contains the centralized, type-safe routing system that ensures perfect synchronization between backend Python routes and frontend TypeScript code.

## Overview

The routing system provides:
- **Single source of truth** for all API routes (defined in Python)
- **Automatic TypeScript generation** from Python route definitions
- **Type-safe route access** in frontend with auto-completion
- **Zero runtime errors** from mistyped routes
- **Easy refactoring** - change routes in one place

## Structure

```
routes/
├── __init__.py              # Module exports
├── api_routes.py            # Central route definitions (source of truth)
├── route_generator.py       # TypeScript generation logic
├── generate_routes.py       # Script to generate frontend routes
├── routes.generated.ts      # Generated TypeScript routes (for reference)
└── README.md               # This file
```

## Frontend Structure

```
archon-ui-main/src/routes/
├── index.ts                 # Main exports
├── api-client.ts           # Type-safe API client utilities
├── routes.generated.ts     # Auto-generated route definitions
└── services/               # Service-specific API clients
    └── unifiedProviderService.ts
```

## Usage

### Backend (Python)

Define routes in `api_routes.py`:

```python
class APIRoutes:
    class Providers:
        BASE = "/api/providers"
        LIST = "/"
        DETAIL = "/{provider_id}"
        HEALTH_CHECK = "/{provider_id}/health-check"
```

Use in FastAPI routers:

```python
from server.routes import APIRoutes

router = APIRouter(prefix=APIRoutes.Providers.BASE)

@router.get(APIRoutes.Providers.LIST)
async def list_providers():
    pass

@router.get(APIRoutes.Providers.DETAIL)
async def get_provider(provider_id: str):
    pass
```

### Frontend (TypeScript)

After generating routes, use them type-safely:

```typescript
import { API_ROUTES } from '@/routes';
import { api } from '@/routes/api-client';

// Type-safe route access with parameters
const provider = await api.get(
  API_ROUTES.providers.detail,
  ['provider-uuid-here']
);

// Using the service wrapper
import { providerApi } from '@/routes/services/unifiedProviderService';

const providers = await providerApi.list();
const provider = await providerApi.get('provider-uuid');
```

## Generating Routes

### Manual Generation

Run the generation script:

```bash
cd python
python src/server/routes/generate_routes.py
```

This will:
1. Read route definitions from `api_routes.py`
2. Generate TypeScript definitions
3. Write to `archon-ui-main/src/routes/routes.generated.ts`

### Automatic Generation (Development)

Add to your development workflow:

```json
// package.json
{
  "scripts": {
    "generate:routes": "cd ../python && python src/server/routes/generate_routes.py",
    "dev": "npm run generate:routes && vite"
  }
}
```

### CI/CD Integration

Add to your build pipeline:

```yaml
# .github/workflows/build.yml
- name: Generate TypeScript routes
  run: |
    cd python
    python src/server/routes/generate_routes.py
    
- name: Check if routes are in sync
  run: |
    git diff --exit-code archon-ui-main/src/routes/routes.generated.ts
```

## Adding New Routes

1. **Define in Python** (`api_routes.py`):
   ```python
   class NewFeature:
       BASE = "/api/new-feature"
       LIST = "/"
       CREATE = "/"
   ```

2. **Generate TypeScript**:
   ```bash
   python src/server/routes/generate_routes.py
   ```

3. **Use in Backend**:
   ```python
   router = APIRouter(prefix=APIRoutes.NewFeature.BASE)
   
   @router.post(APIRoutes.NewFeature.CREATE)
   async def create_feature():
       pass
   ```

4. **Use in Frontend**:
   ```typescript
   await api.post(
     API_ROUTES.newfeature.create,
     [],
     { data: 'here' }
   );
   ```

## Benefits

### Type Safety
- TypeScript compiler catches route typos at build time
- IDE auto-completion for all routes
- Parameter type checking

### Maintainability
- Single source of truth (Python backend)
- Automatic synchronization
- Easy refactoring

### Developer Experience
- No more hardcoded strings
- Clear route organization
- Self-documenting API structure

## Route Naming Conventions

- **BASE**: The base path for a router group
- **LIST**: Get all items (GET /)
- **CREATE**: Create new item (POST /)
- **DETAIL**: Get single item (GET /{id})
- **UPDATE**: Update item (PATCH /{id})
- **DELETE**: Delete item (DELETE /{id})

## Validation

The system includes validation to ensure:
- All backend routes have TypeScript definitions
- No hardcoded route strings in frontend
- Routes stay synchronized

Run validation:

```bash
python -m pytest tests/test_route_sync.py
```

## Troubleshooting

### Routes not updating
- Ensure you've run the generation script
- Check for TypeScript compilation errors
- Verify the generated file path is correct

### Missing parameters
- Parameters are extracted from `{param_name}` in routes
- Ensure consistent naming between Python and TypeScript

### Import errors
- Use relative imports in frontend: `@/routes`
- Ensure routes directory is in TypeScript paths config

## Future Enhancements

- [ ] Watch mode for automatic regeneration
- [ ] OpenAPI schema integration
- [ ] Route documentation generation
- [ ] Runtime route validation
- [ ] Route versioning support