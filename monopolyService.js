/**
 * This module implements a REST-inspired web service for the Monopoly DB.
 * The database is hosted on PostgreSQL for Azure. Implementation notes:
 *
 * - Currently, the service supports the Player table only.
 *
 * - The service assumes that the database connection strings and the server
 * mode are set in environment variables. See the DB_* variables used by
 * pg-promise.
 *
 * - To guard against SQL injection attacks, this code uses pg-promise's built-in
 * variable escaping. This prevents a client from issuing this SQL-injection URL:
 *     https://cs262-webservice.azurewebsites.net//players/1%3BDELETE%20FROM%20PlayerGame%3BDELETE%20FROM%20Player
 * which would delete records in the PlayerGame and then the Player tables.
 * In particular, we don't use JS template strings because this doesn't filter
 * client-supplied values properly.
 *
 * - The endpoints call `next(err)` to handle errors so that the service doesn't
 * crash. This initiates the default error handling middleware, which logs full
 * error details to the server-side console and returns uninformative HTTP 500
 * responses to clients. This makes the service a bit more secure (because it
 * doesn't reveal database details to clients), but also makes it more difficult
 * for API users (because they don't get useful error messages).
 *
 * - The DELETE endpoint implements a "hard" delete, which actually deletes the
 * record from the database. In production systems, it's common to implement
 * "soft" deletes instead, where a record is marked as deleted/archived but is
 * not actually removed from the database.
 *
 * @author: kvlinden
 * @date: Summer, 2020
 * @date: Fall, 2025 (updated Node version, JS->TSX, master->main)
 */

// Set up the database connection.
const pgp = require('pg-promise')();

const db = pgp({
    host: process.env.DB_SERVER,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Configure the server and its routes.

const express = require('express');

const app = express();
const port = process.env.PORT || 3000;
const router = express.Router();
router.use(express.json());

router.get('/', readHelloMessage);
router.get('/players', readPlayers);
router.get('/players/:id', readPlayer);
router.put('/players/:id', updatePlayer);
router.post('/players', createPlayer);
router.delete('/players/:id', deletePlayer);

app.use(router);

app.listen(port, () => console.log(`Listening on port ${port}`));

// Implement the CRUD operations.

function returnDataOr404(response, data) {
    if (data == null) {
        response.sendStatus(404);
    } else {
        response.send(data);
    }
}

function readHelloMessage(req, res) {
    res.send('Hello, CS 262 Monopoly service!');
}

function readPlayers(request, response, next) {
    db.manyOrNone('SELECT * FROM Player')
        .then((data) => {
            // data is a list, never null, so returnDataOr404 isn't needed.
            response.send(data);
        })
        .catch((error) => {
            next(error);
        });
}

function readPlayer(request, response, next) {
    db.oneOrNone('SELECT * FROM Player WHERE id=${id}', request.params)
        .then((data) => {
            returnDataOr404(response, data);
        })
        .catch((error) => {
            next(error);
        });
}

function updatePlayer(request, response, next) {
    db.oneOrNone('UPDATE Player SET email=${body.email}, name=${body.name} WHERE id=${params.id} RETURNING id', request)
        .then((data) => {
            returnDataOr404(response, data);
        })
        .catch((error) => {
            next(error);
        });
}

function createPlayer(request, response, next) {
    db.one('INSERT INTO Player(email, name) VALUES (${email}, ${name}) RETURNING id', request.body)
        .then((data) => {
            // New players are always created, so returnDataOr404 isn't needed.
            response.send(data);
        })
        .catch((error) => {
            next(error);
        });
}

function deletePlayer(request, response, next) {
    db.oneOrNone('DELETE FROM Player WHERE id=${id} RETURNING id', request.params)
        .then((data) => {
            returnDataOr404(response, data);
        })
        .catch((error) => {
            next(error);
        });
}
