# Development Rules for AI Agents

## First Message Protocol
- If task is unclear, read README.md and ask which component: web, cli, api, or spec templates
- For spec work, read `.openapi-templates/README.md` and relevant template docs
- For chat-related work, read `.ai/CHAT_PROTOCOL.md`

## OpenAPI Spec Rules

### Strict Requirements
- **All specs MUST be OpenAPI 3.1.x** - No 3.0, no Swagger 2.0
- **Always validate** before and after modifications: `pnpm cli validate <file>`
- **Preserve structure** - Maintain existing formatting, component organization
- **Use $ref** - Prefer references over inline schemas for reusability

### Naming Conventions
- **PascalCase** for schema names: `User`, `BlogPost`, `OrderItem`
- **camelCase** for properties: `firstName`, `blogPosts`, `createdAt`
- **kebab-case** for operation IDs: `get-users`, `create-blog-post`, `update-order`

### Required Sections
Every OpenAPI spec must include:
- `openapi: 3.1.x`
- `info` with title, version, description
- `paths` with at least one endpoint
- `components/schemas` for reusable schemas

## Modification Workflow

When modifying OpenAPI specs:

1. **Read current spec** (if modifying existing)
2. **Validate current state**: `pnpm cli validate spec.yaml`
3. **Apply modifications** (preserve formatting, structure)
4. **Validate changes**: `pnpm cli validate spec.yaml`
5. **Review diff**: `git diff spec.yaml`

## Quality Criteria

Before presenting a spec to users, ensure:
- [ ] Valid OpenAPI 3.1.x (passes validation)
- [ ] All operations have summaries and descriptions
- [ ] Error responses defined (at minimum: 400, 500)
- [ ] Request/response examples provided
- [ ] Consistent naming conventions applied
- [ ] Security schemes defined if authentication needed
- [ ] Reusable schemas in components section
- [ ] Quality score ≥ 85/100

## Commands

### After Code Changes
- Run typecheck: `pnpm typecheck`
- Run linting: `pnpm lint`
- Run tests: `pnpm test` (skip if only updating specs)

### Spec Operations
- Validate: `pnpm cli validate <file>`
- Generate: `pnpm cli generate "<description>" -o <file>`
- List templates: `pnpm cli templates list`

### Development
- NEVER commit unless user explicitly asks
- NEVER run `npm run dev` or `pnpm dev` without user request

## Tool Usage

### Preferred Tools
- **Read files**: Use Read tool, not `cat`/`head`/`tail`
- **Edit files**: Use Edit tool, not `sed`/`awk`
- **Search code**: Use Grep tool, not `grep` command
- **Find files**: Use Glob tool, not `find` command

### Git Safety
- NEVER use `git add .` or `git add -A`
- ALWAYS add specific files: `git add path/to/file.ts`
- NEVER use `git reset --hard` or `git clean -fd`
- Check `git status` before committing

## Style

### Communication
- No emojis in commits, code, or technical documentation
- Concise and direct communication
- Technical accuracy over validation
- Short answers, no fluff

### Code Quality
- No `any` types unless absolutely necessary
- Check node_modules for external API type definitions
- NEVER use inline imports: no `await import()`, no `import("pkg").Type`
- Always use standard top-level imports

## Chat Agent Behavior

When working on the chat-driven spec generation:

### Interaction Style
- Show detailed step-by-step progress
- Ask clarifying questions when ambiguous
- Display quality scores and iteration counts
- Maintain conversation context across messages

### Template Selection
- Auto-detect domain from user description
- Inform user which template was selected
- Allow override if user specifies different template

### Pattern Suggestions
- Explicitly ask before adding patterns:
  - "Should I add pagination?"
  - "What authentication type? [Bearer/API Key/OAuth2]"
- Show what was added: "Added RFC 7807 error handling"

### Modification Flow
1. User requests change in chat
2. Agent analyzes current spec from editor
3. Generate modification
4. Show diff in chat
5. Wait for approval [Apply/Cancel/Refine]
6. If approved, update editor

### Quality Thresholds
- Target: 85/100 minimum quality score
- Iterate up to 3 times to reach threshold
- If still failing, ask clarifying questions

## Testing

### When to Run Tests
- After implementing new features
- After modifying core logic
- Before creating commits (if user asks)

### Test Commands
- All tests: `pnpm test`
- Watch mode: `pnpm test:watch`
- Coverage: `pnpm test:coverage`
- Specific test: `cd <package> && pnpm test <file>`

## Project Structure

```
ai-open-api-spec/
├── apps/
│   ├── web/              # React frontend with chat UI
│   ├── cli/              # Command-line tool
│   └── api/              # Hono backend (in packages/backend)
├── packages/
│   ├── backend/          # API server with generation/validation
│   └── shared/           # Shared utilities and cache
├── .openapi-templates/   # Template library for agents
├── .ai/                  # Agent context and protocols
└── docs/                 # Documentation
```

## Common Patterns

### Reading Project Context
On first message, if working on:
- **Templates**: Read `.openapi-templates/README.md`
- **Chat features**: Read `.ai/CHAT_PROTOCOL.md`
- **API changes**: Read `packages/backend/README.md`
- **CLI changes**: Read `apps/cli/README.md`

### Implementing New Features
1. Read relevant context files
2. Understand existing patterns
3. Implement changes
4. Run validation/tests
5. Ask user before committing

## Error Handling

### Validation Errors
- Parse validation errors clearly
- Attempt auto-fix for common issues
- Ask user for clarification on ambiguous errors
- Never present invalid specs to users

### API Errors
- Handle rate limits gracefully
- Retry with exponential backoff
- Fall back to simpler generation if complex fails

### User Errors
- Provide helpful error messages
- Suggest corrections
- Show examples of correct usage
