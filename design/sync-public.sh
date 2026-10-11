#!/usr/bin/env bash
# Publish the prototype: copy design/inventory-prototype.html to cms/public/cashier (served at hogapay.com/cashier).
# Asset paths become absolute (/cashier/assets/...) because the page is served without a trailing slash.
set -euo pipefail
cd "$(dirname "$0")/.."
sed 's#"assets/#"/cashier/assets/#g' design/inventory-prototype.html > cms/public/cashier/index.html
rsync -a --delete --exclude .DS_Store design/assets/ cms/public/cashier/assets/
echo "Synced design/inventory-prototype.html to cms/public/cashier. Commit cms/public/cashier and deploy."
