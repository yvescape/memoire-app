# Locust — validation canary products-service

Objectif : prouver que le service répond correctement pendant la phase canary Flagger,
pas mesurer des performances.

## Pourquoi `http://192.168.1.15` ne fonctionne pas

Traefik route le trafic par virtual hosting : il matche sur `Host('api.memoire.local')`.
Frapper l'IP brute sans ce header → Traefik ne trouve aucune route → **404 partout**.

## Prérequis

```bash
pip install locust
```

## Option A — port-forward (recommandé)

Contourne Traefik et va directement sur l'api-gateway. Aucune config `/etc/hosts`.

```bash
# Terminal 1
kubectl port-forward svc/api-gateway 8080:8080 -n memoire-app

# Terminal 2
locust -f infra/locust/locustfile.py \
  --host http://localhost:8080 \
  --users 5 --spawn-rate 1 --run-time 3m --headless
```

## Option B — `/etc/hosts` + hostname Traefik

Passe par Traefik, chemin le plus réaliste (trafic production).

```bash
# Ajouter une fois
echo "192.168.1.15 api.memoire.local" | sudo tee -a /etc/hosts

locust -f infra/locust/locustfile.py \
  --host http://api.memoire.local \
  --users 5 --spawn-rate 1 --run-time 3m --headless
```

## Avec l'UI web (http://localhost:8089)

```bash
locust -f infra/locust/locustfile.py --host http://localhost:8080
```

## Ce que valide ce test

| Endpoint | Vérification |
|---|---|
| `GET /api/products/health/` | status=ok + **log de la `version`** (visible pendant canary) |
| `GET /api/products/` | 200 + payload `{count, results}` |
| `GET /api/products/<id>/` | 200 pour les IDs connus |

Pendant le déploiement canary, le champ `version` dans les logs alterne entre
la version stable et la version canary — c'est la preuve que les deux builds
fonctionnent et que Flagger splitte bien le trafic.