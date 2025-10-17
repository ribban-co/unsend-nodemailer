# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Nodemailer transport package that enables sending emails through the Usesend API. The package wraps the Usesend SDK to provide a Nodemailer-compatible interface.

## Architecture

### Core Components

- **src/transport.ts**: The `UsesendTransport` class implements Nodemailer's `Transport` interface. Key responsibilities:
  - Validates required fields (from, to, subject) and email address formats before sending
  - Converts Nodemailer address formats (string | Address | Array<string | Address>) to Usesend's string array format via `toUsesendAddresses()`
  - Wraps the Usesend SDK (`usesend.emails.send()`) with enhanced error handling
  - Provides detailed error messages with context-aware hints based on HTTP status codes
  - Uses factory pattern via `makeTransport()` static method for initialization

- **src/types/transport.ts**: Defines `UsesendTransporterOptions` interface with required `apiKey` and optional `apiUrl`

- **src/main.ts**: Package entry point that exports `UsesendTransport` class and types

### Error Handling Strategy

The transport implements defensive validation and enhanced error reporting:
1. Pre-flight validation of required fields and email formats
2. Usesend API errors are enriched with helpful debugging hints based on status codes (400, 401, 403, 429, 5xx)
3. Network/generic errors wrapped with troubleshooting suggestions

## Development Commands

### Build
```bash
npm run build
```
Builds the package using tsup (outputs ESM + CJS to `dist/`)

### Watch Mode
```bash
npm run dev
```
Runs tsup in watch mode for development

## Build Configuration

- **tsup.config.mjs**: Configured to output both ESM and CJS formats with source maps, tree-shaking, and TypeScript declarations
- **Entry point**: src/main.ts
- **Output**: dist/ (main.js, main.mjs, main.d.ts)

## Dependencies

- **Peer dependency**: nodemailer ^6.10.0 (expected to be installed by consumer)
- **Runtime dependency**: usesend ^1.3.0 (the official Usesend SDK)
- Uses package.json version for transport version reporting
