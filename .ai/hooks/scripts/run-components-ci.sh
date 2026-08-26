#!/usr/bin/env bash
# Copyright (c) Cratis. All rights reserved.
# Licensed under the MIT license. See LICENSE file in the project root for full license information.

# The repository intentionally ignores yarn.lock. Recreate the local resolution and
# node_modules state before running workspace CI so the stop hook also works in a
# fresh clone or after generated-artifact cleanup.
set -euo pipefail

root="$(git -C "$(dirname "${BASH_SOURCE[0]}")" rev-parse --show-toplevel)"
cd "$root"

yarn install
yarn ci
