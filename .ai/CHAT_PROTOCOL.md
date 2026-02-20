# Chat Agent Protocol

## Overview

This document defines how the chat agent should behave when generating and modifying OpenAPI specifications through conversational interaction.

## Interaction Style

### Detail Level: Step-by-Step Progress
Show users what's happening at each stage:
- "Analyzing requirements..."
- "Auto-selected: rest-crud template"
- "Generating spec..."
- "Validating... ✓"
- "Quality check: 68/100 - Improving..."
- "Quality: 92/100 ✓"

### Status Updates
Use live-updating status messages that replace themselves:
```
🤔 Analyzing requirements...
  ↓
⚙️ Generating spec...
  ↓
✓ Validation passed
  ↓
⚠️ Quality: 68/100 - Improving...
  ↓
✓ Quality: 92/100 - Complete
```

### Context Maintenance
- Remember conversation history across messages
- Track current spec state in editor
- Reference previous user requests
- Support conversational shortcuts: "add that to users too", "make it RESTful"

## Template Selection

### Auto-Detection
Detect domain from user description keywords:

**E-commerce**: product, cart, order, checkout, payment, inventory, catalog, shopping
**SaaS**: user, tenant, subscription, billing, organization, workspace, team, account
**REST CRUD**: resource, entity, CRUD, list, create, read, update, delete, RESTful

### Inform User
Always tell user which template was selected:
- "Detected: E-commerce API - using e-commerce template"
- "Auto-selected: rest-crud template for standard resource management"

### Allow Override
If user specifies template explicitly, use it:
- "Create a blog API using the SaaS template"
- "Generate a REST API without using templates"

## Pattern Suggestions

### Ask Explicitly
Never silently add patterns. Always ask first:

```
Agent: Should I add:
[✓] Pagination?
[✓] Error handling (RFC 7807)?
[ ] Authentication?
```

### Show Options for Choices
When pattern has multiple implementations, offer choices:

```
Agent: What authentication type?
[1] Bearer Token (JWT)
[2] API Key
[3] OAuth 2.0
[4] None
```

### Confirm What Was Added
After adding patterns, show what was done:
- "Added cursor-based pagination to /users endpoint"
- "Added RFC 7807 error handling with ValidationError support"
- "Added Bearer token authentication with JWT format"

## Generation Workflow

### 1. Initial Analysis
```
User: "Create a blog API with posts and comments"

Agent: 🤔 Analyzing requirements...
• Detected: REST CRUD pattern
• Auto-selected: rest-crud template
• Entities identified: Post, Comment
```

### 2. Pattern Questions
```
Agent: Should I add:
[✓] Pagination for list endpoints?
[✓] Error handling (RFC 7807)?
[ ] Authentication?

User: Yes to all, use JWT auth

Agent: What authentication should apply to:
[✓] All endpoints (default)
[ ] Only write operations (POST, PUT, DELETE)
[ ] Specific endpoints (I'll specify)
```

### 3. Generation with Progress
```
Agent: ⚙️ Generating spec...
• Creating Post schema...
• Creating Comment schema...
• Adding CRUD endpoints...
• Applying pagination pattern...
• Adding authentication...
```

### 4. Validation Loop
```
Agent: ✓ Validating spec...
Agent: ⚠️ Quality: 68/100
• Missing descriptions: 5 operations
• No examples: 3 schemas
• Improving...

Agent: ⚙️ Iteration 2/3...
• Adding operation descriptions...
• Adding request/response examples...

Agent: ✓ Quality: 92/100
Created spec with 12 endpoints, 4 schemas
```

### 5. Ask for Clarification if Needed
If quality threshold not met after 3 iterations:

```
Agent: I need more details to improve quality:

1. Should /posts endpoint return paginated results?
   [Yes] [No]

2. What error codes should POST /posts return?
   [✓] 400 (Bad Request)
   [✓] 401 (Unauthorized)
   [ ] 403 (Forbidden)
   [✓] 500 (Internal Error)

3. Should I include request/response examples?
   [Yes] [No]
```

## Modification Workflow

### 1. User Requests Change
```
User: "Add authentication to all endpoints"
```

### 2. Agent Analyzes
```
Agent: 🔍 Analyzing current spec...
• Current spec: Blog API v1.0.0
• 12 endpoints currently without auth
• Will add Bearer token authentication
```

### 3. Generate Modification
```
Agent: ⚙️ Generating changes...
• Adding securitySchemes...
• Applying security to endpoints...
• Adding 401 error responses...
```

### 4. Show Diff
```
Agent: 📝 Proposed changes:

components:
  securitySchemes:
+   bearerAuth:
+     type: http
+     scheme: bearer
+     bearerFormat: JWT

paths:
  /posts:
    get:
+     security:
+       - bearerAuth: []
      responses:
+       '401':
+         $ref: '#/components/responses/Unauthorized'
```

### 5. Wait for Approval
```
Agent: Apply these changes?
[✓ Apply] [✗ Cancel] [✏️ Refine]

User: Apply

Agent: ✓ Changes applied
Updated 12 endpoints with authentication
```

### 6. Refine if Requested
```
User: Refine

Agent: What would you like to change?
[1] Use API Key instead of Bearer token
[2] Only apply auth to write operations
[3] Add OAuth 2.0 flows
[4] Something else (describe)

User: 2

Agent: Updating... Only write operations will require auth
```

## Quality Assessment

### Scoring Breakdown
- **Completeness** (40 points)
  - All operations have descriptions (10pt)
  - All operations have summaries (5pt)
  - Error responses defined (10pt)
  - Request/response examples (15pt)

- **Structure** (30 points)
  - Proper use of components section (15pt)
  - $ref usage for reusable schemas (15pt)

- **Standards** (20 points)
  - Valid OpenAPI 3.1.x (10pt)
  - Consistent naming conventions (10pt)

- **Best Practices** (10 points)
  - Security schemes defined if needed (5pt)
  - Versioning in URL/header (5pt)

### Quality Thresholds
- **90-100**: Excellent - production ready
- **85-89**: Good - present to user
- **70-84**: Fair - iterate to improve
- **Below 70**: Poor - ask for clarification

### Display to User
Show quality scores and breakdowns:
```
Agent: Quality: 92/100
• Completeness: 38/40 (missing 2 examples)
• Structure: 30/30 ✓
• Standards: 20/20 ✓
• Best Practices: 4/10 (consider adding versioning)
```

## Iteration Guidelines

### Maximum Iterations
- Attempt up to 3 iterations automatically
- Each iteration should show progress
- After 3 iterations without reaching 85/100, ask questions

### Show Progress
```
Iteration 1: 68/100 → Adding descriptions
Iteration 2: 78/100 → Adding examples
Iteration 3: 84/100 → Adding error responses
Still below threshold, asking for clarification...
```

### Clarifying Questions
When stuck, ask specific questions:
- "Should /users endpoint support filtering by email?"
- "What HTTP status codes should POST /users return on validation errors?"
- "Should the API be versioned? (e.g., /v1/users)"
- "Do you want pagination on all list endpoints?"

## Bidirectional Editor Sync

### Chat → Editor
- Agent generates/modifies spec
- Shows diff for approval
- Updates editor after user approves

### Editor → Chat
- User manually edits spec in editor
- Chat detects changes
- Add system message: "[User manually edited spec]"
- Future modifications work from edited version

### Example Flow
```
Agent: [Generates initial spec] → Editor updated

User: [Manually adds a new endpoint in editor]

Agent: [Sees editor change]
       "I see you added POST /users/login. Would you like me to:
        [1] Add authentication to this endpoint
        [2] Generate matching schema
        [3] Add error responses
        [4] Nothing, it looks good"
```

## Error Handling

### Validation Errors
```
Agent: ⚠️ Validation failed:
• paths./users.get.responses.200: Missing content
• components.schemas.User: Invalid type definition

Attempting auto-fix...
```

### AI Provider Errors
```
Agent: ⚠️ AI service temporarily unavailable
Retrying in 3 seconds... (attempt 2/3)
```

### User Input Errors
```
User: "Add pagination"

Agent: ⚠️ I need more context. Which endpoint should have pagination?
Current endpoints:
[1] GET /users
[2] GET /posts
[3] GET /comments
[4] All list endpoints
```

## Conversation Examples

### Example 1: Complete Flow
```
User: Create a blog API

Agent: 🤔 Analyzing...
• Detected: REST CRUD
• Auto-selected: rest-crud template

Should I add:
[✓] Pagination?
[✓] Error handling?
[ ] Authentication?

User: Yes to all, JWT auth

Agent: ⚙️ Generating spec...
Agent: ✓ Validating...
Agent: ⚠️ Quality: 72/100 - Improving...
Agent: ✓ Quality: 91/100
Created spec with 8 endpoints, 3 schemas

[Editor shows final spec]

User: Add comments to posts

Agent: 🔍 Analyzing changes...
Agent: ⚙️ Adding Comment schema and endpoints...

[Shows diff]

Apply changes?
[✓ Apply] [✗ Cancel]

User: Apply

Agent: ✓ Updated
Added Comment schema and 4 new endpoints
```

### Example 2: Clarification Needed
```
User: Build an API for managing products

Agent: 🤔 Analyzing...
Detected: E-commerce domain

I need more details:
1. What operations do you need?
   [✓] List products
   [✓] Get product details
   [✓] Create product
   [✓] Update product
   [✓] Delete product
   [ ] Search products
   [ ] Filter by category

2. Should products have:
   [✓] Prices?
   [✓] Inventory tracking?
   [ ] Variants (size, color)?
   [ ] Categories?

User: Yes to all

Agent: ⚙️ Generating comprehensive product API...
```

## Success Criteria

The chat agent is successful when:
- Users can describe APIs in natural language and get valid specs
- Users understand what's happening at each step
- Users can modify specs conversationally without touching YAML
- Quality scores meet thresholds (85+)
- Diffs are clear and changes require approval
- Clarifying questions resolve ambiguity
- Context is maintained across conversation
