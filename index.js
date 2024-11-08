
// OpenWeatherMap API Key
const OPENWEATHERMAP_API_KEY = '01a9cefb1b65015d398e3a63bb58ef81'; // Replace with your actual API key

let playerHealth = 100; // Starting health

let trainingBall;
let isTraining = false;

// Initialize variables
let map;
let playerMarker;
let targetMarker;
let winMarker; // Marker for the escape point
let nodes = {};
let edges = {};
let currentNodeId;
let targetNodeId;
let winNodeId; // Node ID for the escape point
let loadedAreas = [];
let loadingData = false;
const dataFetchThreshold = 0.002;
let isMoving = false;

// Handpose variables
let videoElement;
let canvasElement;
let ctx;
let handposeModel;
let predictions = [];
let lastMoveTime = 0;

// Game state variables
let opponents = []; // Array to hold opponent objects
let opponentMovementInterval; // Interval ID for opponents' movement
let gameRunning = false; // Game state


// Safe Zone variables
const safeZones = [];
const SAFE_ZONE_RADIUS = 50; // meters
const SAFE_ZONE_DURATION = 10000; // milliseconds

// Collectible variables
const collectibles = [];
const COLLECTIBLE_TYPES = ['speed', 'health', 'invisibility'];

// Constants
const ESCAPE_RADIUS_MILES = 1; // 1 mile radius
const MILES_TO_METERS = 1609.34; // Conversion factor

// Opponent Images Pool
const opponentImages = [
  'images/zomb1.webp',
  'images/zomb2.webp',
  'images/zomb3.png',
  'images/zomb4.png',
  // Add more image paths as needed
];

// Opponent Sounds Pool
const opponentSounds = [
  'sounds/opponents/opponent1.mp3',
  'sounds/opponents/opponent2.mp3',
  'sounds/opponents/opponent3.mp3',
  'sounds/opponents/opponent4.mp3',
  // Add more sound paths as needed
];

// Theme Song
const themeSong = new Audio('sounds/theme.mp3'); // Path to your theme song
themeSong.loop = true;

// Cooldown to prevent rapid movements
const MOVE_COOLDOWN = 500; // milliseconds

// Win condition radius in meters
const WIN_RADIUS = 10; // Adjust as needed

// Collision detection radius in meters
const COLLISION_RADIUS = 10; // Adjust as needed

// Utility function to calculate distance between two coordinates in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // in meters
  return distance;
}


function showTrainingModal() {
    document.getElementById('trainingModal').style.display = 'block';
    isTraining = true;
    trainingBall = document.getElementById('trainingBall');
    setupHandpose(); // Make sure handpose is set up for training
  }
  
  function hideTrainingModal() {
    document.getElementById('trainingModal').style.display = 'none';
    isTraining = false;
    document.getElementById('skipTrainingButton').style.display = 'none';
    document.getElementById('startGameFromTrainingButton').style.display = 'inline-block';
  }
  
  function moveBallInTraining(direction) {
    if (!isTraining) return;
    
    const currentLeft = parseInt(trainingBall.style.left) || 140;
    const currentTop = parseInt(trainingBall.style.top) || 140;
    
    switch(direction) {
      case 'left':
        trainingBall.style.left = Math.max(0, currentLeft - 20) + 'px';
        break;
      case 'right':
        trainingBall.style.left = Math.min(280, currentLeft + 20) + 'px';
        break;
      case 'up':
        trainingBall.style.top = Math.max(0, currentTop - 20) + 'px';
        break;
      case 'down':
        trainingBall.style.top = Math.min(280, currentTop + 20) + 'px';
        break;
    }
  }



function updateHealthDisplay() {
  const healthDisplay = document.getElementById('healthDisplay');
  healthDisplay.textContent = `Health: ${playerHealth}`;
  
  // Change color based on health level
  if (playerHealth > 70) {
    healthDisplay.style.color = 'lime';
  } else if (playerHealth > 30) {
    healthDisplay.style.color = 'yellow';
  } else {
    healthDisplay.style.color = 'red';
  }
}


// Function to create safe zones
function createSafeZones() {
  const numSafeZones = 3; // Adjust as needed
  const nodeIds = Object.keys(nodes);
  for (let i = 0; i < numSafeZones; i++) {
    const randomNodeId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
    const safeZone = {
      lat: nodes[randomNodeId].lat,
      lon: nodes[randomNodeId].lon,
      marker: L.marker([nodes[randomNodeId].lat, nodes[randomNodeId].lon], {
        icon: L.icon({
          iconUrl: 'images/safe-zone.webp', // Replace with your safe zone icon
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map)
    };
    safeZones.push(safeZone);
  }
}

// Function to check if player is in a safe zone
function checkSafeZone() {
  const playerPos = playerMarker.getLatLng();
  for (const safeZone of safeZones) {
    const distance = getDistanceMeters(playerPos.lat, playerPos.lng, safeZone.lat, safeZone.lon);
    if (distance <= SAFE_ZONE_RADIUS) {
      activateSafeZone();
      return;
    }
  }
}

// Function to activate safe zone effects
function activateSafeZone() {
  document.getElementById('status').textContent = 'You entered a Safe Zone! Temporary immunity activated.';
  createParticles(playerMarker.getLatLng().lat, playerMarker.getLatLng().lng, [255, 255, 255], 40); // White particles
  // Implement immunity logic here
  setTimeout(() => {
    document.getElementById('status').textContent = 'Safe Zone effect has worn off.';
    // Remove immunity
  }, SAFE_ZONE_DURATION);
}



// Function to create collectibles
function createCollectibles() {
  const numCollectibles = 5; // Adjust as needed
  const nodeIds = Object.keys(nodes);
  for (let i = 0; i < numCollectibles; i++) {
    const randomNodeId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
    const type = COLLECTIBLE_TYPES[Math.floor(Math.random() * COLLECTIBLE_TYPES.length)];
    const collectible = {
      type: type,
      lat: nodes[randomNodeId].lat,
      lon: nodes[randomNodeId].lon,
      marker: L.marker([nodes[randomNodeId].lat, nodes[randomNodeId].lon], {
        icon: L.icon({
          iconUrl: `images/collectibles/${type}.webp`, // Replace with your collectible icons
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map)
    };
    collectibles.push(collectible);
  }
}

// Function to check if player collected an item
function checkCollectibles() {
  const playerPos = playerMarker.getLatLng();
  for (let i = collectibles.length - 1; i >= 0; i--) {
    const collectible = collectibles[i];
    const distance = getDistanceMeters(playerPos.lat, playerPos.lng, collectible.lat, collectible.lon);
    if (distance <= 5) { // 5 meters collection radius
      activateCollectible(collectible);
      map.removeLayer(collectible.marker);
      collectibles.splice(i, 1);
      return;
    }
  }
}

// Function to activate collectible effects
function activateCollectible(collectible) {
  switch (collectible.type) {
    case 'speed':
      document.getElementById('status').textContent = 'Speed boost activated!';
      createParticles(playerMarker.getLatLng().lat, playerMarker.getLatLng().lng, [255, 255, 0]); // Yellow particles
      // Implement speed boost logic here
      setTimeout(() => {
        document.getElementById('status').textContent = 'Speed boost has worn off.';
      }, 5000);
      break;
    case 'health':
      document.getElementById('status').textContent = 'Health restored!';
      createParticles(playerMarker.getLatLng().lat, playerMarker.getLatLng().lng, [0, 255, 0]); // Green particles
      playerHealth = Math.min(playerHealth + 20, 100); // Restore 20 health, max 100
      updateHealthDisplay();
      break;
    case 'invisibility':
      document.getElementById('status').textContent = 'Temporary invisibility activated!';
      createParticles(playerMarker.getLatLng().lat, playerMarker.getLatLng().lng, [0, 0, 255]); // Blue particles
      // Implement invisibility logic here
      setTimeout(() => {
        document.getElementById('status').textContent = 'Invisibility has worn off.';
      }, 7000);
      break;
  }
}


// Initialize the map function
function initMap(centerCoordinates) {
// Show the map first to ensure it's visible
document.getElementById('map').style.display = 'block';

// Set a higher zoom level for maximum view
map = L.map('map').setView([centerCoordinates.lat, centerCoordinates.lon], 20); // Change zoom level here

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Invalidate map size to fix rendering issues
setTimeout(() => {
  map.invalidateSize();
}, 100);
}

// Fetch street data from OpenStreetMap
function fetchStreetData(bbox, callback) {
  const query = `
    [out:json][timeout:25];
    (
      way["highway"](${bbox.join(',')});
      >;
    );
    out body;
  `;

  fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
  })
  .then(response => response.json())
  .then(data => callback(data))
  .catch(error => {
    console.error('Error fetching OSM data:', error);
    document.getElementById('status').textContent = 'Error fetching map data.';
  });
}

// Check if a point is within a bounding box
function isPointInBBox(lat, lon, bbox) {
  return lat >= bbox[0] && lat <= bbox[2] && lon >= bbox[1] && lon <= bbox[3];
}

// Check if the player is near the edge of the loaded area
function checkPlayerPosition() {
  const playerNode = nodes[currentNodeId];
  const currentBBox = loadedAreas[loadedAreas.length - 1];

  const { lat, lon } = playerNode;
  const buffer = dataFetchThreshold;

  if (
    lat - buffer <= currentBBox[0] ||
    lat + buffer >= currentBBox[2] ||
    lon - buffer <= currentBBox[1] ||
    lon + buffer >= currentBBox[3]
  ) {
    loadAdditionalData(lat, lon);
  }
}

// Load additional data when player nears the edge
function loadAdditionalData(lat, lon) {
  if (loadingData) return;
  loadingData = true;

  const bboxSize = 0.01;
  const bbox = [
    lat - bboxSize / 2,
    lon - bboxSize / 2,
    lat + bboxSize / 2,
    lon + bboxSize / 2,
  ];

  if (loadedAreas.some(area => isBBoxEqual(area, bbox))) {
    loadingData = false;
    return;
  }

  fetchStreetData(bbox, osmData => {
    processStreetData(osmData);
    loadedAreas.push(bbox);
    loadingData = false;
  });
}


function decreaseHealth(amount) {
  playerHealth -= amount;
  if (playerHealth < 0) playerHealth = 0;
  updateHealthDisplay();
}

// Utility function to compare bounding boxes
function isBBoxEqual(bbox1, bbox2) {
  return bbox1.every((val, index) => val === bbox2[index]);
}

// Process OSM data into nodes and edges
function processStreetData(osmData) {
  const existingNodeIds = new Set(Object.keys(nodes));

  osmData.elements.forEach(element => {
    if (element.type === 'node' && !nodes[element.id]) {
      nodes[element.id] = { id: element.id, lat: element.lat, lon: element.lon, neighbors: [] };
    }
  });

  osmData.elements.forEach(element => {
    if (element.type === 'way') {
      const nodeRefs = element.nodes;
      for (let i = 0; i < nodeRefs.length - 1; i++) {
        const from = nodeRefs[i];
        const to = nodeRefs[i + 1];

        if (!edges[from]) edges[from] = [];
        if (!edges[to]) edges[to] = [];

        edges[from].push(to);
        edges[to].push(from);

        if (nodes[from] && nodes[to]) {
          if (!nodes[from].neighbors.includes(to)) {
            nodes[from].neighbors.push(to);
          }
          if (!nodes[to].neighbors.includes(from)) {
            nodes[to].neighbors.push(from);
          }

          // Draw the street segments if not already drawn
          if (!existingNodeIds.has(from) || !existingNodeIds.has(to)) {
            L.polyline(
              [
                [nodes[from].lat, nodes[from].lon],
                [nodes[to].lat, nodes[to].lon],
              ],
              { color: 'blue', weight: 2 }
            ).addTo(map);
          }
        }
      }
    }
  });

// Place player and targets if not already placed
if (!playerMarker) {
    placePlayer();
    createSafeZones();
    createCollectibles();
    setupHandpose();
  }
}

// Place player and target on the map
function placePlayer() {
  const nodeIds = Object.keys(nodes);
  if (nodeIds.length === 0) {
    console.error('No nodes available to place the player.');
    document.getElementById('status').textContent = 'No available map data.';
    return;
  }

  // Clone the array to avoid mutating the original
  const availableNodes = nodeIds.slice();

  // Select player node
  currentNodeId = availableNodes.splice(Math.floor(Math.random() * availableNodes.length), 1)[0];

  // Select target node
  targetNodeId = availableNodes.splice(Math.floor(Math.random() * availableNodes.length), 1)[0];

  // Select escape node within 1-mile radius
  const playerNode = nodes[currentNodeId];
  const escapeNodes = availableNodes.filter(nodeId => {
    const node = nodes[nodeId];
    const distance = getDistanceMeters(playerNode.lat, playerNode.lon, node.lat, node.lon);
    return distance <= (ESCAPE_RADIUS_MILES * MILES_TO_METERS);
  });

  if (escapeNodes.length === 0) {
    console.warn('No nodes found within the escape radius. Selecting a random node.');
    winNodeId = availableNodes[Math.floor(Math.random() * availableNodes.length)];
  } else {
    winNodeId = escapeNodes[Math.floor(Math.random() * escapeNodes.length)];
  }

  // Create custom circular icon for player
  const playerIcon = L.divIcon({
    className: 'player-marker',
  });

  playerMarker = L.marker([nodes[currentNodeId].lat, nodes[currentNodeId].lon], {
    title: 'Player',
    icon: playerIcon,
  }).addTo(map);

  // Create target marker
  targetMarker = L.marker([nodes[targetNodeId].lat, nodes[targetNodeId].lon], {
    title: 'Destination',
    icon: L.icon({
      iconUrl: 'https://leafletjs.com/examples/custom-icons/leaf-green.png',
      iconSize: [38, 95],
      iconAnchor: [22, 94],
      popupAnchor: [-3, -76],
    }),
  }).addTo(map);

  // Create escape marker with custom icon
  const escapeIcon = L.icon({
    iconUrl: 'images/gate.png', // Replace with your custom escape icon path
    iconSize: [32, 32], // Adjust size as needed
    iconAnchor: [16, 32], // Adjust anchor as needed
    popupAnchor: [0, -32] // Adjust popup position as needed
  });

  createSafeZones();
  createCollectibles();

  winMarker = L.marker([nodes[winNodeId].lat, nodes[winNodeId].lon], {
    title: 'Escape Point',
    icon: escapeIcon,
  }).addTo(map);

  map.setView([nodes[currentNodeId].lat, nodes[currentNodeId].lon], 17);

  playerHealth = 100; // Initialize player health
  document.getElementById('healthDisplay').style.display = 'block'; // Show the health display
  updateHealthDisplay(); // Update the health display

  document.getElementById('status').textContent = 'Use your palm to navigate. Reach the escape point!';
  document.getElementById('status').style.display = 'block';
}

// Animate marker movement along the path
function animateMovement(marker, startLatLng, endLatLng, duration, callback) {
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const currentLat = startLatLng.lat + (endLatLng.lat - startLatLng.lat) * progress;
    const currentLng = startLatLng.lng + (endLatLng.lng - startLatLng.lng) * progress;

    marker.setLatLng([currentLat, currentLng]);
    map.panTo([currentLat, currentLng], { animate: false });

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else if (callback) {
      callback();
    }
  }

  requestAnimationFrame(animate);
}

// Handle player movement based on direction
function handleMovement(direction) {

    if (isTraining) {
        moveBallInTraining(direction);
        return;
      }

  if (isMoving) return;

  if (!currentNodeId || !nodes[currentNodeId]) {
    console.error('Player position is not initialized.');
    return;
  }

  const neighbors = nodes[currentNodeId].neighbors;
  if (neighbors.length === 0) return;

  const currentNode = nodes[currentNodeId];
  let nextNodeId = null;
  let minAngleDiff = Infinity;

  // Define direction angles in radians
  const directionAngles = {
    'left': Math.PI,
    'up': -Math.PI / 2,
    'right': 0,
    'down': Math.PI / 2
  };

  const directionAngle = directionAngles[direction];
  if (directionAngle === undefined) return;

  // Find the neighbor closest to the desired direction
  neighbors.forEach(neighborId => {
    const neighbor = nodes[neighborId];
    const dx = neighbor.lon - currentNode.lon;
    const dy = neighbor.lat - currentNode.lat;
    const angle = Math.atan2(dy, dx);

    let angleDiff = Math.abs(angle - directionAngle);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

    if (angleDiff < minAngleDiff) {
      minAngleDiff = angleDiff;
      nextNodeId = neighborId;
    }
  });

  if (nextNodeId) {
    isMoving = true;
    const nextNode = nodes[nextNodeId];
    const startLatLng = L.latLng(currentNode.lat, currentNode.lon);
    const endLatLng = L.latLng(nextNode.lat, nextNode.lon);
    const distance = startLatLng.distanceTo(endLatLng);
    const duration = distance * 10; // Adjust this multiplier to change movement speed

    animateMovement(playerMarker, startLatLng, endLatLng, duration, () => {
      currentNodeId = nextNodeId;
      isMoving = false;

            
      checkSafeZone();
      checkCollectibles();

      checkWinCondition();
      updateHealthDisplay();
      checkPlayerPosition();
      // Opponents will automatically update their paths in their intervals
    });
  }
}

// Move player if enough time has passed
function movePlayer(direction) {
  const now = Date.now();

  if (now - lastMoveTime > MOVE_COOLDOWN) {
    lastMoveTime = now;
    handleMovement(direction);
  }
}

// Set up the handpose model
function setupHandpose() {
  videoElement = document.getElementById('video');
  canvasElement = document.getElementById('overlay');
  ctx = canvasElement.getContext('2d');

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      videoElement.srcObject = stream;
      videoElement.play();

      videoElement.onloadeddata = () => {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;

        handposeModel = ml5.handpose(videoElement, modelReady);

        handposeModel.on('predict', results => {
          predictions = results;
        });
      };
    })
    .catch(err => {
      console.error('Error accessing webcam: ', err);
      document.getElementById('status').textContent = 'Error accessing webcam. Please allow camera access.';
    });
}

function modelReady() {
  console.log('Handpose model ready!');
  processHandData();
}

// Function to process hand data and control movement
function processHandData() {
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (predictions.length > 0) {
    const prediction = predictions[0];
    const landmarks = prediction.landmarks;

    drawHand(landmarks);

    // Implementation for Palm Tilt Detection
    detectPalmTilt(landmarks);
  }

  requestAnimationFrame(processHandData);
}

// Function to detect palm tilt and determine direction
function detectPalmTilt(landmarks) {
  // Extract necessary landmarks
  const wrist = landmarks[0];
  const middleFingerTip = landmarks[12]; // Landmark 12 is the tip of the middle finger

  // Calculate differences
  const deltaX = wrist[0] - middleFingerTip[0]; // Invert X-axis due to mirrored video
  const deltaY = middleFingerTip[1] - wrist[1]; // Adjust Y-axis for correct direction

  // Calculate angle in degrees
  const angleRad = Math.atan2(deltaY, deltaX);
  let angleDeg = angleRad * (180 / Math.PI);

  // Normalize angle to [0, 360)
  if (angleDeg < 0) {
    angleDeg += 360;
  }

  // Define angle thresholds for directions
  // Adjust these thresholds as needed based on testing
  const directionThresholds = {
    'up': { min: 45, max: 135 },
    'right': { min: 315, max: 360 },
    'right_ext': { min: 0, max: 45 }, // Combining for right
    'down': { min: 225, max: 315 },
    'left': { min: 135, max: 225 }
  };

  let detectedDirection = null;

  if (angleDeg >= directionThresholds['up'].min && angleDeg < directionThresholds['up'].max) {
    detectedDirection = 'up';
  } else if (
    (angleDeg >= directionThresholds['right'].min && angleDeg < directionThresholds['right'].max) ||
    (angleDeg >= directionThresholds['right_ext'].min && angleDeg < directionThresholds['right_ext'].max)
  ) {
    detectedDirection = 'right';
  } else if (angleDeg >= directionThresholds['down'].min && angleDeg < directionThresholds['down'].max) {
    detectedDirection = 'down';
  } else if (angleDeg >= directionThresholds['left'].min && angleDeg < directionThresholds['left'].max) {
    detectedDirection = 'left';
  }

  // Debugging: Display angle and direction
  // Uncomment the following line to see the angle and direction on the canvas
  // ctx.fillText(`Angle: ${Math.round(angleDeg)}°, Dir: ${detectedDirection || 'None'}`, 10, 20);

  if (detectedDirection) {
    movePlayer(detectedDirection);
  }
}

// Function to draw the hand on the canvas
function drawHand(landmarks) {
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;

  // Define finger connections
  const fingers = [
    [0, 1, 2, 3, 4],     // Thumb
    [0, 5, 6, 7, 8],     // Index finger
    [0, 9, 10, 11, 12],  // Middle finger
    [0, 13, 14, 15, 16], // Ring finger
    [0, 17, 18, 19, 20]  // Pinky
  ];

  // Draw finger lines
  fingers.forEach(finger => {
    for (let i = 0; i < finger.length - 1; i++) {
      const start = landmarks[finger[i]];
      const end = landmarks[finger[i + 1]];

      ctx.beginPath();
      ctx.moveTo(start[0], start[1]);
      ctx.lineTo(end[0], end[1]);
      ctx.stroke();
    }
  });

  // Draw landmarks
  landmarks.forEach(point => {
    ctx.beginPath();
    ctx.arc(point[0], point[1], 4, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
  });
}

// Function to check win condition based on proximity to escape point and collision with opponents
function checkWinCondition() {
  // Existing condition: Reached targetNodeId
  if (currentNodeId === targetNodeId) {
    // Stop processing hand data
    predictions = [];
    document.getElementById('status').textContent = 'You have reached your destination! Game Over.';
    showEndOverlay('You have reached your destination! Game Over.');
    stopGame(false); // Do not hide the overlay
    return;
  }

  // New condition: Reached escape point within WIN_RADIUS meters
  const playerLatLng = playerMarker.getLatLng();
  const escapeLatLng = winMarker.getLatLng();

  const distanceToEscape = playerLatLng.distanceTo(escapeLatLng); // Distance in meters

  if (distanceToEscape <= WIN_RADIUS) {
    // Stop processing hand data
    predictions = [];
    document.getElementById('status').textContent = 'Congratulations! You have escaped the city! Game Over.';
    showEndOverlay('Congratulations! You have escaped the city! Game Over.');
    stopGame(false); // Do not hide the overlay
    return;
  }

  // Check collision with opponents
  opponents.forEach(opponent => {
    const opponentLatLng = opponent.marker.getLatLng();
    const distanceToPlayer = playerLatLng.distanceTo(opponentLatLng); // Distance in meters

    if (distanceToPlayer <= COLLISION_RADIUS) {
      
       // Decrease player health
      decreaseHealth(10); // Decrease health by 10 on collision



      if (playerHealth <= 0) {
        // Player dies
        predictions = [];
        document.getElementById('status').textContent = 'Oh no! You\'ve been caught! Game Over.';
        showCaptureOverlay(); // Display the overlay image
        stopGame(false); // Do not hide the overlay
      } else {
        // Player is still alive, update status
        document.getElementById('status').textContent = `Ouch! You've been hit. Health: ${playerHealth}`;
      }



      // predictions = [];
      // document.getElementById('status').textContent = 'Oh no! An opponent has caught you. Game Over.';
      // showCaptureOverlay(); // Display the overlay image
      // stopGame(false); // Do not hide the overlay
    }
  });
}

// Function to toggle the game state (Start/Stop)
function toggleGame() {
  if (!gameRunning) {
    startGame();
  } else {
    stopGame();
  }
}

// Function to start the game
function startGame() {
    gameRunning = true;
  
    // Update button text to "Stop Game"
    document.getElementById('controls').querySelector('button').textContent = 'Stop Game';
  
    // Hide Start Screen with fade-out effect
    const startScreen = document.getElementById('startScreen');
    startScreen.classList.add('hidden');
  
    // Delay to allow CSS transition
    setTimeout(() => {
      startScreen.style.display = 'none';
    }, 500); // Match the CSS transition duration
  
    // Show training modal
    showTrainingModal();
  
    // The rest of the game initialization will be moved to initializeGameAfterTraining
  }
  
  function initializeGameAfterTraining() {
    // Reset variables
    nodes = {};
    edges = {};
    loadedAreas = [];
    if (map) {
      if (playerMarker) {
        map.removeLayer(playerMarker);
        playerMarker = null;
      }
      if (targetMarker) {
        map.removeLayer(targetMarker);
        targetMarker = null;
      }
      if (winMarker) {
        map.removeLayer(winMarker);
        winMarker = null;
      }
  
      // Remove existing opponents if any
      opponents.forEach(opponent => {
        map.removeLayer(opponent.marker);
        if (opponent.sound) {
          opponent.sound.pause();
          opponent.sound.currentTime = 0;
        }
      });
      opponents = [];
  
      isMoving = false;
      lastMoveTime = 0;
      predictions = [];
  
      // Remove existing polyline layers
      map.eachLayer(layer => {
        if (layer instanceof L.Polyline || layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });
  
      // Add tile layer back
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);
    }
  
    // Get selected city
    const selectedCity = document.getElementById('citySelect').value;
  
    // Show Status Message
    document.getElementById('status').style.display = 'block';
    document.getElementById('status').textContent = 'Loading map...';
  
    // Hide Capture Overlay in case it was visible from previous game
    hideCaptureOverlay();
  
    // Show game controls and video container
    document.getElementById('controls').style.display = 'block';
    document.getElementById('videoContainer').style.display = 'block';
  
    // Fetch coordinates from OpenWeatherMap API
    fetchCityCoordinates(selectedCity)
      .then(coordinates => {
        if (coordinates) {
          // Initialize the map with selected city
          if (map) {
            map.setView([coordinates.lat, coordinates.lon], 16);
            setTimeout(() => {
              map.invalidateSize();
            }, 100);
          } else {
            initMap(coordinates);
          }
  
          // Fetch initial street data
          const bboxSize = 0.01;
          const bbox = [
            coordinates.lat - bboxSize / 2,
            coordinates.lon - bboxSize / 2,
            coordinates.lat + bboxSize / 2,
            coordinates.lon + bboxSize / 2,
          ];
  
          fetchStreetData(bbox, osmData => {
            processStreetData(osmData);
            loadedAreas.push(bbox);
            spawnOpponents(); // Spawn opponents after initial data is loaded
          });
  
          // Play Theme Song
          themeSong.play().catch(error => {
            console.error('Error playing theme song:', error);
          });
        } else {
          alert('Could not retrieve coordinates for the selected city.');
          stopGame();
        }
      })
      .catch(error => {
        console.error('Error fetching city coordinates:', error);
        alert('Error fetching city coordinates.');
        stopGame();
      });
  }

  function showTrainingModal() {
    document.getElementById('trainingModal').style.display = 'block';
    isTraining = true;
    trainingBall = document.getElementById('trainingBall');
    setupHandpose(); // Make sure handpose is set up for training
  }
  
  function hideTrainingModal() {
    document.getElementById('trainingModal').style.display = 'none';
    isTraining = false;
  }
  
  // Add event listeners for the training buttons
  document.getElementById('skipTrainingButton').addEventListener('click', () => {
    hideTrainingModal();
    initializeGameAfterTraining();
  });
  
  document.getElementById('startGameFromTrainingButton').addEventListener('click', () => {
    hideTrainingModal();
    initializeGameAfterTraining();
  });

// Function to stop the game
// Parameter hideOverlay determines whether to hide the capture overlay
function stopGame(hideOverlay = true) {
  gameRunning = false;

  // Update button text to "Start Game"
  document.getElementById('controls').querySelector('button').textContent = 'Start Game';

  // Show Start Screen again with fade-in effect
  const startScreen = document.getElementById('startScreen');
  startScreen.classList.remove('hidden');
  startScreen.style.display = 'flex';

  if (map) {
    // Reset variables
    nodes = {};
    edges = {};
    loadedAreas = {};
    if (playerMarker) {
      map.removeLayer(playerMarker);
      playerMarker = null;
    }
    if (targetMarker) {
      map.removeLayer(targetMarker);
      targetMarker = null;
    }
    if (winMarker) { // Remove existing winMarker if any
      map.removeLayer(winMarker);
      winMarker = null;
    }

    // Remove existing opponents if any
    opponents.forEach(opponent => {
      map.removeLayer(opponent.marker);
      // Stop opponent sounds
      if (opponent.sound) {
        opponent.sound.pause();
        opponent.sound.currentTime = 0;
      }
    });
    opponents = [];

    // Clear opponents' movement interval
    if (opponentMovementInterval) {
      clearInterval(opponentMovementInterval);
      opponentMovementInterval = null;
    }

    // Remove all polyline and marker layers except the tile layer
    map.eachLayer(layer => {
      if (layer instanceof L.Polyline || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
  }

  // Stop Theme Song
  themeSong.pause();
  themeSong.currentTime = 0;

  // Hide Capture Overlay if required
  if (hideOverlay) {
    hideCaptureOverlay();
  }

  // Reset game state
  isMoving = false;
  lastMoveTime = 0;
  predictions = [];

  // Hide Status Message
  document.getElementById('status').style.display = 'none';
  document.getElementById('status').textContent = 'Press "Start Game" to begin.';

  // Hide game controls and video container
  document.getElementById('controls').style.display = 'none';
  document.getElementById('videoContainer').style.display = 'none';
}

// Function to restart the game
function restartGame() {
  // Hide Capture Overlay
  hideCaptureOverlay();

  // Start a new game
  startGame();
}

// Function to spawn opponents with random images and sounds
function spawnOpponents() {
  const nodeIds = Object.keys(nodes);
  const maxOpponents = 20; // Maximum number of opponents
  const minOpponents = 3; // Minimum number of opponents
  const numberOfOpponents = Math.floor(Math.random() * (maxOpponents - minOpponents + 1)) + minOpponents;

  for (let i = 0; i < numberOfOpponents; i++) {
    // Select a random node for the opponent, ensuring it's not the player, target, or escape node
    const availableNodes = nodeIds.filter(id => id !== currentNodeId && id !== targetNodeId && id !== winNodeId);
    if (availableNodes.length === 0) break; // No available nodes

    const opponentNodeId = availableNodes[Math.floor(Math.random() * availableNodes.length)];

    // Assign a random image to the opponent
    const randomImage = opponentImages[Math.floor(Math.random() * opponentImages.length)];

    // Create opponent icon with the selected image
    const opponentIcon = L.icon({
      iconUrl: randomImage,
      iconSize: [32, 32], // Adjust size as needed
      iconAnchor: [16, 32], // Adjust anchor as needed
      popupAnchor: [0, -32] // Adjust popup position as needed
    });

    const opponentMarker = L.marker([nodes[opponentNodeId].lat, nodes[opponentNodeId].lon], {
      title: `Opponent ${i + 1}`,
      icon: opponentIcon,
    }).addTo(map);

    // Assign a random sound to the opponent
    let opponentSound = null;
    if (opponentSounds.length > 0) {
      const randomSoundPath = opponentSounds[Math.floor(Math.random() * opponentSounds.length)];
      opponentSound = new Audio(randomSoundPath);
      opponentSound.loop = true;
      opponentSound.volume = 0.5; // Adjust volume as needed
      opponentSound.play().catch(error => {
        console.error(`Error playing sound for Opponent ${i + 1}:`, error);
      });
    }

    opponents.push({
      marker: opponentMarker,
      currentNodeId: opponentNodeId,
      sound: opponentSound // Store the Audio object
    });
  }

  // Start opponents' movement
  opponentMovementInterval = setInterval(moveOpponents, 1000); // Move opponents every 1 second
}

// Function to move opponents towards the player
function moveOpponents() {
  opponents.forEach(opponent => {
    if (!opponent.currentNodeId || !nodes[opponent.currentNodeId]) return;

    const playerLat = nodes[currentNodeId].lat;
    const playerLon = nodes[currentNodeId].lon;
    const opponentLat = nodes[opponent.currentNodeId].lat;
    const opponentLon = nodes[opponent.currentNodeId].lon;

    // Find the neighbor that is closest to the player
    const neighbors = nodes[opponent.currentNodeId].neighbors;
    let nextNodeId = null;
    let minDistance = Infinity;

    neighbors.forEach(neighborId => {
      const neighbor = nodes[neighborId];
      const distance = getDistanceMeters(playerLat, playerLon, neighbor.lat, neighbor.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nextNodeId = neighborId;
      }
    });

    if (nextNodeId) {
      // Move opponent to the next node
      opponent.currentNodeId = nextNodeId;
      const newLatLng = [nodes[nextNodeId].lat, nodes[nextNodeId].lon];
      opponent.marker.setLatLng(newLatLng);
    }
  });

  // After moving all opponents, check for collisions
  checkWinCondition();
}

// Function to show the capture overlay
function showCaptureOverlay() {
  document.getElementById('captureOverlay').style.display = 'flex';
}

// Function to show end game overlay with custom message
function showEndOverlay(message) {
  const overlay = document.getElementById('captureOverlay');
  overlay.style.display = 'flex';
  overlay.querySelector('img').src = 'images/gameover.webp'; // Change image as needed
  overlay.querySelector('img').alt = 'Game Over';
  overlay.querySelector('button').textContent = 'Restart Game';
  overlay.querySelector('button').onclick = restartGame;

  // Remove existing message if any
  const existingMsg = overlay.querySelector('p');
  if (existingMsg) {
    overlay.removeChild(existingMsg);
  }

  // Add new message
  const messagePara = document.createElement('p');
  messagePara.style.fontSize = '24px';
  messagePara.style.marginTop = '20px';
  messagePara.textContent = message;
  overlay.appendChild(messagePara);
}

// Function to hide the capture overlay
function hideCaptureOverlay() {
  const overlay = document.getElementById('captureOverlay');
  overlay.style.display = 'none';

  // Reset image if it was changed
  overlay.querySelector('img').src = 'images/Caught.jpg';
  overlay.querySelector('img').alt = 'Captured';

  // Reset button text and onclick
  overlay.querySelector('button').textContent = 'Restart Game';
  overlay.querySelector('button').onclick = restartGame;

  // Remove any appended messages
  const appendedParagraph = overlay.querySelector('p');
  if (appendedParagraph) {
    overlay.removeChild(appendedParagraph);
  }
}

// Function to restart the game
function restartGame() {
  // Hide Capture Overlay
  hideCaptureOverlay();

  // Start a new game
  startGame();
}

// Function to fetch city coordinates from OpenWeatherMap Geocoding API
async function fetchCityCoordinates(cityName) {
  const apiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${OPENWEATHERMAP_API_KEY}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error('Network response was not ok:', response.statusText);
      return null;
    }
    const data = await response.json();
    if (data.length === 0) {
      console.error('No data found for the specified city.');
      return null;
    }
    return { lat: data[0].lat, lon: data[0].lon };
  } catch (error) {
    console.error('Error fetching city coordinates:', error);
    return null;
  }
}

// Initialize the map on window load
window.onload = function () {
  // Add event listener to the Start Game button
  document.getElementById('startGameButton').addEventListener('click', startGame);
};