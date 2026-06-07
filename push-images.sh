#!/bin/bash

REGISTRY="ghcr.io/yvescape"

echo "🚀 Push des images vers $REGISTRY..."

declare -A IMAGES=(
  ["backend-users"]="users-service"
  ["backend-products"]="products-service"
  ["backend-orders"]="orders-service"
  ["backend-payments"]="payments-service"
  ["backend-reviews"]="reviews-service"
  ["backend-gateway"]="api-gateway"
  ["capedev/e-commerce-frontend"]="e-commerce-frontend"
  ["capedev/admin-panel"]="admin-panel"
)

for LOCAL in "${!IMAGES[@]}"; do
  REMOTE="${IMAGES[$LOCAL]}"
  echo "📦 $LOCAL → $REGISTRY/$REMOTE:latest"
  docker tag "$LOCAL:latest" "$REGISTRY/$REMOTE:latest"
  docker push "$REGISTRY/$REMOTE:latest"
  if [ $? -eq 0 ]; then
    echo "✅ $REMOTE pushed"
  else
    echo "❌ Erreur sur $REMOTE"
  fi
done

echo "✅ Terminé !"
