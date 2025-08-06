#!/bin/bash

# Lint all projects and show errors from both
echo "🔍 Running comprehensive lint check..."

CMS_EXIT=0
MOBILE_EXIT=0

# Check if there are staged files in cms
if git diff --cached --name-only | grep -q "^cms/.*\.\(js\|jsx\|ts\|tsx\)$"; then
  echo ""
  echo "=== 🏢 CMS LINT RESULTS ==="
  (cd cms && pnpm run lint)
  CMS_EXIT=$?
fi

# Check if there are staged files in mobile-app
if git diff --cached --name-only | grep -q "^mobile-app/.*\.\(js\|jsx\|ts\|tsx\)$"; then
  echo ""
  echo "=== 📱 MOBILE-APP LINT RESULTS ==="
  (cd mobile-app && pnpm run lint)
  MOBILE_EXIT=$?
fi

echo ""
if [ $CMS_EXIT -ne 0 ] || [ $MOBILE_EXIT -ne 0 ]; then
  echo "❌ Lint errors found - commit blocked"
  echo ""
  if [ $CMS_EXIT -ne 0 ]; then
    echo "   • CMS has lint errors"
  fi
  if [ $MOBILE_EXIT -ne 0 ]; then
    echo "   • Mobile-app has lint errors"
  fi
  echo ""
  exit 1
else
  echo "✅ All lint checks passed"
  exit 0
fi
