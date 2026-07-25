# ProBioPredict

ProBioPredict est une application web full-stack dédiée à l’analyse de séquences ADN et à la prédiction de leur classification comme probiotique ou non probiotique.

Le projet associe un frontend React avec Vite, une API Django REST Framework, PostgreSQL, une authentification JWT, un véritable modèle TensorFlow Lite et Stripe Checkout pour la gestion des abonnements.

## État du projet

- Application en développement.
- Stripe opérationnel en environnement de test.
- Application non encore déployée en production.
- Envoi des emails éventuellement en mode console selon la configuration.

## Présentation générale

ProBioPredict permet aux utilisateurs authentifiés de téléverser des fichiers CSV contenant des séquences ADN, de lancer une inférence de machine learning et de consulter les résultats obtenus.

L’application propose également :

- un Dashboard utilisateur ;
- un historique des prédictions ;
- la gestion des résultats ;
- les actions pin, unpin et suppression ;
- le téléchargement des résultats dans le parcours applicatif ;
- des plans d’abonnement Free, Pro et Lab ;
- Stripe Checkout en environnement de test ;
- la synchronisation sécurisée des abonnements via des webhooks Stripe vérifiés.

## Objectif de ProBioPredict

L’objectif de ProBioPredict est de fournir une plateforme claire et accessible pour analyser des ensembles de séquences ADN et obtenir des prédictions basées sur un modèle de machine learning intégré.

Le projet démontre notamment :

- une authentification sécurisée avec JWT ;
- des routes protégées ;
- la validation et le traitement de fichiers CSV ;
- le stockage des données dans PostgreSQL ;
- une gestion d’abonnements avec limites d’utilisation ;
- une intégration Stripe sécurisée ;
- une inférence réelle avec TensorFlow Lite.

## Fonctionnalités principales

### Authentification et comptes utilisateurs

- Création de compte.
- Connexion avec tokens JWT d’accès et de rafraîchissement.
- Routes frontend protégées.
- Endpoints backend authentifiés.
- Récupération des informations de l’utilisateur courant.
- Retour des informations d’abonnement dans les données utilisateur.

### Prédictions

- Téléversement de fichiers CSV.
- Validation du format CSV.
- Validation des colonnes attendues.
- Validation des séquences ADN.
- Inférence réelle avec TensorFlow Lite.
- Classification probiotique ou non probiotique.
- Calcul d’un score de confiance.
- Stockage des prédictions et résultats dans PostgreSQL.
- Gestion de plusieurs résultats pour une même prédiction.

### Gestion des résultats

- Dashboard utilisateur.
- Historique des prédictions.
- Consultation détaillée d’une prédiction.
- Épinglage et désépinglage des prédictions.
- Suppression de prédictions.
- Téléchargement ou export des résultats via l’application.
- Endpoint de demande d’envoi des résultats par email.

### Abonnements

- Plan Free.
- Plan Pro.
- Plan Lab.
- Création de sessions Stripe Checkout par le backend.
- Paiements Stripe en environnement de test.
- Vérification de la signature des webhooks Stripe.
- Mise à jour automatique de l’abonnement après un webhook vérifié.
- Enregistrement des identifiants Stripe Customer, Subscription et Price.
- Affichage du plan actif et de la limite de prédictions sur le Dashboard.

## Architecture générale

~~~text
┌─────────────────────────────────────────────────────────────┐
│                    Frontend React + Vite                     │
│                                                             │
│ Home · Register · Login · Dashboard · Prediction · History  │
│ Premium · BillingSuccess · BillingCancel                     │
│                                                             │
│ JWT stockés localement et transmis dans les requêtes API     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON / CSV multipart
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Django REST Framework                   │
│                                                             │
│ users        Authentification et endpoints utilisateur       │
│ predictions  Validation CSV, inférence ML, historique        │
│ billing      Stripe Checkout et traitement des webhooks      │
└──────────────────┬───────────────────────────────┬──────────┘
                   │                               │
                   ▼                               ▼
┌──────────────────────────────┐      ┌────────────────────────┐
│          PostgreSQL          │      │       Stripe API        │
│                              │      │                        │
│ Utilisateurs                 │      │ Sessions Checkout      │
│ Prédictions                  │      │ Customers              │
│ Résultats de prédictions     │      │ Subscriptions          │
│ Abonnements utilisateurs     │      │ Événements signés      │
└──────────────────────────────┘      └────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│             Inférence Machine Learning TensorFlow Lite       │
│                                                             │
│ backend/predictions/services.py                              │
│   └── run_inference()                                        │
│       └── ml_engine.predict.predict_from_sequence()          │
└─────────────────────────────────────────────────────────────┘
~~~

## Technologies utilisées

### Frontend

- React 19.
- Vite 8.
- JavaScript.
- React Router.
- Fetch API.
- Authentification JWT.

### Backend

- Python 3.
- Django 5.
- Django REST Framework.
- `djangorestframework-simplejwt`.
- `django-cors-headers`.
- PostgreSQL.
- `psycopg2-binary`.
- Stripe Python SDK.

### Machine learning et traitement des données

- TensorFlow 2.
- TensorFlow Lite.
- NumPy.
- Pandas.

### Dépendances de test

- pytest.
- pytest-cov.
- pytest-django.

### Services externes

- Stripe Checkout en environnement de test.
- Stripe CLI pour le transfert local des webhooks.

## Organisation du projet

~~~text
ProBioPredict/
│
├── backend/
│   ├── billing/
│   │   ├── migrations/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── config/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── predictions/
│   │   ├── migrations/
│   │   ├── tests/
│   │   ├── models.py
│   │   ├── services.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── users/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── .env.example
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── pages/
│   │   │   ├── BillingCancel.jsx
│   │   │   ├── BillingSuccess.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Premium.jsx
│   │   │   ├── PredictionForm.jsx
│   │   │   ├── PredictionResult.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   ├── authApi.js
│   │   │   ├── billingApi.js
│   │   │   └── predictionApi.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── ml_engine/
│   └── predict.py
│
├── .gitignore
└── README.md
~~~

## Prérequis

Les outils suivants sont nécessaires pour exécuter le projet localement :

- Git.
- Python 3.
- `pip`.
- Node.js.
- npm.
- PostgreSQL.
- Stripe CLI, uniquement pour tester les paiements et webhooks Stripe en local.

Vérifiez les versions installées :

~~~bash
python3 --version
pip3 --version
node --version
npm --version
psql --version
stripe --version
~~~

L’environnement recommandé est Linux, WSL ou macOS avec les commandes équivalentes.

## Installation

Clonez le dépôt puis placez-vous à sa racine :

~~~bash
git clone <URL_DU_DEPOT>
cd ProBioPredict
~~~

Le projet utilise trois terminaux lors des tests locaux de Stripe :

- **Terminal 1 :** backend Django.
- **Terminal 2 :** frontend React.
- **Terminal 3 :** Stripe CLI, uniquement pour Stripe Checkout et les webhooks locaux.

## Configuration de PostgreSQL

Ouvrez une session PostgreSQL :

~~~bash
sudo -u postgres psql
~~~

Créez un utilisateur local :

~~~sql
CREATE USER probiopredict_user WITH PASSWORD 'votre-mot-de-passe-local';
~~~

Créez la base de données :

~~~sql
CREATE DATABASE probiopredict_db OWNER probiopredict_user;
~~~

Accordez les privilèges si nécessaire :

~~~sql
GRANT ALL PRIVILEGES ON DATABASE probiopredict_db TO probiopredict_user;
~~~

Quittez PostgreSQL :

~~~sql
\q
~~~

Les valeurs locales documentées dans `backend/.env.example` sont :

~~~env
POSTGRES_DB=probiopredict_db
POSTGRES_USER=probiopredict_user
POSTGRES_PASSWORD=your-local-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
~~~

Remplacez le mot de passe par votre propre mot de passe local dans `backend/.env`.

- Ne poussez jamais un mot de passe PostgreSQL dans Git.
- Ne réutilisez pas ces valeurs d’exemple pour un environnement de production.

## Configuration du backend

Ouvrez le **Terminal 1** depuis la racine du projet :

~~~bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
~~~

Créez votre fichier d’environnement local :

~~~bash
cp .env.example .env
~~~

Modifiez ensuite `backend/.env` avec vos valeurs locales.

Appliquez les migrations :

~~~bash
python manage.py migrate
~~~

Vous pouvez créer un compte administrateur Django :

~~~bash
python manage.py createsuperuser
~~~

Lancez le serveur Django :

~~~bash
python manage.py runserver
~~~

Le backend est accessible à l’adresse :

~~~text
http://127.0.0.1:8000
~~~

L’interface Django Admin est accessible à l’adresse :

~~~text
http://127.0.0.1:8000/admin/
~~~

## Configuration du frontend

Ouvrez le **Terminal 2** depuis la racine du projet :

~~~bash
cd frontend
npm install
npm run dev
~~~

Vite démarre généralement le frontend sur :

~~~text
http://localhost:5173
~~~

Le frontend communique avec l’API Django via :

~~~text
http://127.0.0.1:8000/api
~~~

Le fichier `frontend/.env.example` contient les variables suivantes :

~~~env
VITE_API_AUTH_BASE_URL=http://127.0.0.1:8000/api/auth
VITE_API_BASE_URL=http://127.0.0.1:8000/api
~~~

Si nécessaire, créez un fichier d’environnement frontend local :

~~~bash
cd frontend
cp .env.example .env
~~~

- N’ajoutez jamais de clé Stripe secrète dans les variables d’environnement frontend.
- Le frontend appelle uniquement le backend pour créer une session Stripe Checkout.

## Variables d’environnement

Chaque développeur doit créer son propre fichier local `backend/.env` :

~~~bash
cd backend
cp .env.example .env
~~~

Le fichier `backend/.env` contient des informations privées propres à chaque environnement local.

- Il ne doit jamais être ajouté à Git.
- Il ne doit jamais être poussé sur GitHub.
- Le fichier `backend/.env.example` doit contenir uniquement des valeurs fictives ou des placeholders.

### Variables attendues

Les noms de variables documentés dans `backend/.env.example` sont les suivants :

~~~env
# Django
DJANGO_SECRET_KEY=change-me-in-local-env
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL
POSTGRES_DB=probiopredict_db
POSTGRES_USER=probiopredict_user
POSTGRES_PASSWORD=your-local-postgresql-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# CORS et CSRF
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173

# URLs de l'application
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://127.0.0.1:8000

# JWT
JWT_ACCESS_TOKEN_MINUTES=15
JWT_REFRESH_TOKEN_DAYS=7
JWT_ROTATE_REFRESH_TOKENS=False
JWT_BLACKLIST_AFTER_ROTATION=False

# Stripe
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
STRIPE_PRICE_PRO=price_replace_me_pro
STRIPE_PRICE_LAB=price_replace_me_lab

# Limites des plans
PREDICTION_FREE_PLAN_LIMIT=3
PREDICTION_PRO_PLAN_LIMIT=100
PREDICTION_LAB_PLAN_LIMIT=0

# Email
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
EMAIL_USE_TLS=False
EMAIL_USE_SSL=False
DEFAULT_FROM_EMAIL=no-reply@probiopredict.local
SERVER_EMAIL=no-reply@probiopredict.local
~~~

### Règles de sécurité importantes

- Ne placez jamais une vraie valeur `DJANGO_SECRET_KEY` dans Git.
- Ne placez jamais un vrai mot de passe PostgreSQL dans Git.
- Ne placez jamais une vraie valeur `STRIPE_SECRET_KEY` dans Git.
- Ne placez jamais une vraie valeur `STRIPE_WEBHOOK_SECRET` dans Git.
- Ne placez jamais d’identifiants SMTP dans Git.
- La clé `STRIPE_SECRET_KEY` doit rester exclusivement côté backend.

## Configuration de Stripe

ProBioPredict utilise actuellement Stripe en environnement de test.

### Création des produits et prix Stripe

Dans le tableau de bord Stripe en mode test, créez deux prix récurrents :

- un prix pour le plan **Pro** ;
- un prix pour le plan **Lab**.

Copiez les identifiants de type **Price ID**, et non les identifiants de produit.

Ajoutez-les à votre fichier privé `backend/.env` :

~~~env
STRIPE_PRICE_PRO=price_replace_with_your_pro_price_id
STRIPE_PRICE_LAB=price_replace_with_your_lab_price_id
~~~

Ajoutez également votre clé Stripe de test dans `backend/.env` :

~~~env
STRIPE_SECRET_KEY=sk_test_replace_with_your_test_secret_key
~~~

- Ne placez jamais cette clé dans le frontend.
- Ne placez jamais cette clé dans un commit, une capture d’écran ou une issue publique.

Pour le développement local, utilisez les URLs suivantes :

~~~env
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://127.0.0.1:8000
~~~

Le backend configure les redirections Stripe Checkout vers :

~~~text
http://localhost:5173/billing/success
http://localhost:5173/billing/cancel
~~~

### Stripe CLI et webhooks locaux

Ouvrez le **Terminal 3**.

Connectez Stripe CLI :

~~~bash
stripe login
~~~

Lancez le transfert des webhooks vers Django :

~~~bash
stripe listen --forward-to 127.0.0.1:8000/api/billing/webhook/
~~~

Stripe CLI affiche une clé de signature semblable à :

~~~text
whsec_...
~~~

Copiez cette valeur dans votre fichier privé `backend/.env` :

~~~env
STRIPE_WEBHOOK_SECRET=whsec_replace_with_your_stripe_cli_secret
~~~

Après avoir modifié `STRIPE_WEBHOOK_SECRET`, redémarrez le serveur Django :

~~~bash
python manage.py runserver
~~~

L’endpoint webhook local est :

~~~text
POST /api/billing/webhook/
~~~

Le backend vérifie la signature Stripe avant toute mise à jour de l’abonnement local.

## Exécution du projet

### Terminal 1 — Backend Django

~~~bash
cd ProBioPredict/backend
source venv/bin/activate
python manage.py runserver
~~~

### Terminal 2 — Frontend React

~~~bash
cd ProBioPredict/frontend
npm run dev
~~~

### Terminal 3 — Stripe CLI

Ce terminal est nécessaire uniquement pour tester Stripe Checkout et les webhooks locaux.

~~~bash
stripe login
stripe listen --forward-to 127.0.0.1:8000/api/billing/webhook/
~~~

### Ordre conseillé de lancement

- Démarrez PostgreSQL.
- Démarrez le backend Django.
- Démarrez Stripe CLI si vous testez les paiements ou les webhooks.
- Copiez la valeur `whsec_...` affichée par Stripe CLI dans `backend/.env`.
- Redémarrez Django après avoir modifié `STRIPE_WEBHOOK_SECRET`.
- Démarrez le frontend React.
- Ouvrez l’URL Vite dans votre navigateur.

Stripe CLI n’est pas nécessaire pour tester les fonctionnalités de prédiction sans paiement.

## Utilisation de l’application

### Création d’un compte

- Ouvrez l’application frontend.
- Accédez à la page **Register**.
- Créez un compte avec une adresse email et un mot de passe valides.
- Le backend crée un abonnement Free pour le nouvel utilisateur.

### Connexion

- Accédez à la page **Login**.
- Saisissez vos identifiants.
- Le frontend conserve les tokens JWT d’accès et de rafraîchissement.
- Les routes protégées deviennent accessibles.

### Téléversement d’un fichier CSV

Accédez à la page de prédiction et importez un fichier CSV contenant les colonnes attendues :

~~~text
sequence_id,truncated_dna
sample_001,ACTG...
sample_002,CGTA...
~~~

Le backend vérifie :

- la présence du fichier ;
- le format CSV ;
- les colonnes attendues ;
- les types de fichiers autorisés ;
- la taille du fichier ;
- les contraintes sur les lignes ;
- la validité des séquences ADN.

Les séquences validées sont ensuite traitées par le pipeline d’inférence TensorFlow Lite.

### Consultation des résultats

Après une prédiction, l’utilisateur peut :

- consulter la classification et les scores de confiance ;
- accéder à l’historique ;
- ouvrir les détails d’une prédiction ;
- épingler ou désépingler une prédiction ;
- supprimer une prédiction ;
- télécharger ou exporter les résultats via l’interface ;
- consulter les dernières activités dans le Dashboard.

### Souscription à un plan payant

- Accédez à la page **Premium**.
- Sélectionnez le plan Pro ou Lab.
- Le frontend envoie une requête authentifiée au backend.

~~~text
POST /api/billing/create-checkout-session/
~~~

- Django crée la session Stripe Checkout.
- Le frontend redirige le navigateur avec l’URL `checkout_url` renvoyée par le backend.
- Effectuez le paiement de test.
- Stripe transmet les événements au backend via Stripe CLI.
- Django vérifie la signature du webhook.
- Django met à jour l’objet `UserSubscription`.
- Le Dashboard affiche le plan et la limite renvoyés par le backend.

Pour les paiements de test Stripe, utilisez la carte de test standard :

~~~text
Numéro de carte : 4242 4242 4242 4242
Date d'expiration : toute date future
CVC : toute valeur valide
Code postal : toute valeur valide
~~~

Utilisez uniquement des données de test avec Stripe en mode test.

## Fonctionnement de la prédiction ML

Le projet utilise un véritable pipeline d’inférence TensorFlow Lite.

Le service principal se trouve dans :

~~~text
backend/predictions/services.py
~~~

Le flux de prédiction est le suivant :

~~~text
Téléversement CSV
  → Validation CSV
  → Lignes ADN validées
  → backend/predictions/services.py
  → run_inference()
  → ml_engine.predict.predict_from_sequence()
  → Inférence TensorFlow Lite
  → Résultat probiotique ou non probiotique
  → Score de confiance
  → Stockage PostgreSQL
~~~

La fonction `run_inference()` normalise les séquences avant l’appel au modèle.

Un fichier CSV peut contenir plusieurs séquences. L’application enregistre :

- un objet `Prediction` pour le traitement global ;
- plusieurs objets `PredictionResult`, un par séquence analysée.

## Abonnements Free, Pro et Lab

### Plan Free

Le plan Free est attribué par défaut aux nouveaux utilisateurs.

~~~text
Limite : 3 prédictions
~~~

### Plan Pro

Le plan Pro est destiné à une utilisation régulière ou avancée.

~~~text
Limite : 100 prédictions
~~~

### Plan Lab

Le plan Lab est prévu pour les équipes, les chercheurs et les laboratoires.

~~~text
Limite : illimitée lorsque PREDICTION_LAB_PLAN_LIMIT=0
~~~

### Source de vérité côté backend

Le frontend ne décide jamais du statut Premium.

Le cycle d’abonnement est le suivant :

- Le frontend demande une session Stripe Checkout.
- Stripe traite le paiement.
- Stripe envoie un événement webhook signé.
- Django vérifie la signature.
- Django met à jour la souscription locale.
- Le frontend relit les données utilisateur ou du Dashboard depuis le backend.

Une redirection vers `/billing/success` ne suffit pas à elle seule pour activer un plan Premium.

## Principaux endpoints de l’API

### Authentification

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Crée un compte utilisateur. |
| `POST` | `/api/auth/login/` | Connecte l’utilisateur et retourne les tokens JWT. |
| `GET` | `/api/auth/me/` | Retourne l’utilisateur authentifié et son abonnement. |
| `POST` | `/api/auth/token/refresh/` | Rafraîchit le token JWT d’accès. |
| `POST` | `/api/token/refresh/` | Endpoint global de rafraîchissement JWT. |

### Prédictions

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/api/predictions/upload/` | Téléverse un CSV et exécute l’inférence. |
| `GET` | `/api/predictions/history/` | Retourne l’historique des prédictions. |
| `GET` | `/api/predictions/<prediction_id>/` | Retourne le détail d’une prédiction. |
| `PATCH` | `/api/predictions/<prediction_id>/pin/` | Épingle ou désépingle une prédiction. |
| `DELETE` | `/api/predictions/<prediction_id>/delete/` | Supprime une prédiction. |
| `GET` | `/api/predictions/dashboard-summary/` | Retourne les données du Dashboard et l’usage du plan. |
| `POST` | `/api/predictions/send-result-email/` | Demande l’envoi des résultats par email. |
| `POST` | `/api/predictions/predict/` | Soumet une prédiction directe à partir d’une séquence. |

### Facturation

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/billing/subscription/` | Retourne l’abonnement de l’utilisateur authentifié. |
| `POST` | `/api/billing/create-checkout-session/` | Crée une session Stripe Checkout pour Pro ou Lab. |
| `POST` | `/api/billing/webhook/` | Reçoit les événements Stripe signés et vérifiés. |

## Sécurité

### Authentification et autorisation

- Tokens JWT d’accès et de rafraîchissement.
- Routes frontend protégées.
- Endpoints authentifiés pour les ressources utilisateur.
- Requêtes de prédictions limitées à leur propriétaire.
- Création de session Stripe Checkout réservée aux utilisateurs authentifiés.

### Sécurité Stripe

- Clé Stripe secrète uniquement dans les variables d’environnement backend.
- Sélection des Stripe Price IDs par le backend.
- Le frontend transmet uniquement le plan souhaité : `pro` ou `lab`.
- Le frontend ne reçoit aucune clé Stripe secrète.
- Le frontend n’active jamais Premium localement.
- Les webhooks Stripe utilisent `STRIPE_WEBHOOK_SECRET`.
- Les modifications d’abonnement sont déclenchées par des événements Stripe vérifiés.

### Validation des fichiers et entrées

- Validation des fichiers CSV.
- Validation des colonnes attendues.
- Restrictions sur les types et tailles de fichiers.
- Validation des séquences ADN.
- Application côté serveur des limites de prédiction selon l’abonnement.

### Sécurité de configuration

- `backend/.env` est local et ne doit jamais être commité.
- `backend/.env.example` contient uniquement des placeholders.
- Une configuration de production devra activer HTTPS et les paramètres de sécurité appropriés.

## Tests et vérifications

Le projet contient des dépendances de test et des fichiers de tests liés aux prédictions.

Il ne faut cependant pas présenter le projet comme disposant d’une couverture de tests automatisés complète pour toutes les fonctionnalités, notamment Stripe et les webhooks.

### Vérifications backend

Depuis le dossier backend :

~~~bash
cd backend
source venv/bin/activate
python manage.py test
~~~

### Vérifications frontend

Depuis le dossier frontend :

~~~bash
cd frontend
npm run lint
npm run build
~~~

### Vérifications manuelles recommandées

#### Authentification

- Créer un utilisateur.
- Se connecter.
- Vérifier que les routes protégées nécessitent une authentification.
- Vérifier l’endpoint `/api/auth/me/`.

#### Prédictions

- Importer un CSV valide.
- Vérifier le rejet d’un CSV avec des colonnes invalides.
- Vérifier la génération des résultats.
- Vérifier l’affichage des scores de confiance.
- Vérifier l’historique.
- Vérifier le pin et unpin.
- Vérifier la suppression.
- Vérifier la mise à jour de l’usage dans le Dashboard.

#### Stripe

- Démarrer Django.
- Démarrer le frontend.
- Démarrer Stripe CLI.
- Copier la clé `whsec_...` dans `backend/.env`.
- Redémarrer Django.
- Démarrer Stripe Checkout depuis la page Premium.
- Utiliser la carte de test `4242 4242 4242 4242`.
- Vérifier les événements reçus par Stripe CLI.
- Vérifier les réponses HTTP `200` du webhook Django.
- Vérifier dans Django Admin le plan, le statut et les identifiants Stripe.
- Actualiser le Dashboard.
- Vérifier l’affichage du plan actif et de la limite correspondante.

## Limites actuelles

- L’application n’est pas encore déployée en production.
- Stripe est actuellement utilisé en environnement de test.
- Les webhooks Stripe locaux nécessitent Stripe CLI.
- L’envoi d’email peut fonctionner avec le backend console Django selon la configuration.
- Une configuration SMTP de production n’est pas confirmée comme finalisée.
- Le projet contient des tests, mais une couverture automatisée complète du frontend, du backend, de Stripe et des webhooks n’est pas confirmée.
- Les mécanismes de déploiement, de monitoring, de sauvegarde et d’automatisation CI/CD ne sont pas documentés comme finalisés.
- Les paramètres de sécurité de production devront être vérifiés avant déploiement.

## Améliorations futures

- Déploiement en production.
- Configuration Docker et Docker Compose.
- Pipeline CI pour les tests, le lint et le build.
- Extension de la couverture de tests unitaires et d’intégration.
- Tests dédiés à Stripe Checkout et aux webhooks.
- Meilleure gestion de l’attente et des relances de webhook.
- Intégration du Stripe Customer Portal.
- Gestion des changements et annulations d’abonnement.
- Configuration SMTP réelle.
- Réinitialisation de mot de passe.
- Vérification d’adresse email.
- Statistiques supplémentaires sur le Dashboard.
- Tâches asynchrones pour les traitements de prédiction longs.
- Monitoring et suivi des erreurs.
- Gestion des versions du modèle ML.
- Gestion d’équipes et de rôles pour les laboratoires.
- Options d’export supplémentaires.

## Contribution et utilisation de Git

Le projet est en cours de développement.

Avant toute modification, vérifiez l’état du dépôt :

~~~bash
git status
git log --oneline --decorate -n 10
~~~

Pour récupérer les modifications distantes lorsqu’un remote est configuré :

~~~bash
git pull
~~~

Pour examiner les modifications locales avant un commit :

~~~bash
git diff
git status
~~~

Une pratique professionnelle recommandée pour la suite est :

- Créer une branche par fonctionnalité ou correction.
- Utiliser des messages de commit descriptifs.
- Exécuter les vérifications disponibles avant de commiter.
- Relire les changements avant de pousser.
- Utiliser des pull requests pour la revue de code lorsque le flux de collaboration le permet.
- Exclure les secrets, fichiers `.env`, environnements virtuels et identifiants sensibles de Git.

Exemples de noms de branches :

~~~text
feature/stripe-customer-portal
fix/webhook-subscription-status
test/billing-webhook-coverage
docs/deployment-guide
~~~

Exemples de messages de commit :

~~~text
feat: add Stripe Checkout session creation
fix: handle Stripe subscription item price extraction
test: add billing webhook signature tests
docs: document local Stripe CLI setup
~~~

Ne commitez jamais les éléments suivants :

~~~text
backend/.env
frontend/.env
venv/
node_modules/
clés Stripe réelles
mots de passe de base de données
clés Django secrètes
~~~

## Auteurs

- **Ines Oubabas** : développement full-stack.
- **Aicha Chouikhi** : machine learning.

## Licence

Aucune licence n’est actuellement confirmée pour ce projet.

