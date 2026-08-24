#!/bin/bash
# Copyright (c) Cratis. All rights reserved.
# Licensed under the MIT license. See LICENSE file in the project root for full license information.

# Runs Markdown linting and deterministic, repository-local link verification.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=========================================="
echo "Markdown Verification"
echo "=========================================="
echo ""

# Always resolve from this script rather than trusting an inherited/symlinked PWD.
cd "$ROOT_DIR"
echo "Working directory: $(pwd -P)"
echo ""

# Step 1: Markdown Linting
echo "=========================================="
echo "Step 1: Running markdownlint..."
echo "=========================================="
echo ""

if ! command -v npx >/dev/null 2>&1; then
    echo "Error: npx is not installed. Please install Node.js and npm."
    exit 1
fi

npx markdownlint-cli2 "Documentation/**/*.md"
LINT_EXIT_CODE=$?

echo ""
if [ $LINT_EXIT_CODE -eq 0 ]; then
    echo "✓ Markdown linting passed!"
else
    echo "✗ Markdown linting failed with exit code $LINT_EXIT_CODE"
fi
echo ""

# Step 2: Link Verification
echo "=========================================="
echo "Step 2: Running local link verification..."
echo "=========================================="
echo ""

if ! command -v node >/dev/null 2>&1; then
    echo "Error: node is not installed. Please install Node.js."
    exit 1
fi

node "$SCRIPT_DIR/verify-local-links.mjs" "$SCRIPT_DIR"
LINK_EXIT_CODE=$?

echo ""
if [ $LINK_EXIT_CODE -eq 0 ]; then
    echo "✓ Link verification passed!"
else
    echo "✗ Link verification failed with exit code $LINK_EXIT_CODE"
fi
echo ""

# Final summary
echo "=========================================="
echo "Summary"
echo "=========================================="
if [ $LINT_EXIT_CODE -eq 0 ] && [ $LINK_EXIT_CODE -eq 0 ]; then
    echo "✓ All checks passed!"
    exit 0
else
    echo "✗ Some checks failed:"
    [ $LINT_EXIT_CODE -ne 0 ] && echo "  - Markdown linting"
    [ $LINK_EXIT_CODE -ne 0 ] && echo "  - Link verification"
    exit 1
fi
