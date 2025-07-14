/**
 * This module implements a REST-inspired web service for the Monopoly DB.
 * The database is hosted on PostgreSQL for Azure. Notes:
 *
 * - Currently, this service supports the Player table only.
 *
 * - This service is written in TypeScript and uses Node type-stripping, which
 * is experimental, but simple (see: https://nodejs.org/en/learn/typescript/run-natively).
 * To run static type check, run `npm run type-check`.
 *
 * - The service assumes that the database connection strings and the server
 * mode are set in environment variables. See the DB_* variables used by
 * pgPromise.
 *
 * - To guard against SQL injection attacks, this code uses pgPromise's built-in
 * variable escaping. This prevents a client from issuing this SQL-injection URL:
 *     https://cs262.azurewebsites.net/players/1%3BDELETE%20FROM%20PlayerGame%3BDELETE%20FROM%20Player
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
 * To execute locally, run the following in Linux:
 *      source .env
 *      npm start
 *
 * @author: kvlinden
 * @date: Summer, 2020
 * @date: Fall, 2025 (updated to JS->TS, Node version, and master->main repo)
 */

import express from 'express';
import pgPromise from 'pg-promise';

// Import types for compile-time checking.
import type { Request, Response, NextFunction } from 'express';
import type { Player, PlayerInput } from './player.js';

// Set up the database
const db = pgPromise()({
    host: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT as string) || 5432,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Configure the server and its routes
const app = express();
const port: number = parseInt(process.env.PORT as string) || 3000;
const router = express.Router();

router.use(express.json());
router.get('/', readHello);
router.get('/players', readPlayers);
router.get('/players/:id', readPlayer);
router.put('/players/:id', updatePlayer);
router.post('/players', createPlayer);
router.delete('/players/:id', deletePlayer);

app.use(router);

app.listen(port, (): void => {
    console.log(`Listening on port ${port}`);
});

// Utility functions

// This function returns 404 errors for database return data that could be null.
function returnDataOr404(response: Response, data: unknown): void {
    if (data == null) {
        response.sendStatus(404);
    } else {
        response.send(data);
    }
}

// CRUD functions

function readHello(_request: Request, response: Response): void {
    response.send('Hello, CS 262 Monopoly service!');
}

function readPlayers(_request: Request, response: Response, next: NextFunction): void {
    db.manyOrNone('SELECT * FROM Player')
        .then((data: Player[]): void => {
            // data is a list, never null, so returnDataOr404 isn't needed.
            response.send(data);
        })
        .catch((error: Error): void => {
            next(error);
        });
}

function readPlayer(request: Request, response: Response, next: NextFunction): void {
    db.oneOrNone('SELECT * FROM Player WHERE id=${id}', request.params)
        .then((data: Player | null): void => {
            returnDataOr404(response, data);
        })
        .catch((error: Error): void => {
            next(error);
        });
}

function updatePlayer(request: Request, response: Response, next: NextFunction): void {
    db.oneOrNone('UPDATE Player SET email=${body.email}, name=${body.name} WHERE id=${params.id} RETURNING id', {
        params: request.params,
        body: request.body as PlayerInput
    })
        .then((data: { id: number } | null): void => {
            returnDataOr404(response, data);
        })
        .catch((error: Error): void => {
            next(error);
        });
}

function createPlayer(request: Request, response: Response, next: NextFunction): void {
    db.one('INSERT INTO Player(email, name) VALUES (${email}, ${name}) RETURNING id',
        request.body as PlayerInput
    )
        .then((data: { id: number }): void => {
            // New players are always created, so returnDataOr404 isn't needed.
            response.send(data);
        })
        .catch((error: Error): void => {
            next(error);
        });
}

function deletePlayer(request: Request, response: Response, next: NextFunction): void {
    db.oneOrNone('DELETE FROM Player WHERE id=${id} RETURNING id', request.params)
        .then((data: { id: number } | null): void => {
            returnDataOr404(response, data);
        })
        .catch((error: Error): void => {
            next(error);
        });
}
