# Nakama Server Modules Build Instructions

## Prerequisites
- Node.js 18+ and npm

## Build Steps

1. Install dependencies:
```bash
npm install
```

2. Compile TypeScript to JavaScript:
```bash
npm run build
```

This will generate the compiled JavaScript files in the `build/` directory.

## Development

To watch for changes and auto-compile:
```bash
npm run watch
```

## Docker Usage

The compiled modules in the `build/` directory will be automatically loaded by Nakama when running via Docker Compose.
