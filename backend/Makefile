.PHONY: up down build logs ps tidy seed createadmin

## Start all services (détache en arrière-plan)
up:
	docker compose up -d --build

## Arrêter tous les services
down:
	docker compose down

## Rebuild sans cache
build:
	docker compose build --no-cache

## Suivre les logs
logs:
	docker compose logs -f

## Status des containers
ps:
	docker compose ps

## go mod tidy sur tous les services
tidy:
	cd users-service    && go mod tidy
	cd products-service && go mod tidy
	cd orders-service   && go mod tidy
	cd payments-service && go mod tidy
	cd review-service   && go mod tidy
	cd api-gateway      && go mod tidy

## Créer le superuser administrateur (lancer après make up)
createadmin:
	docker compose exec users ./createadmin

## Peupler la base products avec les 15 parfums (lancer après make up)
seed:
	docker compose exec products ./seed

## Générer une paire de clés RSA pour JWT (nécessite openssl)
keygen:
	openssl genrsa -out private.pem 2048
	openssl rsa -in private.pem -pubout -out public.pem
	@echo "Clés générées : private.pem et public.pem"
	@echo "Copier le contenu dans .env (JWT_PRIVATE_KEY et JWT_PUBLIC_KEY)"
