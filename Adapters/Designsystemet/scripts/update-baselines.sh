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
# Pinned by digest; keep in step with the container image in .github/workflows/javascript-build.yml.
image="mcr.microsoft.com/playwright:v1.63.0-noble@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27"
if [ "$version" != "1.63.0" ]; then
    echo "Locked Playwright is $version but the pinned image is 1.63.0; update the image digest here and in the workflow." >&2
    exit 1
fi
port="${CRATIS_PLAYWRIGHT_PORT:-3917}"
name="cratis-ds-playwright-$$"

docker run --rm -d --name "$name" --ipc=host -p "127.0.0.1:${port}:${port}" "$image" \
    npx -y "playwright@${version}" run-server --port "$port" --host 0.0.0.0 >/dev/null
trap 'docker rm -f "$name" >/dev/null 2>&1 || true' EXIT

# Wait until the server reports it is listening (npx may need to fetch the package first).
for _ in $(seq 1 90); do
    if docker logs "$name" 2>&1 | grep -q "Listening on"; then break; fi
    sleep 2
done

CRATIS_PLAYWRIGHT_WS="ws://127.0.0.1:${port}/" \
    yarn workspace @cratis/components.storybook test-designsystemet "$@"
