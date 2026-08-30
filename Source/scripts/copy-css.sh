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

mkdir -p dist/esm dist/esm/schemas

cp schemas/ui-adapter.schema.json dist/esm/schemas/ui-adapter.schema.json
cp schemas/ui-adapter.schema.d.ts dist/esm/schemas/ui-adapter.schema.d.ts
echo "Copied ui-adapter.schema.json and its declaration"

for stylesheet in tokens.css theme.css; do
    cp "$stylesheet" "dist/esm/$stylesheet"
    echo "Copied $stylesheet"
done

# Font files a component's own CSS reaches via a relative `url(...)` (e.g. Canvas's Note face) - the
# `bundle-styles` plugin concatenates component stylesheets into dist/esm/styles.css verbatim, with no
# url() rewriting, so a relative reference only keeps resolving once the asset sits next to that file
# at the same relative depth. Copied flat (basename only) because styles.css itself is flat in dist/esm;
# every component's font `url()` is a bare `./file.ext` for the same reason. Collisions across
# components would need a rethink (a subfolder plus matching url() rewrite), but nothing ships one yet.
# `find`, not a bash 4+ `globstar` glob, because macOS ships bash 3.2 as `/bin/bash`.
find . -path ./dist -prune -o -path ./node_modules -prune -o \
    -path ./storybook-static -prune -o \
    \( -iname '*.woff2' -o -iname '*.woff' -o -iname '*.ttf' -o -iname '*.otf' \) -print |
    while IFS= read -r font; do
        cp "$font" "dist/esm/$(basename "$font")"
        echo "Copied $(basename "$font")"
    done

# Patrick Hand is distributed under the SIL Open Font License. Keep its notice beside the
# packaged font binaries so every redistributed archive carries the required license text.
cp Canvas/shapes/Note/PatrickHand-OFL.txt dist/esm/PatrickHand-OFL.txt
echo "Copied PatrickHand-OFL.txt"

echo "Stylesheet layers copied successfully"
