#!/bin/bash
# Copyright (c) Cratis. All rights reserved.
# Licensed under the MIT license. See LICENSE file in the project root for full license information.

# Ships the standalone stylesheet layers that have their own package export.
#
# Component CSS is NOT copied here any more. It is concatenated into dist/esm/styles.css by the
# `bundle-styles` Rollup plugin, because a `.css` file sitting in the JavaScript module graph is
# what made every published subpath unloadable in Node (Cratis/Components#118). Copying the
# individual files alongside the JS would only invite that import back.

set -euo pipefail

mkdir -p dist/esm

for stylesheet in tokens.css theme.css; do
    cp "$stylesheet" "dist/esm/$stylesheet"
    echo "Copied $stylesheet"
done

echo "Stylesheet layers copied successfully"
