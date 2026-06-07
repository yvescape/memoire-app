#!/bin/bash
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────
DOCKER_USER="capedev"
IMAGE_NAME="e-commerce-frontend"
GIT_SHA=$(git rev-parse --short HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD | tr "/" "-")
FULL_IMAGE="${DOCKER_USER}/${IMAGE_NAME}"

echo "======================================"
echo " Build : ${FULL_IMAGE}:${GIT_SHA}"
echo " Branch : ${BRANCH}"
echo " Date   : $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================"

# ── Pré-vérifications ──────────────────────────────────────────
echo ""
echo "[0/4] Vérifications..."

if ! command -v trivy &> /dev/null; then
  echo "ERREUR : Trivy n'est pas installé."
  echo "Installation : https://aquasecurity.github.io/trivy/latest/getting-started/installation/"
  exit 1
fi

if ! docker info &> /dev/null; then
  echo "ERREUR : Docker n'est pas démarré."
  exit 1
fi

echo "Vérifications OK."

# ── Étape 1 : Build ───────────────────────────────────────────
echo ""
echo "[1/4] Build de l'image..."
docker build \
  --tag "${FULL_IMAGE}:${GIT_SHA}" \
  --tag "${FULL_IMAGE}:${BRANCH}" \
  --label "org.opencontainers.image.revision=${GIT_SHA}" \
  --label "org.opencontainers.image.created=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --label "org.opencontainers.image.source=https://github.com/capedev/${IMAGE_NAME}" \
  .

if [ "${BRANCH}" = "main" ]; then
  docker tag "${FULL_IMAGE}:${GIT_SHA}" "${FULL_IMAGE}:latest"
  echo "Tag latest appliqué (branche main)."
else
  echo "Tag latest ignoré (branche ${BRANCH} ≠ main)."
fi

echo "Build terminé : ${FULL_IMAGE}:${GIT_SHA}"

# ── Étape 2 : Scan Trivy ──────────────────────────────────────
echo ""
echo "[2/4] Scan des vulnérabilités (Trivy)..."
trivy image \
  --severity LOW,MEDIUM,HIGH,CRITICAL \
  --format table \
  "${FULL_IMAGE}:${GIT_SHA}"

echo ""
echo "Vérification des CVE bloquantes (HIGH, CRITICAL)..."
trivy image \
  --severity HIGH,CRITICAL \
  --exit-code 1 \
  --format table \
  "${FULL_IMAGE}:${GIT_SHA}"

echo "Scan OK — aucune CVE HIGH/CRITICAL détectée."

# ── Étape 3 : Push ────────────────────────────────────────────
echo ""
echo "[3/4] Push vers Docker Hub..."
docker push "${FULL_IMAGE}:${GIT_SHA}"
docker push "${FULL_IMAGE}:${BRANCH}"

if [ "${BRANCH}" = "main" ]; then
  docker push "${FULL_IMAGE}:latest"
fi

# ── Étape 4 : Résumé ──────────────────────────────────────────
echo ""
echo "[4/4] Images publiées :"
echo "  ${FULL_IMAGE}:${GIT_SHA}   ← tag immuable (utiliser en prod)"
echo "  ${FULL_IMAGE}:${BRANCH}"
if [ "${BRANCH}" = "main" ]; then
  echo "  ${FULL_IMAGE}:latest"
fi
echo ""
echo "Pour déployer sur k3s :"
echo "  kubectl set image deployment/e-commerce-frontend frontend=${FULL_IMAGE}:${GIT_SHA}"
echo ""
echo "Terminé."