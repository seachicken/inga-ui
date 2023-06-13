#!/bin/bash -e

COMMAND=$1
INGA_WORK_PATH="${2-.}"
HOME_DIR="${3-/inga-ui}"

ls -lsa $INGA_WORK_PATH

if ! type -p gh >/dev/null; then
  echo "gh not found on the system" >&2
  exit 1
fi

GITHUB_URL=$(cd $INGA_WORK_PATH && gh repo view --json url --jq .url)
echo "GITHUB_URL: $GITHUB_URL"
HEAD_SHA=$(cd $INGA_WORK_PATH && gh pr view --json headRefOid --jq .headRefOid)
echo "HEAD_SHA: $HEAD_SHA"

if [ $1 = "pr-report" ]; then
  PR_COMMENT=$(cd $HOME_DIR && npm run --silent print-pr --ingapath=${INGA_WORK_PATH}/reports/report.json --ingaurl=${GITHUB_URL} --ingasha=${HEAD_SHA})
  echo "PR_COMMENT: $PR_COMMENT"
  cd $INGA_WORK_PATH
  gh pr comment --body "$PR_COMMENT" --edit-last || gh pr comment --body "$PR_COMMENT"
elif [ $1 = "html-report" ]; then
  cd $HOME_DIR
  npm run build --ingapath=${INGA_WORK_PATH}/reports/report.json --ingaurl=${GITHUB_URL} --ingasha=${HEAD_SHA} -- --base=${GITHUB_URL}
else
  echo "command is required" >&2
  exit 1
fi

