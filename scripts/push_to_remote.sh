#!/usr/bin/env bash
set -e

CURRENT_REV=`git rev-parse --short HEAD`

git checkout -b deploy-${CURRENT_REV}
git push origin deploy-${CURRENT_REV}:deploy-${CURRENT_REV}

echo "After deploy is finished, please run the next command to keep repository clean:"
echo "git push --delete origin deploy-${CURRENT_REV}"