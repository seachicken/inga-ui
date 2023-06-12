#!/bin/bash -e

INGA_WORK_PATH="${1-.}"

if ! type -p gh >/dev/null; then
  echo "gh not found on the system" >&2
  exit 1
fi

GITHUB_URL=$(cd $INGA_WORK_PATH && gh repo view --json url --jq .url)
echo "GITHUB_URL: $GITHUB_URL"
HEAD_SHA=$(cd $INGA_WORK_PATH && gh pr view --json headRefOid --jq .headRefOid)
echo "HEAD_SHA: $HEAD_SHA"

PR_COMMENT=$(npm run --silent print-pr --ingapath=${INGA_WORK_PATH}/reports/report.json --ingaurl=${GITHUB_URL} --ingasha=${HEAD_SHA})

cd $INGA_WORK_PATH

gh pr comment $GITHUB_URL --body "$PR_COMMENT" --edit-last

