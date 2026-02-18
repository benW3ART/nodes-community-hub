# Memory Add

Manually add an event to memory.

## Usage
/memory-add decision "Use PostgreSQL for the database" "Better for complex queries"

## Types
- decision, error, pattern, milestone, conversation

## What it does
Calls scripts/memory-capture.sh with the provided type and content.
