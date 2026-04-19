#!/usr/bin/env bash
# scripts/generate-playground.sh
# Quick helper to trigger genius-playground-generator from CLI

set -euo pipefail

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

echo "🎮 Genius Playground Generator"
echo "================================"
echo "Reading project data from: $(pwd)"
echo ""

# Discover available data
echo "📂 Data sources found:"
[ -f ".genius/state.json" ] && echo "  ✅ .genius/state.json (project state)"
[ -f "SPECIFICATIONS.xml" ] || [ -f ".genius/SPECIFICATIONS.xml" ] && echo "  ✅ Specifications"
[ -f "ARCHITECTURE.md" ] && echo "  ✅ Architecture"
[ -f ".genius/seo-report.md" ] && echo "  ✅ SEO Report"
[ -f ".claude/plan.md" ] && echo "  ✅ Dev Plan"

echo ""
echo "💡 Run in Claude Code: /genius-playground-generator"
echo "   Or in Codex: codex 'run genius-playground-generator for this project'"
