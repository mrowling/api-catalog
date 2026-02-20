# OpenAPI Template System

## For AI Agents

When generating or modifying OpenAPI specs, follow this protocol:

### Generation Strategy (AI-first with template reference)
1. Generate initial spec from user description
2. Reference relevant templates for patterns (auth, pagination, errors)
3. Validate and iterate until valid
4. Check against quality criteria
5. Suggest improvements if needed

### Template Directory Structure

```
.openapi-templates/
├── base/              # Starting points
│   ├── minimal.yaml   # Minimal valid spec
│   └── standard.yaml  # Full-featured starting point
├── domains/           # Domain-specific templates
│   ├── ecommerce/     # E-commerce APIs
│   ├── saas/          # SaaS application APIs
│   └── rest-crud/     # Standard REST CRUD APIs
└── patterns/          # Reusable patterns
    ├── pagination.yaml         # Pagination schemas
    ├── error-handling.yaml     # Error response patterns
    ├── authentication.yaml     # Auth schemes
    └── webhooks.yaml           # Webhook patterns
```

### Using Templates

**base/minimal.yaml** - Starting point for simple APIs
- Single endpoint example
- Minimal required sections
- Use when user wants "just the basics"

**base/standard.yaml** - Full-featured starting point
- Multiple endpoint examples
- All common sections included
- Use as default for most cases

**domains/** - Domain-specific patterns and schemas
- Pre-configured for specific use cases
- Includes common entities for that domain
- Use when user mentions domain keywords

**patterns/** - Reusable components
- Copy components into spec's `components` section
- Reference with `$ref: '#/components/schemas/...'`
- Mix and match as needed

### Auto-Detection Keywords

**E-commerce**: product, cart, order, checkout, payment, inventory, catalog
**SaaS**: user, tenant, subscription, billing, organization, workspace
**REST CRUD**: resource, entity, CRUD, list, create, read, update, delete

### Quality Criteria

Before presenting a spec to users, ensure:
- [ ] Valid OpenAPI 3.1.x (passes validation)
- [ ] All operations have summaries and descriptions
- [ ] Error responses defined (at minimum: 400, 500)
- [ ] Request/response examples provided
- [ ] Consistent naming conventions applied
- [ ] Security schemes defined if authentication needed
- [ ] Reusable schemas in components section
- [ ] Quality score ≥ 85/100

### Modification Protocol

When modifying existing specs:
1. Read and parse current spec
2. Understand current structure and patterns
3. Apply changes preserving existing patterns
4. Validate result
5. Show diff highlighting changes

### Pattern Application Protocol

When adding patterns (pagination, auth, etc.):
1. **Ask first**: "Should I add [pattern]?"
2. **Show options**: "What authentication type? [Bearer/API Key/OAuth2]"
3. **Confirm addition**: "Added RFC 7807 error handling"
4. **Update references**: Ensure all paths reference new components

### Quality Assessment

Calculate quality score based on:
- **Completeness** (40 points): descriptions, examples, error responses
- **Structure** (30 points): proper use of components, $ref usage
- **Standards** (20 points): naming conventions, OpenAPI 3.1 compliance
- **Best Practices** (10 points): security schemes, versioning

Score breakdown:
- 90-100: Excellent - production ready
- 85-89: Good - minor improvements possible
- 70-84: Fair - needs improvement
- Below 70: Poor - significant issues

### Iteration Guidelines

- Maximum 3 iterations to reach 85/100 quality
- If still failing, ask clarifying questions:
  - "Should endpoint X support pagination?"
  - "What error codes should Y return?"
  - "Do you need authentication for this API?"
  - "Should I include request/response examples?"

### Common Fixes

**Low quality scores often need:**
- Add operation descriptions: "Retrieves a list of users"
- Add error responses: 400 (Bad Request), 500 (Internal Server Error)
- Add examples: sample request/response bodies
- Use $ref: move inline schemas to components
- Add security: define security schemes for protected endpoints
