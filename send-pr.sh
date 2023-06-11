#!/bin/bash -e

JSON_PATH="${1-./reports/report.json}"

if ! type -p gh >/dev/null; then
  echo "gh not found on the system" >&2
  exit 1
fi

GITHUB_URL=$(gh repo view --json url --jq .url)
HEAD_SHA=$(gh pr view --json headRefOid --jq .headRefOid)
PR_COMMENT=$(npm run --silent print-pr --ingapath=${JSON_PATH} --ingaurl=${GITHUB_URL} --ingasha=${HEAD_SHA})

gh pr comment $GITHUB_URL --body "$PR_COMMENT" --edit-last

