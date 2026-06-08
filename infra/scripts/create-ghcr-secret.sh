#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="memoire-app"
SECRET_NAME="ghcr-secret"
ENV_FILE="$(dirname "$0")/.env"

# Load .env if it exists
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

GITHUB_USER="${GITHUB_USER:-}"
GITHUB_PAT="${GITHUB_PAT:-}"

if [[ -z "$GITHUB_USER" || -z "$GITHUB_PAT" ]]; then
  echo "Error: GITHUB_USER and GITHUB_PAT must be set."
  echo "  export GITHUB_USER=yvescape"
  echo "  export GITHUB_PAT=<your_token>"
  echo "  Or create infra/scripts/.env (already gitignored)"
  exit 1
fi

# Create namespace if it doesn't exist
kubectl get namespace "$NAMESPACE" &>/dev/null || kubectl apply -f "$(dirname "$0")/../k8s/00-namespace.yaml"

# Delete existing secret if present
if kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &>/dev/null; then
  echo "Secret '$SECRET_NAME' already exists — deleting and recreating..."
  kubectl delete secret "$SECRET_NAME" -n "$NAMESPACE"
fi

kubectl create secret docker-registry "$SECRET_NAME" \
  --namespace="$NAMESPACE" \
  --docker-server=ghcr.io \
  --docker-username="$GITHUB_USER" \
  --docker-password="$GITHUB_PAT"

echo "Secret '$SECRET_NAME' created successfully in namespace '$NAMESPACE'."