/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getState, setState } from './state';
import * as dom from './dom';
import {
  GRAVITY_STRENGTH,
  REPULSION_STRENGTH,
  DAMPING_FACTOR,
  MIN_NODE_RADIUS,
  MAX_NODE_RADIUS,
  EXPANDED_REPULSION_MULTIPLIER,
  COLLISION_ITERATIONS,
  BOUNDARY_BOUNCE_FACTOR
} from './constants';
import type { CardNode, Flashcard } from './types';

// Format card term to style parentheses content differently
function formatCardTerm(term: string): string {
  // Match pattern like "한국어 (Korean)" or "프로그래밍 (Programming)"
  const match = term.match(/^(.+?)\s*\((.+?)\)$/);
  
  if (match) {
    const mainTerm = match[1].trim();
    const parenthesesContent = match[2].trim();
    return `${mainTerm}<br><span class="term-translation">(${parenthesesContent})</span>`;
  }
  
  return term;
}

// Hexagonal grid positioning
interface HexPosition {
  x: number;
  y: number;
  q: number;
  r: number;
}

/** Calculates hexagonal grid positions */
const calculateHexPositions = (count: number, containerWidth: number, containerHeight: number, nodeRadius: number): HexPosition[] => {
  const positions: HexPosition[] = [];
  const hexSpacing = nodeRadius * 2.2; // Spacing between hexagons
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  
  // Start with center position
  if (count > 0) {
    positions.push({ x: centerX, y: centerY, q: 0, r: 0 });
  }
  
  // Add positions in hexagonal rings around center
  let ring = 1;
  let addedCount = 1;
  
  while (addedCount < count && ring < 10) {
    for (let i = 0; i < 6; i++) { // 6 sides of hexagon
      for (let j = 0; j < ring; j++) {
        if (addedCount >= count) break;
        
        const angle = (i * 60 + j * (60 / ring)) * Math.PI / 180;
        const distance = ring * hexSpacing;
        const x = centerX + distance * Math.cos(angle);
        const y = centerY + distance * Math.sin(angle);
        
        // Calculate hex coordinates
        const q = Math.round(x / (hexSpacing * 3/4));
        const r = Math.round((y - x * Math.tan(Math.PI/6)) / hexSpacing);
        
        positions.push({ x, y, q, r });
        addedCount++;
      }
      if (addedCount >= count) break;
    }
    ring++;
  }
  
  return positions.slice(0, count);
};

/** Stops the physics simulation loop */
export const stopSimulation = () => {
  const { animationFrameId } = getState();
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    setState({ animationFrameId: null });
  }
};

let isDragging = false;
let draggedNode: CardNode | null = null;
let dragOffset = { x: 0, y: 0 };

/** Starts the physics simulation loop */
export const startSimulation = () => {
  stopSimulation();
  let lastTime = 0;

  const run = (currentTime: number) => {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2); // Normalize to 60fps, cap at 2x
    
    updateNodePositions(deltaTime);
    renderNodes();

    lastTime = currentTime;
    const newAnimationFrameId = requestAnimationFrame(run);
    setState({ animationFrameId: newAnimationFrameId });
  };
  const animationFrameId = requestAnimationFrame(run);
  setState({ animationFrameId });
};

/** Resolves collisions between nodes with gentler separation */
const resolveCollisions = () => {
  const { cardNodes } = getState();
  for (let i = 0; i < cardNodes.length; i++) {
    for (let j = i + 1; j < cardNodes.length; j++) {
      const nodeA = cardNodes[i];
      const nodeB = cardNodes[j];

      // Skip if either node is being dragged
      if (nodeA.isDragging || nodeB.isDragging) continue;

      const dx = nodeA.x - nodeB.x;
      const dy = nodeA.y - nodeB.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const minDistance = nodeA.radius + nodeB.radius + 5; // Add small buffer

      if (distance < minDistance) {
        const overlap = minDistance - distance;
        const separationForce = 0.6; // Gentler separation
        const offsetX = (dx / distance) * overlap * separationForce;
        const offsetY = (dy / distance) * overlap * separationForce;

        if (nodeA.isExpanded) {
          // Expanded node pushes others away
          nodeB.x -= offsetX;
          nodeB.y -= offsetY;
        } else if (nodeB.isExpanded) {
          nodeA.x += offsetX;
          nodeA.y += offsetY;
        } else {
          // Both nodes move apart equally
          nodeA.x += offsetX / 2;
          nodeA.y += offsetY / 2;
          nodeB.x -= offsetX / 2;
          nodeB.y -= offsetY / 2;
        }
      }
    }
  }
};

/** Updates node positions based on hexagonal physics */
const updateNodePositions = (deltaTime: number) => {
  const { cardNodes } = getState();
  const { width, height } = dom.flashcardsContainer.getBoundingClientRect();
  
  // Calculate target positions for hexagonal layout
  if (!cardNodes.length) return;
  
  const avgRadius = cardNodes.reduce((sum, node) => sum + node.radius, 0) / cardNodes.length;
  const hexPositions = calculateHexPositions(cardNodes.length, width, height, avgRadius);
  
  cardNodes.forEach((node, index) => {
    if (node.isDragging) return; // Skip dragged nodes
    
    const targetPos = hexPositions[index] || hexPositions[0];
    const targetX = targetPos.x;
    const targetY = targetPos.y;
    
    // Calculate distance to target position
    const distanceToTarget = Math.sqrt(Math.pow(node.x - targetX, 2) + Math.pow(node.y - targetY, 2));
    
    // Only apply force if significantly away from target (reduces jittering)
    if (distanceToTarget > 1) {
      // Smooth movement towards target position
      const springForce = 0.08; // Reduced force for less movement
      const dampingForce = 0.92; // Increased damping for stability
      
      if (node.isExpanded) {
        // Expanded nodes stay closer to center with stronger force
        const centerX = width / 2;
        const centerY = height / 2;
        node.vx += (centerX - node.x) * springForce * 4 * deltaTime;
        node.vy += (centerY - node.y) * springForce * 4 * deltaTime;
      } else {
        // Regular nodes move to hexagonal positions
        node.vx += (targetX - node.x) * springForce * deltaTime;
        node.vy += (targetY - node.y) * springForce * deltaTime;
      }
      
      // Apply damping
      node.vx *= dampingForce;
      node.vy *= dampingForce;
      
      // Update position
      node.x += node.vx * deltaTime;
      node.y += node.vy * deltaTime;
    } else {
      // Snap to exact position and stop velocity if very close
      node.x = targetX;
      node.y = targetY;
      node.vx *= 0.8; // Gradually reduce any remaining velocity
      node.vy *= 0.8;
    }
  });

  // Collision resolution with reduced iterations for smoother movement - only if needed
  let needsCollisionCheck = false;
  for (let i = 0; i < cardNodes.length && !needsCollisionCheck; i++) {
    for (let j = i + 1; j < cardNodes.length; j++) {
      const nodeA = cardNodes[i];
      const nodeB = cardNodes[j];
      const dx = nodeA.x - nodeB.x;
      const dy = nodeA.y - nodeB.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = nodeA.radius + nodeB.radius + 3;
      
      if (distance < minDistance) {
        needsCollisionCheck = true;
        break;
      }
    }
  }
  
  // Only run collision detection if there are actual collisions
  if (needsCollisionCheck) {
    resolveCollisions();
  }
  
  // Boundary constraints
  cardNodes.forEach(node => {
    if (node.x - node.radius < 0) { 
      node.x = node.radius; 
      node.vx *= -0.3; 
    }
    if (node.x + node.radius > width) { 
      node.x = width - node.radius; 
      node.vx *= -0.3; 
    }
    if (node.y - node.radius < 0) { 
      node.y = node.radius; 
      node.vy *= -0.3; 
    }
    if (node.y + node.radius > height) { 
      node.y = height - node.radius; 
      node.vy *= -0.3; 
    }
  });
};

/** Renders nodes on the screen based on their state */
const renderNodes = () => {
  const { cardNodes } = getState();
  cardNodes.forEach(node => {
    node.element.style.transform = `translate(${node.x - node.radius}px, ${node.y - node.radius}px)`;
    node.element.style.zIndex = node.isExpanded ? '100' : `${Math.round(node.importance)}`;
  });
};

/** Toggles a node's expanded state */
export const toggleNodeExpansion = (nodeToToggle: CardNode) => {
  const { cardNodes } = getState();
  cardNodes.forEach(node => {
    if (node.id !== nodeToToggle.id && node.isExpanded) {
      node.isExpanded = false;
      node.element.classList.remove('expanded');
    }
  });

  nodeToToggle.isExpanded = !nodeToToggle.isExpanded;
  nodeToToggle.element.classList.toggle('expanded');
  
  if (nodeToToggle.isExpanded) startSimulation();
};

/** Handles mouse/touch interactions for dragging */
const setupDragHandlers = (node: CardNode) => {
  const startDrag = (clientX: number, clientY: number) => {
    isDragging = true;
    draggedNode = node;
    node.isDragging = true;
    
    const rect = dom.flashcardsContainer.getBoundingClientRect();
    dragOffset.x = clientX - rect.left - node.x;
    dragOffset.y = clientY - rect.top - node.y;
    
    // Stop node's current velocity
    node.vx = 0;
    node.vy = 0;
    
    dom.flashcardsContainer.style.cursor = 'grabbing';
  };

  const endDrag = () => {
    if (draggedNode) {
      draggedNode.isDragging = false;
      draggedNode = null;
    }
    isDragging = false;
    dom.flashcardsContainer.style.cursor = '';
  };

  // Mouse events
  node.element.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  });

  // Touch events for mobile
  node.element.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  });

  // Add hover cursor
  node.element.style.cursor = 'grab';
};

// Global mouse/touch move and end handlers
document.addEventListener('mousemove', (e) => {
  if (isDragging && draggedNode) {
    const rect = dom.flashcardsContainer.getBoundingClientRect();
    draggedNode.x = e.clientX - rect.left - dragOffset.x;
    draggedNode.y = e.clientY - rect.top - dragOffset.y;
  }
});

document.addEventListener('mouseup', () => {
  if (isDragging && draggedNode) {
    draggedNode.isDragging = false;
    draggedNode = null;
  }
  isDragging = false;
  dom.flashcardsContainer.style.cursor = '';
});

document.addEventListener('touchmove', (e) => {
  if (isDragging && draggedNode) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = dom.flashcardsContainer.getBoundingClientRect();
    draggedNode.x = touch.clientX - rect.left - dragOffset.x;
    draggedNode.y = touch.clientY - rect.top - dragOffset.y;
  }
});

document.addEventListener('touchend', () => {
  if (isDragging && draggedNode) {
    draggedNode.isDragging = false;
    draggedNode = null;
  }
  isDragging = false;
  dom.flashcardsContainer.style.cursor = '';
});

/** Creates card nodes with hexagonal positioning and drag functionality */
export const createCardNodes = (flashcards: Flashcard[]) => {
  stopSimulation();
  dom.flashcardsContainer.innerHTML = '';
  const newCardNodes: CardNode[] = [];
  const { width, height } = dom.flashcardsContainer.getBoundingClientRect();
  
  // First, create all nodes to calculate the actual average radius
  const tempNodes: CardNode[] = flashcards.map((card, index) => ({
    ...card,
    id: index,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: MIN_NODE_RADIUS + (MAX_NODE_RADIUS - MIN_NODE_RADIUS) * ((card.importance - 1) / 9),
    element: document.createElement('div'),
    isExpanded: false,
    isDragging: false
  }));
  
  // Calculate average radius from actual nodes (same as in updateNodePositions)
  const avgRadius = tempNodes.reduce((sum, node) => sum + node.radius, 0) / tempNodes.length;
  const hexPositions = calculateHexPositions(flashcards.length, width, height, avgRadius);

  flashcards.forEach((card, index) => {
    const radius = MIN_NODE_RADIUS + (MAX_NODE_RADIUS - MIN_NODE_RADIUS) * ((card.importance - 1) / 9);
    const initialPos = hexPositions[index] || { x: width/2, y: height/2, q: 0, r: 0 };
    
    const node: CardNode = {
      ...card,
      id: index,
      x: initialPos.x, // This now matches exactly with updateNodePositions calculation
      y: initialPos.y,
      vx: 0,
      vy: 0,
      radius: radius,
      element: document.createElement('div'),
      isExpanded: false,
      isDragging: false
    };

    node.element.className = 'flashcard';
    node.element.style.width = `${radius * 2}px`;
    node.element.style.height = `${radius * 2}px`;
    node.element.dataset.nodeId = `${index}`;
    
    // Process term to style parentheses content differently
    const processedTerm = formatCardTerm(card.term);
    
    node.element.innerHTML = `
      <div class="term">${processedTerm}</div>
      <div class="definition">${card.definition}</div>
      <button class="drill-down-button" title="Explore this topic">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </button>
    `;
    
    // Setup drag interaction
    setupDragHandlers(node);
    
    dom.flashcardsContainer.appendChild(node.element);
    newCardNodes.push(node);
  });
  
  setState({ cardNodes: newCardNodes });
  
  // Initial render without physics to show cards in final positions immediately
  renderNodes();
  
  // Start simulation for hover effects and dragging, but with minimal movement
  startSimulation();
};