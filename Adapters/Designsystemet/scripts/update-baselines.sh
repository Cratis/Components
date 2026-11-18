#!/usr/bin/env bash
# Copyright (c) Cratis. All rights reserved.
# Licensed under the MIT license. See LICENSE file in the project root for full license information.
#
# Regenerates the Linux Chromium visual baselines for the Designsystemet browser checks
# (Cratis/Components#534). Chromium runs inside the same pinned Playwright image CI uses, driven
# remotely by the host's Vitest; the host's loopback is exposed to it so the page is served from the host. Requires Docker.
#
#   Adapters/Designsystemet/scripts/update-baselines.sh          # compare only
#   Adapters/Designsystemet/scripts/update-baselines.sh --update # write new baselines
set -euo pipefail

version="$(node -p "require('playwright/package.json').version")"
image="mcr.microsoft.com/playwright:v${version}-noble"
port="${CRATIS_PLAYWRIGHT_PORT:-3917}"
name="cratis-ds-playwright-$$"

docker run --rm -d --name "$name" --ipc=host -p "${port}:${port}" "$image" \
    npx -y "playwright@${version}" run-server --port "$port" --host 0.0.0.0 >/dev/null
trap 'docker rm -f "$name" >/dev/null 2>&1 || true' EXIT

# Wait until the server reports it is listening (npx may need to fetch the package first).
for _ in $(seq 1 90); do
    if docker logs "$name" 2>&1 | grep -q "Listening on"; then break; fi
    sleep 2
done

CRATIS_PLAYWRIGHT_WS="ws://127.0.0.1:${port}/" \
    yarn workspace @cratis/components.storybook test-designsystemet "$@"
