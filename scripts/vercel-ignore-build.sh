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
# Every failure path is fail-open (exit 1). One redundant deploy is cheaper
# than a missing one, so anything uncertain builds.
#
# No `set -e`: `--is-ancestor` exits 1 for "not an ancestor", and ls-remote /
# fetch may fail while a later strategy still succeeds. Those are normal
# answers here, not fatal errors. Every exit below is explicit, so no stray
# command status can leak into the exit code.
#
# Diagnostics: every branch logs, and the git environment is dumped BEFORE the
# branch gate so that a single build log answers both "did the ignore step
# even receive VERCEL_GIT_COMMIT_REF?" and "does this clone have a usable
# origin remote?". An earlier revision was silent and swallowed its own
# stderr, which left a real failed deploy with nothing to diagnose.
set -u

# Never let a credential prompt hang a build; fail fast instead.
export GIT_TERMINAL_PROMPT=0

# Written to BOTH streams on purpose: stderr is the conventional place for
# diagnostics, but we cannot verify which stream Vercel surfaces in its build
# log, and guessing wrong costs a whole deploy cycle. Expect each line twice
# wherever both streams are captured into one log.
log() {
  printf '[ignore-build] %s\n' "$*" >&2
  printf '[ignore-build] %s\n' "$*"
}

# Distinguishes "variable never set" from "set to an empty string". H1 (the
# ignore step not receiving Vercel's git env) turns exactly on that
# difference, so the log must not blur the two.
# $1 = "set" when the variable exists, empty otherwise. $2 = its value.
describe() {
  if [ -z "$1" ]; then
    printf '(unset)'
  elif [ -z "$2" ]; then
    printf '(set but empty)'
  else
    printf '%s' "$2"
  fi
}

BRANCH="${VERCEL_GIT_COMMIT_REF-}"
SHA="${VERCEL_GIT_COMMIT_SHA-}"

log "VERCEL_GIT_COMMIT_REF=$(describe "${VERCEL_GIT_COMMIT_REF+set}" "${VERCEL_GIT_COMMIT_REF-}")"
log "VERCEL_GIT_COMMIT_SHA=$(describe "${VERCEL_GIT_COMMIT_SHA+set}" "${VERCEL_GIT_COMMIT_SHA-}")"
log "VERCEL_GIT_REPO_OWNER=$(describe "${VERCEL_GIT_REPO_OWNER+set}" "${VERCEL_GIT_REPO_OWNER-}")"
log "VERCEL_GIT_REPO_SLUG=$(describe "${VERCEL_GIT_REPO_SLUG+set}" "${VERCEL_GIT_REPO_SLUG-}")"
log "cwd=$(pwd)"

# --- Git environment, logged before the gate ------------------------------
# Pure diagnostics: nothing here may terminate the script or influence the
# exit code. Failures are captured and logged, never propagated.
if git_dir="$(git rev-parse --git-dir 2>&1)"; then
  log "git dir: $git_dir"
  log "shallow repository: $(git rev-parse --is-shallow-repository 2>&1)"
  remotes="$(git remote -v 2>&1)"
  if [ -n "$remotes" ]; then
    printf '%s\n' "$remotes" | while IFS= read -r line; do
      log "remote: $line"
    done
  else
    log "remote: (none configured)"
  fi
else
  log "not a git repository: $git_dir"
fi

# --- Branch gate (mandatory, exact match) --------------------------------
if [ "$BRANCH" != "staging" ]; then
  log "DECISION: RUN build (exit 1) - branch is not exactly 'staging'"
  exit 1
fi

# --- Resolve the commit being deployed ------------------------------------
# VERCEL_GIT_COMMIT_SHA is always plain hex. Requiring that (instead of
# passing the value straight to git) keeps a stray value like '--all' or
# 'HEAD; ...' from ever reaching a git argument slot.
if [ -z "$SHA" ]; then
  log "commit SHA not provided; falling back to HEAD"
  SHA="HEAD"
else
  case "$SHA" in
    *[!0-9a-fA-F]* | "")
      log "commit SHA '$SHA' is not hexadecimal; refusing to use it"
      log "DECISION: RUN build (exit 1)"
      exit 1
      ;;
  esac
fi

if ! HEAD_SHA="$(git rev-parse --verify "${SHA}^{commit}" 2>&1)"; then
  log "cannot resolve deploy commit '$SHA': $HEAD_SHA"
  log "DECISION: RUN build (exit 1)"
  exit 1
fi
log "deploy commit resolves to $HEAD_SHA"

# --- Acquire main's SHA, trying each strategy until one answers -----------
# Vercel clones shallow and single-branch, so refs/remotes/origin/main is
# usually absent and full history is missing. Strategies are ordered cheapest
# first; each logs its own outcome - including being skipped - so the build
# log always names which one answered and why the others did not.
MAIN_SHA=""
MAIN_SOURCE=""

# 1. Already local? Costs nothing when the clone happens to carry main.
for ref in refs/remotes/origin/main refs/heads/main; do
  if MAIN_SHA="$(git rev-parse --verify --quiet "${ref}^{commit}" 2>/dev/null)"; then
    MAIN_SOURCE="local ref $ref"
    break
  fi
  MAIN_SHA=""
done
[ -n "$MAIN_SHA" ] || log "strategy 1 (local ref): main not present locally"

# 2. ls-remote asks only for the ref value, transferring no history, so it is
#    the most reliable option in a shallow clone.
if [ -z "$MAIN_SHA" ]; then
  if out="$(git ls-remote origin refs/heads/main 2>&1)"; then
    MAIN_SHA="$(printf '%s\n' "$out" | awk '$2 == "refs/heads/main" { print $1; exit }')"
    if [ -n "$MAIN_SHA" ]; then
      MAIN_SOURCE="git ls-remote origin"
    else
      log "strategy 2 (ls-remote origin): succeeded but returned no refs/heads/main"
    fi
  else
    log "strategy 2 (ls-remote origin) failed: $out"
  fi
fi

# 3. fetch is heavier and needs the remote to serve objects, but it populates
#    FETCH_HEAD locally, which the ancestor check below can then use.
if [ -z "$MAIN_SHA" ]; then
  if out="$(git fetch origin main 2>&1)"; then
    if MAIN_SHA="$(git rev-parse --verify --quiet 'FETCH_HEAD^{commit}' 2>/dev/null)"; then
      MAIN_SOURCE="git fetch origin main (FETCH_HEAD)"
    else
      MAIN_SHA=""
      log "strategy 3 (fetch origin main): fetched but FETCH_HEAD did not resolve"
    fi
  else
    log "strategy 3 (fetch origin main) failed: $out"
  fi
fi

# 4. Last resort for a clone with no usable 'origin' remote: rebuild the URL
#    from Vercel's own repo variables. Works unauthenticated on a public repo;
#    on a private one it simply fails and we fall through to fail-open. This
#    is the only strategy that survives a missing origin, so whether it ran at
#    all must be visible in the log - never skip it silently.
if [ -z "$MAIN_SHA" ]; then
  if [ -z "${VERCEL_GIT_REPO_OWNER-}" ] || [ -z "${VERCEL_GIT_REPO_SLUG-}" ]; then
    log "strategy 4 (ls-remote by URL): skipped - VERCEL_GIT_REPO_OWNER and VERCEL_GIT_REPO_SLUG are not both set"
  else
    url="https://github.com/${VERCEL_GIT_REPO_OWNER}/${VERCEL_GIT_REPO_SLUG}.git"
    log "strategy 4: retrying ls-remote against $url"
    if out="$(git ls-remote "$url" refs/heads/main 2>&1)"; then
      MAIN_SHA="$(printf '%s\n' "$out" | awk '$2 == "refs/heads/main" { print $1; exit }')"
      if [ -n "$MAIN_SHA" ]; then
        MAIN_SOURCE="git ls-remote $url"
      else
        log "strategy 4 (ls-remote by URL): succeeded but returned no refs/heads/main"
      fi
    else
      log "strategy 4 (ls-remote by URL) failed: $out"
    fi
  fi
fi

if [ -z "$MAIN_SHA" ]; then
  log "could not determine main's SHA by any strategy"
  log "DECISION: RUN build (exit 1)"
  exit 1
fi

# Same hex check the deploy SHA gets. The value comes from a remote listing
# rather than a Vercel variable, so validate it before it reaches git too.
case "$MAIN_SHA" in
  *[!0-9a-fA-F]* | "")
    log "main SHA '$MAIN_SHA' (via $MAIN_SOURCE) is not hexadecimal; refusing to use it"
    log "DECISION: RUN build (exit 1)"
    exit 1
    ;;
esac
log "main resolves to $MAIN_SHA (via $MAIN_SOURCE)"

# --- Primary check: identical tips ----------------------------------------
# A clean rebase sync leaves staging on the exact commit main points at. Both
# values are full 40-char SHAs (rev-parse and ls-remote both emit full form),
# so this is a plain string compare that needs no history at all - which is
# what makes it survive a shallow clone.
if [ "$HEAD_SHA" = "$MAIN_SHA" ]; then
  log "DECISION: SKIP build (exit 0) - staging tip is identical to main tip"
  exit 0
fi

# --- Secondary check: staging already contained in main -------------------
# Covers staging sitting behind main. Only runs when the tips differ, so it
# can never overturn the primary result. It needs real history, which a
# shallow clone may lack; any failure just falls through to fail-open.
if ! git cat-file -e "${MAIN_SHA}^{commit}" 2>/dev/null; then
  log "main commit is not a local object (shallow clone); skipping ancestor check"
  log "DECISION: RUN build (exit 1) - tips differ and containment is unknown"
  exit 1
fi

if git merge-base --is-ancestor "$HEAD_SHA" "$MAIN_SHA" 2>/dev/null; then
  log "DECISION: SKIP build (exit 0) - deploy commit is already contained in main"
  exit 0
fi

log "DECISION: RUN build (exit 1) - deploy commit is not contained in main"
exit 1
