#!/usr/bin/env bash
set -euo pipefail

# Synchronize all branches (and optionally tags) from one git remote to another.
#
# Usage:
#   ./scripts/sync-remotes.sh <source-remote> <dest-remote> [options]
#
# Example:
#   git remote add backup git@github.com:org/a-just-backup.git
#   ./scripts/sync-remotes.sh origin backup --dry-run
#   ./scripts/sync-remotes.sh origin backup --tags

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SOURCE_REMOTE=""
DEST_REMOTE=""
DRY_RUN=false
SYNC_TAGS=false
FORCE_PUSH=false
EXCLUDE_PATTERNS=()
INCLUDE_PATTERNS=()

usage() {
  cat <<'EOF'
Synchronise toutes les branches d'une origine git vers une autre.

Usage:
  ./scripts/sync-remotes.sh <origine-source> <origine-destination> [options]

Options:
  --dry-run            Affiche les opérations sans pousser
  --tags               Synchronise aussi les tags
  --force              Force le push (équivalent à --force-with-lease)
  --exclude PATTERN    Exclut les branches correspondant au motif (répétable)
  --include PATTERN    Ne synchronise que les branches correspondant au motif (répétable)
  -h, --help           Affiche cette aide

Exemples:
  git remote add miroir git@github.com:mon-org/a-just-miroir.git
  ./scripts/sync-remotes.sh origin miroir --dry-run
  ./scripts/sync-remotes.sh origin miroir --tags
  ./scripts/sync-remotes.sh origin miroir --exclude '^dependabot/'

Notes:
  - La synchronisation est unidirectionnelle : source → destination.
  - Les branches présentes uniquement sur la destination ne sont pas supprimées.
  - Pour une synchronisation inverse, relancez le script en inversant les origines.
EOF
}

log() {
  echo "=== $*"
}

die() {
  echo "Erreur: $*" >&2
  exit 1
}

remote_exists() {
  git remote get-url "$1" >/dev/null 2>&1
}

branch_matches_any() {
  local branch="$1"
  shift
  local pattern

  for pattern in "$@"; do
    if [[ "$branch" == $pattern ]]; then
      return 0
    fi
  done

  return 1
}

should_sync_branch() {
  local branch="$1"

  if ((${#INCLUDE_PATTERNS[@]} > 0)); then
    branch_matches_any "$branch" "${INCLUDE_PATTERNS[@]}" || return 1
  fi

  if ((${#EXCLUDE_PATTERNS[@]} > 0)); then
    branch_matches_any "$branch" "${EXCLUDE_PATTERNS[@]}" && return 1
  fi

  return 0
}

parse_args() {
  if (($# < 2)); then
    usage
    exit 1
  fi

  SOURCE_REMOTE="$1"
  DEST_REMOTE="$2"
  shift 2

  while (($# > 0)); do
    case "$1" in
      --dry-run)
        DRY_RUN=true
        ;;
      --tags)
        SYNC_TAGS=true
        ;;
      --force)
        FORCE_PUSH=true
        ;;
      --exclude)
        shift
        [[ $# -gt 0 ]] || die "l'option --exclude requiert un motif"
        EXCLUDE_PATTERNS+=("$1")
        ;;
      --include)
        shift
        [[ $# -gt 0 ]] || die "l'option --include requiert un motif"
        INCLUDE_PATTERNS+=("$1")
        ;;
      -h | --help)
        usage
        exit 0
        ;;
      *)
        die "option inconnue: $1"
        ;;
    esac
    shift
  done
}

push_ref() {
  local source_ref="$1"
  local dest_ref="$2"

  if $DRY_RUN; then
    echo "[dry-run] git push $DEST_REMOTE $source_ref:$dest_ref"
    return 0
  fi

  local -a push_args=(push)
  if $FORCE_PUSH; then
    push_args+=(--force-with-lease)
  fi
  push_args+=("$DEST_REMOTE" "$source_ref:$dest_ref")

  git "${push_args[@]}"
}

main() {
  parse_args "$@"

  cd "$REPO_DIR"

  remote_exists "$SOURCE_REMOTE" || die "l'origine source '$SOURCE_REMOTE' est introuvable"
  remote_exists "$DEST_REMOTE" || die "l'origine destination '$DEST_REMOTE' est introuvable"

  if [[ "$SOURCE_REMOTE" == "$DEST_REMOTE" ]]; then
    die "les origines source et destination doivent être différentes"
  fi

  log "Récupération des branches depuis '$SOURCE_REMOTE'"
  git fetch "$SOURCE_REMOTE" --prune

  if $SYNC_TAGS; then
    git fetch "$SOURCE_REMOTE" --tags --force
  fi

  local branches=()
  local branch

  while IFS= read -r branch; do
    [[ -n "$branch" ]] || continue
    branches+=("$branch")
  done < <(
    git for-each-ref --format='%(refname:short)' "refs/remotes/$SOURCE_REMOTE/" |
      sed "s|^$SOURCE_REMOTE/||" |
      grep -vE '^(HEAD)$' || true
  )

  if ((${#branches[@]} == 0)); then
    die "aucune branche trouvée sur '$SOURCE_REMOTE'"
  fi

  local synced=0
  local skipped=0

  log "Synchronisation de ${#branches[@]} branche(s) : $SOURCE_REMOTE → $DEST_REMOTE"

  for branch in "${branches[@]}"; do
    if ! should_sync_branch "$branch"; then
      echo "Ignorée: $branch"
      ((skipped += 1)) || true
      continue
    fi

    echo "→ $branch"
    push_ref "refs/remotes/$SOURCE_REMOTE/$branch" "refs/heads/$branch"
    ((synced += 1)) || true
  done

  if $SYNC_TAGS; then
    log "Synchronisation des tags"
    local tag
    while IFS= read -r tag; do
      [[ -n "$tag" ]] || continue
      echo "→ tag $tag"
      push_ref "refs/tags/$tag" "refs/tags/$tag"
    done < <(git for-each-ref --format='%(refname:short)' refs/tags)
  fi

  log "Terminé"
  echo "Branches synchronisées: $synced"
  echo "Branches ignorées: $skipped"
  if $DRY_RUN; then
    echo "Mode dry-run : aucun push effectué"
  fi
}

main "$@"
