#!/usr/bin/env bash
set -euo pipefail

# Git-based deploy helper for Netlify.
#
# Netlify already knows how to build this Next.js app from the repository
# because the site is connected to Git and uses @netlify/plugin-nextjs.
# The safest deploy flow is:
#   1. commit local changes
#   2. push to the connected branch
#   3. optionally trigger a Netlify build hook
#
# Usage:
#   ./deploy.sh
#   ./deploy.sh --branch main
#   ./deploy.sh --branch main --message "feat: update studio"
#   ./deploy.sh --checks
#
# Optional environment variables:
#   REPO_URL=https://github.com/neytorman13/Hack-Evans.git
#   NETLIFY_BUILD_HOOK_URL=https://api.netlify.com/build_hooks/...
#   RUN_LOCAL_CHECKS=1

DEFAULT_REPO_URL="https://github.com/neytorman13/Hack-Evans.git"
REPO_URL="${REPO_URL:-$DEFAULT_REPO_URL}"
BRANCH=""
COMMIT_MESSAGE="${DEPLOY_COMMIT_MESSAGE:-}"
RUN_LOCAL_CHECKS="${RUN_LOCAL_CHECKS:-0}"
TRIGGER_BUILD_HOOK=1

usage() {
  cat <<'EOF'
Usage:
  ./deploy.sh [--branch <name>] [--message <text>] [--checks] [--no-hook]

Options:
  --branch, -b   Branch to push. Defaults to current branch or "main".
  --message, -m  Commit message. If omitted, a timestamped message is used.
  --checks       Run local validation before commit/push.
  --no-hook      Do not call NETLIFY_BUILD_HOOK_URL after push.
  --help, -h     Show this help.

Environment:
  REPO_URL                 Override the git remote URL.
  NETLIFY_BUILD_HOOK_URL   Optional Netlify build hook to force a deploy.
  RUN_LOCAL_CHECKS=1       Same as --checks.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch|-b)
      BRANCH="${2:-}"
      shift 2
      ;;
    --message|-m)
      COMMIT_MESSAGE="${2:-}"
      shift 2
      ;;
    --checks)
      RUN_LOCAL_CHECKS=1
      shift
      ;;
    --no-hook)
      TRIGGER_BUILD_HOOK=0
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      if [[ -z "$BRANCH" ]]; then
        BRANCH="$1"
        shift
      else
        echo "ERROR: unknown argument: $1" >&2
        usage
        exit 1
      fi
      ;;
  esac
done

if ! command -v git >/dev/null 2>&1; then
  echo "ERROR: git is not installed or not available in PATH." >&2
  exit 1
fi

if [[ ! -d ".git" ]]; then
  echo "ERROR: this folder is not a git repository." >&2
  echo "Clone the GitHub repo first or run this script inside the real repository checkout." >&2
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "==> Adding git remote origin: $REPO_URL"
  git remote add origin "$REPO_URL"
else
  CURRENT_REMOTE="$(git remote get-url origin)"
  if [[ "$CURRENT_REMOTE" != "$REPO_URL" ]]; then
    echo "==> Updating git remote origin"
    git remote set-url origin "$REPO_URL"
  fi
fi

if [[ -z "$BRANCH" ]]; then
  BRANCH="$(git branch --show-current 2>/dev/null || true)"
fi

if [[ -z "$BRANCH" ]]; then
  BRANCH="main"
fi

if [[ "$RUN_LOCAL_CHECKS" == "1" ]]; then
  echo "==> Running local checks"
  if [[ ! -d "node_modules" ]]; then
    echo "==> Installing dependencies"
    npm install
  fi
  npx tsc --noEmit
fi

echo "==> Staging changes"
git add -A

if git diff --cached --quiet; then
  echo "==> No staged changes to commit"
else
  if [[ -z "$COMMIT_MESSAGE" ]]; then
    COMMIT_MESSAGE="chore: sync deploy $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  fi
  echo "==> Creating commit"
  git commit -m "$COMMIT_MESSAGE"
fi

echo "==> Pushing HEAD to origin/$BRANCH"
git push origin "HEAD:$BRANCH"

if [[ "$TRIGGER_BUILD_HOOK" == "1" && -n "${NETLIFY_BUILD_HOOK_URL:-}" ]]; then
  echo "==> Triggering Netlify build hook"
  curl -fsS -X POST "$NETLIFY_BUILD_HOOK_URL" >/dev/null
  echo "==> Netlify build hook triggered"
else
  echo "==> Push completed"
  echo "If Netlify is connected to branch '$BRANCH', the deploy should start automatically."
  if [[ -z "${NETLIFY_BUILD_HOOK_URL:-}" ]]; then
    echo "Optional: set NETLIFY_BUILD_HOOK_URL to force a deploy immediately after push."
  fi
fi

echo "==> Done"
