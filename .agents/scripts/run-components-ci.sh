#!/usr/bin/env bash
# Copyright (c) Cratis. All rights reserved.
# Licensed under the MIT license. See LICENSE file in the project root for full license information.

# Recreate node_modules from the committed lockfile before running public workspace CI.
# Storybook is private and therefore skipped by the workspace runner, so its preflight is explicit.
set -euo pipefail

root="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)"
cd "$root"

yarn install --immutable
yarn ci
yarn workspace @cratis/components.storybook ci:preflight
