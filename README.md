# a-just
Dépôt de code du projet A-JUST du Ministère de la Justice


# Mode dev
1. Initialisation des variables d'environnements

2. Initialisation de la BDD
```
// copie des fichiers d'environement
cp .env.exemple .env
cp api/.env.example api/.env

// démarrage du docker postgress
npm run db:build
npm run db:start
```

3. Démarrage du serveur
```
cd api
npm i
npm run start

accéssible http://localhost:8080/api
```

4. Démarrage du front
```
cd front
npm i
npm run start

accéssible http://localhost:4200
```