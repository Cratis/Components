#!/bin/bash
# Copyright (c) Cratis. All rights reserved.
# Licensed under the MIT license. See LICENSE file in the project root for full license information.

# Find all CSS files (excluding node_modules, dist, and .storybook)
# and copy them to both dist/esm and dist/cjs directories

find . -name '*.css' \
  -not -path './node_modules/*' \
  -not -path './dist/*' \
  -not -path './.storybook/*' | while read -r file; do
  
  # Remove the leading './'
  relative_path="${file#./}"
  
  # Create directory structure and copy file to both output directories
  mkdir -p "dist/esm/$(dirname "$relative_path")"
  mkdir -p "dist/cjs/$(dirname "$relative_path")"
  
  cp "$file" "dist/esm/$relative_path"
  cp "$file" "dist/cjs/$relative_path"
  
  echo "Copied $relative_path"
done

echo "CSS files copied successfully"
