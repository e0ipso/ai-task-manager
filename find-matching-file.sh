#!/bin/bash

# Find files matching glob pattern plan-[0-9][0-9]*--*.md
# Then check which ones contain the regex "^id: ?01$"

find . -name "plan-[0-9][0-9]*--*.md" -type f | while read -r file; do
    if grep -q "^id: \?01$" "$file"; then
        echo "$file"
    fi
done