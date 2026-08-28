#!/usr/bin/env bash
# Vercel "Ignored Build Step" guard.
#
# !! Exit code semantics are INVERTED vs. intuition !!
#   exit 0 -> SKIP the build   (Vercel asks "should I ignore this commit?")
#   exit 1 -> RUN the build
#
# Why: after a staging -> main promotion we rebase staging onto main and force
# push (.harness/root.md "Branch 전략과 동기화"). That push leaves staging on a
# commit already contained in main, so its deploy rebuilds exactly what main
# just deployed. Only that redundant deploy is skipped.
#
# The branch gate is NOT optional: `git merge-base --is-ancestor X X` is true
# because a commit is its own ancestor, so without the gate every production
# build on main would be skipped.
#
# No `set -e`: --is-ancestor exits 1 for "not an ancestor", which is a normal
# answer here, not a failure.
set -u

BRANCH="${VERCEL_GIT_COMMIT_REF:-}"
SHA="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

if [ "$BRANCH" != "staging" ]; then
  exit 1
fi

# Vercel clones shallowly, so origin/main may not exist locally. Fetch it and
# compare against FETCH_HEAD. Fail open on any error: one extra deploy is
# cheaper than a missing one.
if ! git fetch --quiet origin main 2>/dev/null; then
  exit 1
fi

if git merge-base --is-ancestor "$SHA" FETCH_HEAD 2>/dev/null; then
  exit 0
fi

exit 1
