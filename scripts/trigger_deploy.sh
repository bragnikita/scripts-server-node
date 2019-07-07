#!/usr/bin/env bash
set -e

CURRENT_BRANCH=`git branch | grep \* | cut -d ' ' -f2`
CURRENT_REV=`git rev-parse --short HEAD`

git checkout -b deploy-${CURRENT_REV}
git push origin deploy-${CURRENT_REV}:deploy-${CURRENT_REV}
git checkout ${CURRENT_BRANCH}
git branch -D deploy-${CURRENT_REV}

echo "After deploy is finished, please run the next command to keep repository clean:"
echo "git push --delete origin deploy-${CURRENT_REV}"