#!/bin/bash -e

COMMAND=$1
INGA_JSON_PATH="${2-./reports/report.json}"
HOME_DIR="${3-/inga-ui}"

if ! type -p gh >/dev/null; then
  echo "gh not found on the system" >&2
  exit 1
fi

GITHUB_URL=$(gh repo view --json url --jq .url)
echo "GITHUB_URL: $GITHUB_URL"
HEAD_SHA=$(gh pr view --json headRefOid --jq .headRefOid)
echo "HEAD_SHA: $HEAD_SHA"

if [ $1 = "pr-report" ]; then
  PR_COMMENT=$(cd $HOME_DIR && npm run --silent print-pr --ingapath=${INGA_JSON_PATH} --ingaurl=${GITHUB_URL} --ingasha=${HEAD_SHA})
  echo "PR_COMMENT: $PR_COMMENT"
  gh pr comment --body "$PR_COMMENT" --edit-last || gh pr comment --body "$PR_COMMENT"
elif [ $1 = "html-report" ]; then
  cd $HOME_DIR
  npm run build --ingapath=${INGA_JSON_PATH} --ingaurl=${GITHUB_URL} --ingasha=${HEAD_SHA} -- --base=${GITHUB_URL}
else
  echo "command is required" >&2
  exit 1
fi

