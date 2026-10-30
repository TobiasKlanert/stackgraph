#!/bin/sh
# Deploys the StackGraph container on the VPS.
#
# Only reachable through the forced command of the CI deploy key in
# ~/.ssh/authorized_keys:
#   command="/usr/local/bin/stackgraph-deploy",restrict ssh-ed25519 ...
#
# The client only sends the image tag to deploy: sha-<commit>. Everything
# else (directory, container, what happens) is decided here, on the server.
set -eu

fail() {
  echo "deploy: $*" >&2
  exit 1
}

dir=/srv/apps/stackgraph
name=stackgraph

# The only accepted input: sha- followed by a full 40-character commit hash.
tag=${SSH_ORIGINAL_COMMAND:-}
case "$tag" in
  sha-*) ;;
  *) fail "expected an image tag like sha-<commit>" ;;
esac
hash=${tag#sha-}
[ "${#hash}" -eq 40 ] || fail "invalid commit hash"
case "$hash" in
  *[!0-9a-f]*) fail "invalid commit hash" ;;
esac

cd "$dir"

# Pull first. If the image does not exist, nothing on the server changes.
IMAGE_TAG=$tag docker compose pull ||
  fail "could not pull $tag"

# Remember what runs now, so a failed deploy can go back to it.
previous=$(sed -n 's/^IMAGE_TAG=//p' .env 2>/dev/null || true)

write_env() {
  printf 'IMAGE_TAG=%s\n' "$1" >.env
}

write_env "$tag"
if docker compose up -d --wait --wait-timeout 90; then
  echo "deploy: $name runs $tag"
else
  echo "deploy: $tag did not come up" >&2
  if [ -n "$previous" ]; then
    echo "deploy: rolling back to $previous" >&2
    write_env "$previous"
    docker compose up -d --wait --wait-timeout 90 || true
  fi
  exit 1
fi

# Remove StackGraph images that no container uses any more. GHCR keeps every
# tag, so a rollback can pull an older image again. Images of other projects
# carry a different source label and are left alone.
docker image prune -af \
  --filter 'label=org.opencontainers.image.source=https://github.com/TobiasKlanert/stackgraph' \
  >/dev/null
