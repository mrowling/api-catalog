# PRD: Natural Language OpenAPI Editor

## Introduction

A powerful OpenAPI specification editor that bridges the gap between natural language and structured API definitions. This tool combines the familiar Swagger Editor interface with GitHub Copilot's AI capabilities, allowing users to describe APIs in plain English and automatically generate valid OpenAPI 3.1 specifications.

**Key Innovation:** Instead of manually writing YAML/JSON OpenAPI specs, users describe their API using natural language, and the system generates, validates, and presents the specification with interactive diff previews for modifications.

## Goals

- Enable API design through natural language descriptions
- Provide real-time validation of generated OpenAPI specifications
- Support both OpenAPI 3.0 and 3.1 (with automatic 3.0→3.1 conversion)
- Deliver an intuitive web-based editing experience with visual diff previews
- Offer a CLI tool for automation and CI/CD integration
- Maintain full compatibility with standard OpenAPI/Swagger tooling

## User Stories

### US-001: Generate OpenAPI spec from natural language description
**Description:** As an API designer, I want to describe my API in plain English so that the system generates a complete OpenAPI 3.1 specification without manual YAML editing.

**Acceptance Criteria:**
- [ ] User can input natural language description via text area
- [ ] System sends description to GitHub Copilot SDK for processing
- [ ] Generated spec is automatically converted to OpenAPI 3.1 format
- [ ] Generated spec displays in Swagger Editor viewer
- [ ] Generated spec is valid and passes swagger-parser validation
- [ ] Typecheck/lint passes
- [ ] Verify in browser using playwright-ralph

### US-002: Validate OpenAPI specification via API endpoint
**Description:** As a developer, I want to validate my OpenAPI spec programmatically so that I can ensure compliance before deployment.

**Acceptance Criteria:**
- [ ] POST /api/validate endpoint accepts OpenAPI spec (JSON/YAML)
- [ ] Endpoint uses swagger-parser for validation
- [ ] Returns detailed validation errors with line numbers and paths
- [ ] Returns success response with parsed spec details
- [ ] Supports both OpenAPI 3.0 and 3.1 input formats
- [ ] Typecheck passes
- [ ] Unit tests pass

### US-003: Modify existing spec using natural language
**Description:** As an API designer, I want to request changes to my existing API using natural language so that I don't need to manually edit the YAML/JSON.

**Acceptance Criteria:**
- [ ] User can input modification request in natural language
- [ ] System generates proposed changes using Copilot SDK
- [ ] Interactive diff viewer shows changes (added/removed/modified)
- [ ] User can accept or reject the proposed changes
- [ ] Changes are applied only after user confirmation
- [ ] Typecheck passes
- [ ] Verify in browser using playwright-ralph

### US-004: View generated spec in Swagger Editor
**Description:** As an API designer, I want to see my spec rendered in a familiar Swagger Editor interface so that I can review the documentation and test endpoints.

**Acceptance Criteria:**
- [ ] Integrate swagger-editor or swagger-ui-react component
- [ ] Display generated spec in editor pane
- [ ] Show live documentation preview in viewer pane
- [ ] Support editing YAML directly as fallback
- [ ] Display validation errors inline
- [ ] Typecheck passes
- [ ] Verify in browser using playwright-ralph

### US-005: Export and import OpenAPI specifications
**Description:** As a developer, I want to export my spec to a file or import an existing spec so that I can work with standard OpenAPI files.

**Acceptance Criteria:**
- [ ] Export button downloads spec as YAML or JSON file
- [ ] Import button accepts file upload (YAML/JSON)
- [ ] Drag-and-drop file upload support
- [ ] Clipboard paste support for spec content
- [ ] Preserve formatting and comments where possible
- [ ] Typecheck passes
- [ ] Verify in browser using playwright-ralph

### US-006: Convert OpenAPI 3.0 to 3.1 automatically
**Description:** As a developer, I want my OpenAPI 3.0 specs automatically upgraded to 3.1 so that I can use the latest specification features.

**Acceptance Criteria:**
- [ ] Detect OpenAPI version on import/validation
- [ ] Automatically convert 3.0 specs to 3.1 format
- [ ] Handle schema changes (nullable, exclusiveMinimum/Maximum, etc.)
- [ ] Preserve all API definitions during conversion
- [ ] Show conversion status to user
- [ ] Typecheck passes
- [ ] Unit tests for conversion logic

### US-007: CLI tool for natural language to OpenAPI generation
**Description:** As a developer, I want a command-line tool to generate specs from natural language so that I can integrate it into my workflow and CI/CD pipelines.

**Acceptance Criteria:**
- [ ] CLI accepts natural language description via argument or file
- [ ] CLI accepts existing spec file for modification mode
- [ ] Output generated spec to stdout or file
- [ ] Include validation option (--validate flag)
- [ ] Support interactive mode for refinement
- [ ] Exit with appropriate error codes
- [ ] Typecheck passes
- [ ] Integration tests pass

### US-008: Web UI runs locally with backend
**Description:** As a user, I want to run the complete application locally so that I can work offline and keep my API designs private.

**Acceptance Criteria:**
- [ ] Single command starts both frontend and backend (bun dev)
- [ ] Backend runs on configurable port (default 3001)
- [ ] Frontend proxies API requests to backend
- [ ] Clear startup instructions in README
- [ ] Environment configuration for Copilot SDK credentials
- [ ] Typecheck passes
- [ ] Verify full stack runs locally

## Functional Requirements

### Core Generation
- **FR-1:** System must accept natural language API descriptions via web UI and CLI
- **FR-2:** System must use GitHub Copilot SDK to generate OpenAPI 3.1 specifications
- **FR-3:** Generated specs must include all required OpenAPI 3.1 fields (openapi, info, paths)
- **FR-4:** System must intelligently infer HTTP methods, parameters, request/response schemas from descriptions
- **FR-5:** System must handle iterative refinement through follow-up natural language requests

### Validation
- **FR-6:** POST /api/validate endpoint must accept JSON and YAML payloads
- **FR-7:** Validation must use swagger-parser library for semantic validation
- **FR-8:** Validation errors must include: message, path, line number (if available), severity level
- **FR-9:** Validation must check for both structural and semantic OpenAPI compliance
- **FR-10:** Validation endpoint must respond within 2 seconds for specs up to 10,000 lines

### Modification & Diff
- **FR-11:** Natural language modification requests must consider existing spec context
- **FR-12:** System must generate unified diff format showing proposed changes
- **FR-13:** Diff viewer must highlight additions (green), removals (red), and modifications (yellow)
- **FR-14:** User must explicitly approve changes before application
- **FR-15:** System must support "undo" for last applied modification

### Version Conversion
- **FR-16:** System must detect OpenAPI version from "openapi" field in spec
- **FR-17:** 3.0→3.1 conversion must handle: `nullable` → `type: 'null'`, `exclusiveMinimum/Maximum` boolean → numeric, `example` → `examples`
- **FR-18:** Conversion must preserve all vendor extensions (x-* fields)
- **FR-19:** Conversion must maintain JSON Schema compatibility where possible
- **FR-20:** Webhooks and license changes between 3.0 and 3.1 must be properly mapped

### Web UI
- **FR-21:** UI must have two-pane layout: editor (left) and documentation preview (right)
- **FR-22:** Natural language input must be prominent with clear call-to-action
- **FR-23:** System status indicators for: validation status, generation status, copilot connection
- **FR-24:** Export must support both YAML and JSON formats
- **FR-25:** Import must accept .yaml, .yml, and .json file extensions

### CLI
- **FR-26:** CLI must support commands: `generate`, `validate`, `convert`
- **FR-27:** CLI must read from stdin or file (-f/--file flag)
- **FR-28:** CLI must output to stdout (default) or file (-o/--output flag)
- **FR-29:** CLI must support --format flag (yaml|json) for output format
- **FR-30:** CLI must return exit code 0 on success, 1 on validation error, 2 on system error

## Non-Goals (Out of Scope)

- No cloud hosting or multi-user collaboration features
- No user authentication or API key management (uses user's Copilot credentials)
- No automatic API testing or mock server generation
- No integration with external API management platforms (Apigee, AWS API Gateway, etc.)
- No support for OpenAPI 2.0 (Swagger) generation from natural language
- No natural language generation from existing OpenAPI specs (reverse direction)
- No mobile app or mobile-optimized UI (desktop web only)
- No real-time collaborative editing (single user only)
- No built-in version control or spec history (user manages with git)

## Design Considerations

### UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo, Validation Status, Export/Import Buttons    │
├──────────────────┬──────────────────────────────────────────┤
│                  │                                         │
│  Natural Lang    │                                         │
│  Input Area      │     Swagger Editor / Preview           │
│  + Submit        │     (YAML + Documentation View)        │
│                  │                                         │
│  ────────────────┤                                         │
│                  │                                         │
│  Diff Preview    │                                         │
│  (when modifying)│                                         │
│                  │                                         │
└──────────────────┴──────────────────────────────────────────┘
```

### Color Scheme
- Follow system preferences (light/dark mode)
- Use Tailwind CSS default palette
- Diff colors: additions (green-500), deletions (red-500), modifications (yellow-500)
- Status indicators: valid (green), warning (yellow), error (red), processing (blue)

### Component Library
- Use existing project dependencies where possible
- Consider: @monaco-editor/react for YAML editing
- Consider: swagger-ui-react for documentation preview
- Consider: react-diff-viewer for diff display
- Icons: Lucide React (lightweight)

## Technical Considerations

### Architecture
```
┌─────────────┐      HTTP/WebSocket       ┌──────────────┐
│   Web UI    │ ◄───────────────────────► │   Backend    │
│  (Vite/React)│                            │  (Bun/Hono)  │
└─────────────┘                            └──────────────┘
                                                  │
                                                  ▼
                                         ┌──────────────┐
                                         │ GitHub Copilot│
                                         │    SDK       │
                                         └──────────────┘
```

### Backend Stack
- **Runtime:** Bun (for performance and built-in TypeScript)
- **Framework:** Hono (lightweight, fast, TypeScript-native)
- **Validation:** swagger-parser + @apidevtools/swagger-parser
- **Conversion:** @apidevtools/swagger-parser (built-in version conversion)
- **AI:** @github/copilot-sdk
- **CORS:** Enable for local development (localhost:3000 ↔ localhost:3001)

### Frontend Stack
- **Framework:** React 19 (already configured)
- **Build Tool:** Vite (already configured)
- **Styling:** Tailwind CSS (add if not present)
- **State Management:** React Context + useReducer (local state)
- **HTTP Client:** Native fetch API
- **YAML Processing:** js-yaml

### GitHub Copilot SDK Integration
- Use `@github/copilot-sdk` package
- Implement streaming responses for real-time generation feedback
- Handle rate limiting gracefully with exponential backoff
- Cache responses to reduce API calls for similar prompts
- Support both synchronous and streaming generation modes

### File Structure
```
├── apps/
│   ├── web/                    # Vite + React frontend
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── services/       # API calls
│   │   │   └── stores/         # State management
│   │   └── package.json
│   │
│   └── cli/                    # CLI tool
│       ├── src/
│       │   ├── commands/       # CLI command implementations
│       │   ├── services/       # Shared services
│       │   └── index.ts        # Entry point
│       └── package.json
│
├── packages/
│   ├── backend/                # Shared backend code
│   │   ├── src/
│   │   │   ├── routes/         # API routes
│   │   │   ├── services/       # Business logic
│   │   │   │   ├── copilot.ts  # Copilot SDK wrapper
│   │   │   │   ├── validator.ts # Validation service
│   │   │   │   └── converter.ts # Version conversion
│   │   │   └── index.ts        # Server entry
│   │   └── package.json
│   │
│   └── shared/                 # Shared types and utilities
│       ├── src/
│       │   ├── types/          # TypeScript interfaces
│       │   └── utils/          # Shared utilities
│       └── package.json
│
├── package.json                # Root workspace config
└── turbo.json                  # Build orchestration
```

## Success Metrics

- **Generation Quality:** 90% of generated specs pass validation without manual fixes
- **Performance:** Natural language → generated spec in under 10 seconds
- **User Workflow:** Generate, validate, and export an API spec in under 2 minutes
- **Conversion Accuracy:** 100% of valid OpenAPI 3.0 specs convert to valid 3.1 specs
- **CLI Adoption:** Users can integrate CLI into CI/CD with single command
- **Error Clarity:** Validation errors explain issue and suggest fix in plain language

## Open Questions

1. Should we implement real-time streaming of Copilot SDK responses or batch mode only?
2. How should we handle GitHub Copilot SDK authentication? (Personal access token, OAuth, or device flow?)
3. Should we implement a "suggestion mode" where Copilot suggests improvements to existing specs?
4. What's the rate limiting strategy for Copilot SDK to avoid hitting API limits?
5. Should we support custom prompts/templates for different API styles (RESTful, GraphQL-like, RPC)?

## Dependencies to Add

### Backend
- `@github/copilot-sdk` - GitHub Copilot SDK
- `swagger-parser` - OpenAPI validation
- `hono` - Web framework
- `@hono/node-server` - Bun-compatible server
- `js-yaml` - YAML processing
- `zod` - Schema validation

### Frontend  
- `swagger-ui-react` - Swagger documentation viewer
- `@monaco-editor/react` - Code editor
- `react-diff-viewer` - Diff display
- `js-yaml` - YAML processing
- `lucide-react` - Icons
- `tailwindcss` - Styling (if not present)

### CLI
- `commander` - CLI framework
- `chalk` - Terminal colors
- `ora` - Loading spinners
- `inquirer` - Interactive prompts

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Set up monorepo structure with Bun workspaces
- Create backend API with validation endpoint
- Integrate GitHub Copilot SDK
- Add OpenAPI 3.0→3.1 conversion

### Phase 2: Web UI Core (Week 2)
- Build React components for natural language input
- Integrate Swagger Editor/Viewer
- Connect frontend to backend API
- Implement spec generation flow

### Phase 3: Advanced Features (Week 3)
- Implement diff preview for modifications
- Add import/export functionality
- Implement undo/redo functionality
- Add error handling and status indicators

### Phase 4: CLI Tool (Week 4)
- Build CLI with commander.js
- Implement generate, validate, convert commands
- Add interactive mode
- Write integration tests

### Phase 5: Polish & Documentation (Week 5)
- Add comprehensive error messages
- Create user documentation
- Add example prompts and workflows
- Performance optimization

## Notes

- Always validate specs before displaying to user
- Show loading states during Copilot SDK calls
- Cache validation results to avoid re-validation
- Use streaming for Copilot responses when possible for better UX
- Implement proper error boundaries in React
- Consider adding telemetry (opt-in) to understand usage patterns
