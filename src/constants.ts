/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- PHYSICS SIMULATION CONSTANTS ---
export const GRAVITY_STRENGTH = 0.01;
export const REPULSION_STRENGTH = 100; // Increased for more tangible push
export const DAMPING_FACTOR = 0.9;
export const EXPANDED_REPULSION_MULTIPLIER = 8; // Increased for more space

// --- NODE APPEARANCE CONSTANTS ---
export const MIN_NODE_RADIUS = 45;
export const MAX_NODE_RADIUS = 90;

// --- COLLISION RESOLUTION CONSTANTS ---
export const COLLISION_ITERATIONS = 5;
export const BOUNDARY_BOUNCE_FACTOR = -0.5;

// --- UI ANIMATION CONSTANTS ---
export const PLACEHOLDER_INTERVAL_MS = 3000;