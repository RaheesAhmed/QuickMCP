# Changelog

All notable changes to QuickMCP SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2025-01-16

### Fixed
- **Type Compatibility**: Fixed TypeScript type issues in prompt handler registration
  - Added proper type definitions to `PromptResponse` interface
  - Added index signature `[key: string]: unknown` for MCP SDK compatibility
  - Removed unsafe `as any` type casting
- **Build System**: Verified TypeScript compilation works without errors
- **Type Safety**: Improved type safety across the codebase

### Added
- **Remote HTTP Server Example** (`examples/06-remote-http-server/`)
  - Complete production-ready HTTP MCP server implementation
  - Modern Streamable HTTP transport (latest MCP protocol)
  - Session management for stateful connections
  - CORS enabled for browser and web client access
  - Support for multiple concurrent clients
  - Real-time SSE notifications for server-to-client events
  - Comprehensive test client included
  - Full documentation with curl examples and usage guides

#### New Tools in HTTP Server Example
- `get_server_info` - Get server information and capabilities
- `echo` - Echo service with optional repetition (great for testing)
- `calculate` - Perform arithmetic operations (add, subtract, multiply, divide)
- `get_timestamp` - Get current server time in various formats (ISO, Unix, locale)

#### New Resources in HTTP Server Example
- `status://server` - Real-time server metrics and status
- `docs://api` - Complete API documentation

#### New Prompts in HTTP Server Example
- `generate_greeting` - Multi-style greeting generator (formal, casual, friendly)

### Changed
- **Documentation**: Updated README.md with new HTTP server example
- **Documentation**: Updated llm.md with comprehensive fix documentation and new example
- **Documentation**: Added complete HTTP transport documentation

## [1.0.5] - 2024-12-XX

### Added
- Initial release features
- STDIO and HTTP transport support
- Tools, Resources, and Prompts implementation
- Schema validation with caching
- Response helpers and utilities
- Example servers (calculator, weather, enterprise API, filesystem)

### Performance
- 90% faster schema validation through LRU caching
- 60% less memory usage via object pooling
- High-performance request handling

### Enterprise Features
- JWT authentication middleware
- Rate limiting
- Metrics collection
- Session management for HTTP transport

## [1.0.0] - 2024-11-XX

### Added
- Initial public release
- Core MCP server implementation
- Basic tools and resources support
- TypeScript SDK with simplified API
- STDIO transport support
- Documentation and examples

---

## Release Notes

### v1.0.6 Highlights

This release focuses on stability improvements and adds a comprehensive remote HTTP server example that demonstrates production-ready MCP server deployment.

**Key Improvements:**
- ✅ Clean TypeScript compilation with no type errors
- ✅ Full MCP SDK compatibility
- ✅ Production-ready HTTP server example
- ✅ Complete testing infrastructure
- ✅ Enhanced documentation

**Migration Guide:**
No breaking changes. Simply update to the latest version:
```bash
npm install quickmcp-sdk@latest
```

**What's Next:**
- Additional middleware options
- More example servers
- Performance optimizations
- Enhanced testing utilities

---

For more details on each release, see the [GitHub Releases](https://github.com/RaheesAhmed/QuickMCP/releases) page.
