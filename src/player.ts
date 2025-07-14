/**
 * Type definitions for the Monopoly service
 *
 * @author: kvlinden
 * @date: Fall, 2025
 */

export interface Player {
    id: number;
    email: string;
    name: string;
}

export interface PlayerInput {
    email: string;
    name: string;
}
