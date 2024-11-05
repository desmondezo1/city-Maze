// sketch.js

// Game Variables
let maze;
const COLS = 36; // Updated to match mazeLayout
const ROWS = 18; // Updated to match mazeLayout
let CELL_SIZE = 40; // Will be recalculated for responsiveness
let player;
let opponents = [];
let bullets = [];
let immuneCells = [];
let easterEggTriggered = false;
let mazeLoaded = false;
let exitPosition;

// Define the maze layout: 0 - empty, 1 - wall
const mazeLayout = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,1,0,0,0,1,0,1,0,1,0,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,0,0,1,0,1,0,0,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
  [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
  [1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
  [1,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1],
  [1,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Preload function (if needed)
function preload() {
  // Load any assets here
}

// Setup function
function setup() {
  // Calculate CELL_SIZE based on window size and maze dimensions
  CELL_SIZE = floor(min(windowWidth / COLS, (windowHeight - 50) / ROWS));
  
  createCanvas(COLS * CELL_SIZE, ROWS * CELL_SIZE + 50); // +50 for UI
  maze = new Maze(mazeLayout, COLS, ROWS, CELL_SIZE);
  
  // Define exit position (choose an open cell, e.g., (34,15))
  exitPosition = {x: 34, y: 15}; // Adjusted to an open cell
  
  // Initialize Player at starting position (e.g., cell (1,1))
  player = new Player(1 * CELL_SIZE + CELL_SIZE / 2, 1 * CELL_SIZE + CELL_SIZE / 2);
  
  // Initialize Opponents at various positions within the maze
  opponents.push(new Opponent(28 * CELL_SIZE + CELL_SIZE / 2, 8 * CELL_SIZE + CELL_SIZE / 2)); // Cell (28,8)
  opponents.push(new Opponent(28 * CELL_SIZE + CELL_SIZE / 2, 3 * CELL_SIZE + CELL_SIZE / 2)); // Cell (28,3)
  
  mazeLoaded = true;
  
  // Optional: Debugging Positions
  // console.log("Player Position:", player.x, player.y);
  // console.log("Opponents Positions:", opponents.map(op => [op.x, op.y]));
}

// Draw function
function draw() {
  background(220);
  
  if (!mazeLoaded) {
    displayLoadingScreen();
    return;
  }
  
  // Draw Maze
  maze.display();
  
  // Draw Exit
  drawExit();
  
  // Update and display player
  player.update();
  player.display();
  
  // Update and display bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].display();
    
    // Remove bullets that are off-screen
    if (bullets[i].offScreen()) {
      bullets.splice(i, 1);
    }
  }
  
  // Update and display opponents
  for (let i = opponents.length - 1; i >= 0; i--) {
    opponents[i].update();
    opponents[i].display();
    
    // Check collision with player
    if (opponents[i].hits(player)) {
      player.takeDamage(opponents[i].damage);
      opponents.splice(i, 1);
      continue;
    }
    
    // Check if bullet hits opponent
    for (let j = bullets.length - 1; j >= 0; j--) {
      if (opponents[i].isHit(bullets[j])) {
        opponents[i].takeDamage(bullets[j].damage);
        bullets.splice(j, 1);
        if (opponents[i].health <= 0) {
          opponents.splice(i, 1);
        }
        break;
      }
    }
  }
  
  // Update and display immune cells (from easter eggs)
  for (let i = immuneCells.length - 1; i >= 0; i--) {
    immuneCells[i].update();
    immuneCells[i].display();
    
    // Remove immune cells that are done
    if (immuneCells[i].isDone) {
      immuneCells.splice(i, 1);
    }
  }
  
  // Display Health
  displayHealth();
  
  // Check for win condition
  checkWinCondition();
  
  // Handle Easter Eggs
  checkEasterEgg();
  
  // Handle Immune Cells Effects
  handleImmuneCells();
}

// Handle window resize for responsiveness
function windowResized() {
  // Recalculate CELL_SIZE based on new window size
  CELL_SIZE = floor(min(windowWidth / COLS, (windowHeight - 50) / ROWS));
  resizeCanvas(COLS * CELL_SIZE, ROWS * CELL_SIZE + 50);
  
  // Optionally, reposition player and opponents if necessary
  // This can be complex if maze size changes, consider resetting the game
}

// Display loading screen
function displayLoadingScreen() {
  background(0);
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text("Loading...", width / 2, height / 2);
}

// Function to draw the exit
function drawExit() {
  fill(0, 255, 0);
  noStroke();
  rect(exitPosition.x * CELL_SIZE, exitPosition.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

// Function to check win condition
function checkWinCondition() {
  let playerCell = maze.getCell(player.x, player.y);
  if (playerCell && playerCell.x === exitPosition.x && playerCell.y === exitPosition.y) {
    noLoop();
    background(0, 255, 0);
    fill(0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("You Escaped the Maze!\nCongratulations!", width / 2, height / 2);
  }
}

// Player Class
class Player {
  constructor(x, y) {
    this.size = CELL_SIZE * 0.5;
    this.x = x;
    this.y = y;
    this.speed = 4;
    this.health = 100;
    this.lastShot = 0;
    this.shootInterval = 300; // milliseconds
    this.moveDir = {x: 0, y: 0};
    this.isInvincible = false; // Flag for invincibility
  }
  
  update() {
    // Handle Movement
    this.handleMovement();
    
    // Prevent player from moving out of bounds
    this.x = constrain(this.x, CELL_SIZE / 2, width - CELL_SIZE / 2);
    this.y = constrain(this.y, CELL_SIZE / 2, height - CELL_SIZE / 2 - 50); // 50 for UI
  }
  
  display() {
    // Draw player as a triangle pointing in the direction
    push();
    translate(this.x, this.y);
    noStroke();
    fill(this.isInvincible ? color(0, 0, 255, 150) : color(0, 0, 255)); // Semi-transparent if invincible
    rotate(this.getRotationAngle());
    triangle(-this.size / 2, this.size / 2, this.size / 2, this.size / 2, 0, -this.size / 2);
    pop();
  }
  
  handleMovement() {
    this.moveDir = {x: 0, y: 0};
    if (keyIsDown(87) || keyIsDown(UP_ARROW)) { // W or Up
      this.moveDir.y = -1;
    }
    if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) { // S or Down
      this.moveDir.y = 1;
    }
    if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) { // A or Left
      this.moveDir.x = -1;
    }
    if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) { // D or Right
      this.moveDir.x = 1;
    }
    
    // Normalize movement
    if (this.moveDir.x !== 0 || this.moveDir.y !== 0) {
      let mag = sqrt(this.moveDir.x * this.moveDir.x + this.moveDir.y * this.moveDir.y);
      this.moveDir.x /= mag;
      this.moveDir.y /= mag;
      
      // Calculate new position
      let newX = this.x + this.moveDir.x * this.speed;
      let newY = this.y + this.moveDir.y * this.speed;
      
      // Check collision with walls
      if (!maze.isWall(newX, this.y)) {
        this.x = newX;
      }
      if (!maze.isWall(this.x, newY)) {
        this.y = newY;
      }
    }
  }
  
  getRotationAngle() {
    if (this.moveDir.x > 0) return HALF_PI;
    if (this.moveDir.x < 0) return -HALF_PI;
    if (this.moveDir.y > 0) return PI;
    if (this.moveDir.y < 0) return 0;
    return 0;
  }
  
  shoot() {
    let currentTime = millis();
    if (currentTime - this.lastShot > this.shootInterval) {
      bullets.push(new Bullet(this.x, this.y, this.getShootDirection()));
      this.lastShot = currentTime;
    }
  }
  
  getShootDirection() {
    // Determine direction based on last movement
    if (this.moveDir.x > 0) return 'right';
    if (this.moveDir.x < 0) return 'left';
    if (this.moveDir.y > 0) return 'down';
    if (this.moveDir.y < 0) return 'up';
    return 'up'; // Default
  }
  
  takeDamage(amount) {
    if (this.isInvincible) return; // Ignore damage if invincible
    
    this.health -= amount;
    updateHealthBar(this.health);
    if (this.health <= 0) {
      // Game Over
      noLoop();
      background(0);
      fill(255, 0, 0);
      textSize(32);
      textAlign(CENTER, CENTER);
      text("Game Over!\nYou were defeated by the opponents.", width / 2, height / 2);
    }
  }
  
  resetPosition() {
    this.x = 1 * CELL_SIZE + CELL_SIZE / 2;
    this.y = 1 * CELL_SIZE + CELL_SIZE / 2;
    this.health = 100;
    this.isInvincible = false;
    updateHealthBar(this.health);
  }
}

// Bullet Class
class Bullet {
  constructor(x, y, direction) {
    this.x = x;
    this.y = y;
    this.size = 8;
    this.speed = 8;
    this.direction = direction;
    this.damage = 25;
  }
  
  update() {
    switch(this.direction) {
      case 'up':
        this.y -= this.speed;
        break;
      case 'right':
        this.x += this.speed;
        break;
      case 'down':
        this.y += this.speed;
        break;
      case 'left':
        this.x -= this.speed;
        break;
      default:
        break;
    }
  }
  
  display() {
    push();
    noStroke();
    fill(255, 255, 0);
    ellipse(this.x, this.y, this.size);
    pop();
  }
  
  offScreen() {
    return (this.x < 0 || this.x > width || this.y < 0 || this.y > height);
  }
}

// Opponent Class (Chasing within the maze)
class Opponent {
  constructor(x, y) {
    this.type = 'opponent';
    this.size = CELL_SIZE * 0.5;
    this.health = 100;
    this.speed = 2;
    this.damage = 10;
    this.x = x;
    this.y = y;
    this.path = []; // Path to player
    this.pathIndex = 0;
    this.recalculateInterval = 60; // frames
    this.lastRecalculation = frameCount;
  }
  
  update() {
    // Recalculate path at intervals
    if (frameCount - this.lastRecalculation > this.recalculateInterval) {
      this.path = maze.findPath(this.x, this.y, player.x, player.y);
      this.pathIndex = 0;
      this.lastRecalculation = frameCount;
    }
    
    // Move along the path
    if (this.path && this.pathIndex < this.path.length) {
      let target = this.path[this.pathIndex];
      let targetX = target.x * CELL_SIZE + CELL_SIZE / 2;
      let targetY = target.y * CELL_SIZE + CELL_SIZE / 2;
      
      let dir = createVector(targetX - this.x, targetY - this.y);
      let distance = dir.mag();
      if (distance < this.speed) {
        this.x = targetX;
        this.y = targetY;
        this.pathIndex++;
      } else {
        dir.normalize();
        this.x += dir.x * this.speed;
        this.y += dir.y * this.speed;
      }
    }
  }
  
  display() {
    push();
    noStroke();
    fill(255, 0, 0);
    ellipse(this.x, this.y, this.size);
    pop();
  }
  
  hits(player) {
    let distance = dist(this.x, this.y, player.x, player.y);
    return distance < (this.size / 2 + player.size / 2);
  }
  
  isHit(bullet) {
    let distance = dist(this.x, this.y, bullet.x, bullet.y);
    return distance < (this.size / 2 + bullet.size / 2);
  }
  
  takeDamage(amount) {
    this.health -= amount;
  }
}

// Maze Class
class Maze {
  constructor(layout, cols, rows, cellSize) {
    this.layout = layout;
    this.cols = cols;
    this.rows = rows;
    this.cellSize = cellSize;
  }
  
  display() {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.layout[y][x] === 1) {
          fill(50);
          noStroke();
          rect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
        }
      }
    }
  }
  
  isWall(x, y) {
    let cell = this.getCell(x, y);
    if (cell) {
      return this.layout[cell.y][cell.x] === 1;
    }
    return true;
  }
  
  getCell(x, y) {
    let cellX = floor(x / this.cellSize);
    let cellY = floor(y / this.cellSize);
    if (cellX >= 0 && cellX < this.cols && cellY >= 0 && cellY < this.rows) {
      return {x: cellX, y: cellY};
    }
    return null;
  }
  
  findPath(startX, startY, endX, endY) {
    // Implement A* pathfinding
    let start = this.getCell(startX, startY);
    let end = this.getCell(endX, endY);
    if (!start || !end) return [];
    
    let openSet = [];
    let closedSet = [];
    let cameFrom = {};
    let gScore = {};
    let fScore = {};
    
    let startKey = `${start.x},${start.y}`;
    let endKey = `${end.x},${end.y}`;
    
    gScore[startKey] = 0;
    fScore[startKey] = this.heuristic(start, end);
    openSet.push(startKey);
    
    while (openSet.length > 0) {
      // Find node with lowest fScore
      let currentKey = openSet.reduce((a, b) => (fScore[a] < fScore[b] ? a : b));
      let [currentX, currentY] = currentKey.split(',').map(Number);
      let current = {x: currentX, y: currentY};
      
      if (currentKey === endKey) {
        // Reconstruct path
        let path = [];
        let tempKey = currentKey;
        while (tempKey in cameFrom) {
          let [x, y] = tempKey.split(',').map(Number);
          path.push({x: x, y: y});
          tempKey = cameFrom[tempKey];
        }
        path.reverse();
        return path;
      }
      
      openSet = openSet.filter(key => key !== currentKey);
      closedSet.push(currentKey);
      
      let neighbors = this.getNeighbors(current);
      for (let neighbor of neighbors) {
        let neighborKey = `${neighbor.x},${neighbor.y}`;
        if (closedSet.includes(neighborKey)) continue;
        if (this.layout[neighbor.y][neighbor.x] === 1) continue; // Wall
        
        let tentativeGScore = gScore[currentKey] + 1;
        if (!(neighborKey in gScore) || tentativeGScore < gScore[neighborKey]) {
          cameFrom[neighborKey] = currentKey;
          gScore[neighborKey] = tentativeGScore;
          fScore[neighborKey] = tentativeGScore + this.heuristic(neighbor, end);
          if (!openSet.includes(neighborKey)) {
            openSet.push(neighborKey);
          }
        }
      }
    }
    
    // No path found
    return [];
  }
  
  heuristic(a, b) {
    // Manhattan distance
    return abs(a.x - b.x) + abs(a.y - b.y);
  }
  
  getNeighbors(cell) {
    let neighbors = [];
    let dirs = [
      {x: 1, y: 0},
      {x: -1, y: 0},
      {x: 0, y: 1},
      {x: 0, y: -1},
    ];
    for (let dir of dirs) {
      let nx = cell.x + dir.x;
      let ny = cell.y + dir.y;
      if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
        neighbors.push({x: nx, y: ny});
      }
    }
    return neighbors;
  }
}

// ImmuneCell Assistance Class (Same as original)
class ImmuneCellAssist {
  constructor(type) {
    this.type = type;
    this.duration = 300; // frames
    this.timer = 0;
    this.isDone = false;
    this.startTime = frameCount;
    
    // Implement different types of assists
    switch(this.type) {
      case 'ImmuneCellAssist':
        this.effect = 'shield';
        break;
      case 'HealthBoost':
        player.health += 30;
        updateHealthBar(player.health);
        this.isDone = true;
        break;
      case 'SpeedBoost':
        player.speed = 6;
        this.effect = 'speed';
        break;
      case 'NutrientShield':
        this.effect = 'shield';
        break;
      case 'TemporaryInvisibility':
        this.effect = 'invisibility';
        break;
      case 'Temporary invincibility':
        this.effect = 'invincibility';
        break;
      default:
        this.isDone = true;
    }
  }
  
  update() {
    this.timer = frameCount - this.startTime;
    if (this.timer > this.duration) {
      // Reset effects
      switch(this.type) {
        case 'ImmuneCellAssist':
          // Implement shield removal
          break;
        case 'SpeedBoost':
          player.speed = 4;
          break;
        case 'NutrientShield':
          // Implement shield removal
          break;
        case 'TemporaryInvisibility':
          // Implement invisibility removal
          break;
        case 'Temporary invincibility':
          player.isInvincible = false;
          break;
        default:
          break;
      }
      this.isDone = true;
    }
  }
  
  display() {
    // Optionally, display effects
    if (this.effect === 'shield') {
      push();
      noFill();
      stroke(0, 255, 0);
      ellipse(player.x, player.y, player.size + 20);
      pop();
    }
    if (this.effect === 'speed') {
      // Display speed boost indicator
      push();
      fill(255, 255, 0);
      textSize(16);
      textAlign(CENTER, CENTER);
      text("Speed Boost!", player.x, player.y - player.size);
      pop();
    }
    if (this.effect === 'invisibility') {
      // Implement invisibility visuals
      push();
      noStroke();
      fill(255, 255, 255, 100);
      ellipse(player.x, player.y, player.size + 10);
      pop();
    }
    if (this.effect === 'invincibility') {
      // Implement invincibility visuals
      push();
      noFill();
      stroke(255, 0, 255);
      ellipse(player.x, player.y, player.size + 30);
      pop();
    }
  }
}

// Handle Key Presses
function keyPressed() {
  if (key === ' ') { // Spacebar to shoot
    player.shoot();
  }
}

// Easter Egg Checking Function (Adjust as needed)
function checkEasterEgg() {
  // Implement any maze-specific easter eggs if desired
  // Currently no implementation
}

// Trigger Easter Egg Reward
function triggerEasterEgg(reward) {
  immuneCells.push(new ImmuneCellAssist(reward));
  // Optionally, display reward description
  alert("Easter Egg Unlocked: " + getEasterEggDescription(reward));
}

// Get Easter Egg Description (Same as original)
function getEasterEggDescription(reward) {
  let description = "";
  switch(reward) {
    case "ImmuneCellAssist":
      description = "Immune cells have provided you with a temporary shield!";
      break;
    case "HealthBoost":
      description = "Your health has been restored!";
      break;
    case "SpeedBoost":
      description = "Your movement and shooting speed have increased!";
      break;
    case "NutrientShield":
      description = "A nutrient shield absorbs the next few enemy hits!";
      break;
    case "TemporaryInvisibility":
      description = "You are now invisible to enemies for a short duration!";
      break;
    case "Temporary invincibility":
      description = "You are now invincible for a short duration!";
      break;
    default:
      description = "You have received a reward!";
      break;
  }
  return description;
}

// Display Health Bar
function displayHealth() {
  // UI Background
  fill(255);
  rect(0, height - 50, width, 50);
  
  // Health Bar
  fill(255, 0, 0);
  let healthWidth = map(player.health, 0, 100, 0, width * 0.3);
  rect(10, height - 30, healthWidth, 20);
  
  // Health Text
  fill(0);
  textSize(16);
  textAlign(LEFT, CENTER);
  text("Health", 10, height - 40);
}

// Update Health Bar Function (Adjusted)
function updateHealthBar(newHealth) {
  player.health = constrain(newHealth, 0, 100);
  displayHealth();
}

// Immune Cells Assistance Handler
function handleImmuneCells() {
  for (let cell of immuneCells) {
    cell.update();
    cell.display();
  }
  
  // Implement shield and invincibility effects
  for (let cell of immuneCells) {
    if (cell.effect === 'shield') {
      // Implement shield logic, e.g., reduce damage or block attacks
      // Not fully implemented in this example
    }
    if (cell.effect === 'invincibility') {
      // Make player invincible
      player.isInvincible = true;
    }
  }
}

// Maze navigation without rooms; all handled locally
