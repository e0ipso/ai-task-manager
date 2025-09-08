#!/bin/bash

# Script: check-task-dependencies.sh
# Purpose: Check if a task has all of its dependencies resolved (completed)
# Usage: ./check-task-dependencies.sh <plan-id> <task-id>
# Returns: 0 if all dependencies are resolved, 1 if not

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "$1"
}

# Check arguments
if [ $# -ne 2 ]; then
    print_error "Invalid number of arguments"
    echo "Usage: $0 <plan-id> <task-id>"
    echo "Example: $0 16 03"
    exit 1
fi

PLAN_ID="$1"
TASK_ID="$2"

# Find the plan directory
PLAN_DIR=$(find .ai/task-manager/{plans,archive} -type d -name "${PLAN_ID}--*" 2>/dev/null | head -1)

if [ -z "$PLAN_DIR" ]; then
    print_error "Plan with ID ${PLAN_ID} not found"
    exit 1
fi

print_info "Found plan directory: ${PLAN_DIR}"

# Construct task file path
# Handle both padded (01, 02) and unpadded (1, 2) task IDs
TASK_FILE=""
if [ -f "${PLAN_DIR}/tasks/${TASK_ID}--"*.md ]; then
    TASK_FILE=$(ls "${PLAN_DIR}/tasks/${TASK_ID}--"*.md 2>/dev/null | head -1)
elif [ -f "${PLAN_DIR}/tasks/0${TASK_ID}--"*.md ]; then
    # Try with zero-padding if direct match fails
    TASK_FILE=$(ls "${PLAN_DIR}/tasks/0${TASK_ID}--"*.md 2>/dev/null | head -1)
fi

if [ -z "$TASK_FILE" ] || [ ! -f "$TASK_FILE" ]; then
    print_error "Task with ID ${TASK_ID} not found in plan ${PLAN_ID}"
    exit 1
fi

print_info "Checking task: $(basename "$TASK_FILE")"
echo ""

# Extract dependencies from task frontmatter
# Using awk to parse YAML frontmatter
DEPENDENCIES=$(awk '
    /^---$/ { if (++delim == 2) exit }
    /^dependencies:/ {
        dep_section = 1
        # Check if dependencies are on the same line
        if (match($0, /\[.*\]/)) {
            gsub(/^dependencies:[ \t]*\[/, "")
            gsub(/\].*$/, "")
            gsub(/[ \t]/, "")
            print
            dep_section = 0
        }
        next
    }
    dep_section && /^[^ ]/ { dep_section = 0 }
    dep_section && /^[ \t]*-/ {
        gsub(/^[ \t]*-[ \t]*/, "")
        gsub(/[ \t]*$/, "")
        print
    }
' "$TASK_FILE" | tr ',' '\n' | sed 's/^[ \t]*//;s/[ \t]*$//' | grep -v '^$')

# Check if there are any dependencies
if [ -z "$DEPENDENCIES" ]; then
    print_success "Task has no dependencies - ready to execute!"
    exit 0
fi

# Display dependencies
print_info "Task dependencies found:"
echo "$DEPENDENCIES" | while read -r dep; do
    echo "  - Task ${dep}"
done
echo ""

# Check each dependency
ALL_RESOLVED=true
UNRESOLVED_DEPS=""
RESOLVED_COUNT=0
TOTAL_DEPS=$(echo "$DEPENDENCIES" | wc -l)

print_info "Checking dependency status..."
echo ""

for DEP_ID in $DEPENDENCIES; do
    # Find dependency task file
    DEP_FILE=""

    # Try exact match first
    if [ -f "${PLAN_DIR}/tasks/${DEP_ID}--"*.md ]; then
        DEP_FILE=$(ls "${PLAN_DIR}/tasks/${DEP_ID}--"*.md 2>/dev/null | head -1)
    elif [ -f "${PLAN_DIR}/tasks/0${DEP_ID}--"*.md ]; then
        # Try with zero-padding
        DEP_FILE=$(ls "${PLAN_DIR}/tasks/0${DEP_ID}--"*.md 2>/dev/null | head -1)
    else
        # Try removing potential zero-padding from DEP_ID
        UNPADDED_DEP=$(echo "$DEP_ID" | sed 's/^0*//')
        if [ -f "${PLAN_DIR}/tasks/${UNPADDED_DEP}--"*.md ]; then
            DEP_FILE=$(ls "${PLAN_DIR}/tasks/${UNPADDED_DEP}--"*.md 2>/dev/null | head -1)
        elif [ -f "${PLAN_DIR}/tasks/0${UNPADDED_DEP}--"*.md ]; then
            DEP_FILE=$(ls "${PLAN_DIR}/tasks/0${UNPADDED_DEP}--"*.md 2>/dev/null | head -1)
        fi
    fi

    if [ -z "$DEP_FILE" ] || [ ! -f "$DEP_FILE" ]; then
        print_error "Dependency task ${DEP_ID} not found"
        ALL_RESOLVED=false
        UNRESOLVED_DEPS="${UNRESOLVED_DEPS}${DEP_ID} (not found)\n"
        continue
    fi

    # Extract status from dependency task
    STATUS=$(awk '
        /^---$/ { if (++delim == 2) exit }
        /^status:/ {
            gsub(/^status:[ \t]*/, "")
            gsub(/^["'\'']/, "")
            gsub(/["'\'']$/, "")
            print
            exit
        }
    ' "$DEP_FILE")

    # Check if status is completed
    if [ "$STATUS" = "completed" ]; then
        print_success "Task ${DEP_ID} - Status: completed ✓"
        ((RESOLVED_COUNT++))
    else
        print_warning "Task ${DEP_ID} - Status: ${STATUS:-unknown} ✗"
        ALL_RESOLVED=false
        UNRESOLVED_DEPS="${UNRESOLVED_DEPS}${DEP_ID} (${STATUS:-unknown})\n"
    fi
done

echo ""
print_info "========================================="
print_info "Dependency Check Summary"
print_info "========================================="
print_info "Total dependencies: ${TOTAL_DEPS}"
print_info "Resolved: ${RESOLVED_COUNT}"
print_info "Unresolved: $((TOTAL_DEPS - RESOLVED_COUNT))"
echo ""

if [ "$ALL_RESOLVED" = true ]; then
    print_success "All dependencies are resolved! Task ${TASK_ID} is ready to execute."
    exit 0
else
    print_error "Task ${TASK_ID} has unresolved dependencies:"
    echo -e "$UNRESOLVED_DEPS"
    print_info "Please complete the dependencies before executing this task."
    exit 1
fi