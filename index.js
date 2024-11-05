// sketch.js

// Game Variables
let currentRoom;
let player;
let bullets = [];
let opponents = [];
let immuneCells = [];
let easterEggTriggered = false;
let loading = true; // Indicates if the game is loading the first scene
let roomLoaded = false; // Indicates if the first room has been loaded
let currentRoomIndex = 0; // Tracks the current room number

// Images
let backgroundImages = {};
let currentBackgroundImage;

// Preload function to load any static assets if needed
function preload() {
  // Load background images for known rooms if available
  // Example:
  // backgroundImages['lungs'] = loadImage('assets/backgrounds/lungs.png');
  // backgroundImages['stomach'] = loadImage('assets/backgrounds/stomach.png');
  // Add more as needed
}

// Setup function
function setup() {
  createCanvas(1792, 1024);  //1792x1024
  
  // Initialize Player
  player = new Player();
  
  // Check if rooms are cached in localStorage
  let cachedRooms = JSON.parse(localStorage.getItem('rooms')) || [];
  
  if (cachedRooms.length > 0) {
    // Load the first room from cache
    currentRoom = cachedRooms[currentRoomIndex];
    loadRoom(currentRoom);
    loading = false;
    roomLoaded = true;
  } else {
    // Fetch the first room from the API
    fetchRoomData('http://localhost:3000/generate-room');
  }
}

// Draw function
function draw() {
  if (loading) {
    // Display loading screen while data is being fetched
    displayLoadingScreen();
    return;
  }

  if (!roomLoaded) {
    return; // Do not run the game logic until the room is loaded
  }

  // Draw Room Background
  drawRoomBackground();

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
  
  // Display Room Status
  displayRoomStatus();
  
  // Handle Easter Eggs
  checkEasterEgg();
  
  // Handle Immune Cells Effects
  handleImmuneCells();
}

// Display loading screen
function displayLoadingScreen() {
  background(0);
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text("Loading...", width / 2, height / 2);
}

// Function to fetch room data from the API
function fetchRoomData(apiUrl) {
  loading = true; // Set loading state to true

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      // Process the received room data
      currentRoom = data;

      // Load the background image
      loadImage(data[currentRoomIndex].backgroundImageUrl, img => {
        currentBackgroundImage = img;
        loading = false; // Set loading state to false once image is loaded
        roomLoaded = true; // Set roomLoaded to true after room is fully prepared
        loadOpponents(data[currentRoomIndex]); // Load opponents based on the received room data
        
        // Cache the room data in localStorage
        cacheRoomData(data);
      });
    })
    .catch(error => {
      console.error('Error fetching room data:', error);
      loading = false; // Set loading state to false even if an error occurs
    });
}

// Function to cache room data in localStorage
function cacheRoomData(roomData) {
  let cachedRooms = JSON.parse(localStorage.getItem('rooms')) || [];
//   cachedRooms.push(roomData);
  localStorage.setItem('rooms', JSON.stringify([...cachedRooms, ...roomData]));
}

// Function to load room data (from cache or API)
function loadRoom(roomData) {
  // Load background image
  loadImage(roomData.backgroundImageUrl, img => {
    currentBackgroundImage = img;
    roomLoaded = true;
    loadOpponents(roomData);
  }, () => {
    console.error(`Failed to load background image: ${roomData.backgroundImageUrl}`);
    roomLoaded = true; // Even if image fails, proceed to load opponents
    loadOpponents(roomData);
  });
}

// Draw Room Background
function drawRoomBackground() {
  if (currentBackgroundImage) {
    image(currentBackgroundImage, 0, 0, width, height);
  } else {
    background(0); // Fallback background if the image isn't loaded
  }

  // Display room details
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text(currentRoom.sceneDescription, 10, height - 80, 300, 70);
  text(currentRoom.diseaseExplanation, 10, height - 40, 300, 30);
}

// Transition to Next Room
function transitionToNextRoom() {
  currentRoomIndex++;
  let cachedRooms = JSON.parse(localStorage.getItem('rooms')) || [];
  
  if (currentRoomIndex < cachedRooms.length) {
    // Load room from cache
    currentRoom = cachedRooms[currentRoomIndex];
    loadRoom(currentRoom);
  } else {
    // Fetch new room from API
    // fetchRoomData('http://localhost:3000/generate-room');
    Console.log('no cached room')
  }
}

// Player Class
class Player {
  constructor() {
    this.size = 40;
    this.x = width / 2;
    this.y = height / 2;
    this.speed = 4;
    this.direction = 'up'; // 'up', 'down', 'left', 'right', etc.
    this.health = 100;
    this.lastShot = 0;
    this.shootInterval = 300; // milliseconds
    this.moveDir = {x: 0, y: 0};
    this.isInvincible = false; // Flag for invincibility
  }
  
  update() {
    // Handle Movement
    this.handleMovement();
    
    // Update direction based on movement
    if (this.moveDir.x > 0) {
      this.direction = 'right';
    } else if (this.moveDir.x < 0) {
      this.direction = 'left';
    }
    if (this.moveDir.y > 0) {
      this.direction = 'down';
    } else if (this.moveDir.y < 0) {
      this.direction = 'up';
    }
    
    // Prevent player from moving out of bounds
    this.x = constrain(this.x, this.size / 2, width - this.size / 2);
    this.y = constrain(this.y, this.size / 2, height - this.size / 2);
  }
  
  display() {
    // Draw player as a triangle pointing in the direction
    push();
    translate(this.x, this.y);
    noStroke();
    fill(0, 255, 0);
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
      
      this.x += this.moveDir.x * this.speed;
      this.y += this.moveDir.y * this.speed;
    }
  }
  
  getRotationAngle() {
    switch(this.direction) {
      case 'up':
        return 0;
      case 'right':
        return HALF_PI;
      case 'down':
        return PI;
      case 'left':
        return -HALF_PI;
      default:
        return 0;
    }
  }
  
  shoot() {
    let currentTime = millis();
    if (currentTime - this.lastShot > this.shootInterval) {
      bullets.push(new Bullet(this.x, this.y, this.direction));
      this.lastShot = currentTime;
    }
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
      text("Game Over!\nYou were defeated by the pathogens.", width / 2, height / 2);
    }
  }
  
  resetPosition() {
    this.x = width / 2;
    this.y = height / 2;
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

// Opponent Class (Updated with Dynamic Speed and Movement)
class Opponent {
  constructor(type, movementPattern, difficulty, roomId) {
    this.type = type;
    this.movementPattern = movementPattern;
    this.difficulty = difficulty;
    this.roomId = roomId;
    this.size = 30;
    this.health = this.setHealth();
    this.baseSpeed = this.setSpeed(); // Base speed based on movement pattern
    this.currentSpeed = this.baseSpeed * 0.5; // Start at half the base speed
    this.speedIncrement = 0.01; // Speed increment per frame
    this.maxSpeed = this.baseSpeed * 1.5; // Maximum speed
    this.damage = this.setDamage();
    this.color = this.setColor();
    this.x = random(this.size, width - this.size);
    this.y = random(this.size, height - this.size);
    this.direction = createVector(0, 0);
    this.movementTimer = 0;
    this.movementInterval = 120; // frames (2 seconds at 60fps)
    this.oscillationAngle = random(TWO_PI); // Random starting angle for oscillation
    this.oscillationSpeed = random(0.05, 0.1); // Speed of oscillation
    this.oscillationMagnitude = random(10, 20); // Magnitude of oscillation
  }
  
  setHealth() {
    switch(this.difficulty) {
      case 'easy':
        return 50;
      case 'medium':
        return 100;
      case 'hard':
        return 150;
      default:
        return 50;
    }
  }
  
  setSpeed() {
    switch(this.movementPattern) {
      case 'simplePathfinding':
        return 2;
      case 'coordinated':
        return 3;
      case 'aggressive':
        return 4;
      case 'slowAdvance':
        return 1;
      case 'randomMovement':
        return 2;
      case 'camouflage':
        return 1.5;
      case 'zigzag':
        return 2;
      case 'swarming':
        return 3;
      case 'slow_spread':
        return 1;
      default:
        return 2;
    }
  }
  
  setDamage() {
    switch(this.type) {
      case 'virus':
        return 10;
      case 'bacteria':
        return 5;
      case 'parasite':
        return 15;
      case 'fungus':
        return 20;
      case 'allergen':
        return 25;
      case 'protozoa':
        return 15;
      default:
        return 5;
    }
  }
  
  setColor() {
    switch(this.type) {
      case 'virus':
        return color(255, 0, 0); // Red
      case 'bacteria':
        return color(0, 0, 255); // Blue
      case 'parasite':
        return color(255, 165, 0); // Orange
      case 'fungus':
        return color(128, 0, 128); // Purple
      case 'allergen':
        return color(255, 255, 0); // Yellow
      case 'protozoa':
        return color(0, 255, 255); // Cyan
      default:
        return color(255);
    }
  }
  
  update() {
    // Gradually increase speed up to maxSpeed
    if (this.currentSpeed < this.maxSpeed) {
      this.currentSpeed += this.speedIncrement;
      this.currentSpeed = min(this.currentSpeed, this.maxSpeed);
    }
    
    // Update movement based on pattern
    switch(this.movementPattern) {
      case 'simplePathfinding':
        this.simplePathfinding();
        break;
      case 'coordinated':
        this.coordinated();
        break;
      case 'aggressive':
        this.aggressive();
        break;
      case 'slowAdvance':
        this.slowAdvance();
        break;
      case 'randomMovement':
        this.randomMovement();
        break;
      case 'camouflage':
        this.camouflage();
        break;
      case 'zigzag':
        this.zigzagMovement();
        break;
      case 'swarming':
        this.swarmingMovement();
        break;
      case 'slow_spread':
        this.slowSpreadMovement();
        break;
      default:
        this.simplePathfinding();
    }
    
    // Update oscillation for more dynamic movement
    this.oscillationAngle += this.oscillationSpeed;
  }
  
  display() {
    push();
    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, this.size);
    pop();
  }
  
  // Movement Patterns
  simplePathfinding() {
    // Move towards the player
    let dir = createVector(player.x - this.x, player.y - this.y);
    dir.normalize();
    this.x += dir.x * this.currentSpeed;
    this.y += dir.y * this.currentSpeed;
  }
  
  coordinated() {
    // Implement coordinated movement, e.g., move in groups or formations
    // For simplicity, slightly adjust direction based on oscillation
    let dir = createVector(player.x - this.x, player.y - this.y);
    dir.normalize();
    // Add oscillation to the direction
    dir.x += cos(this.oscillationAngle) * 0.1;
    dir.y += sin(this.oscillationAngle) * 0.1;
    dir.normalize();
    this.x += dir.x * this.currentSpeed;
    this.y += dir.y * this.currentSpeed;
  }
  
  aggressive() {
    // Move faster towards the player with direct approach
    let dir = createVector(player.x - this.x, player.y - this.y);
    dir.normalize();
    this.x += dir.x * this.currentSpeed;
    this.y += dir.y * this.currentSpeed;
  }
  
  slowAdvance() {
    // Move slowly towards the player with slight randomness
    let dir = createVector(player.x - this.x, player.y - this.y);
    dir.normalize();
    // Add slight randomness
    dir.x += random(-0.2, 0.2);
    dir.y += random(-0.2, 0.2);
    dir.normalize();
    this.x += dir.x * this.currentSpeed;
    this.y += dir.y * this.currentSpeed;
  }
  
  randomMovement() {
    // Change direction at intervals and move in that direction
    if (frameCount % this.movementInterval === 0) {
      this.direction = p5.Vector.random2D();
      this.direction.mult(this.currentSpeed);
    }
    this.x += this.direction.x;
    this.y += this.direction.y;
    
    // Keep within bounds with slight bounce
    if (this.x <= this.size / 2 || this.x >= width - this.size / 2) {
      this.direction.x *= -1;
    }
    if (this.y <= this.size / 2 || this.y >= height - this.size / 2) {
      this.direction.y *= -1;
    }
  }
  
  camouflage() {
    // Move towards the player with occasional slowdown or diversion
    let dir = createVector(player.x - this.x, player.y - this.y);
    dir.normalize();
    // Random chance to divert
    if (random(1) < 0.05) {
      dir.x += random(-0.5, 0.5);
      dir.y += random(-0.5, 0.5);
      dir.normalize();
    }
    this.x += dir.x * this.currentSpeed;
    this.y += dir.y * this.currentSpeed;
  }
  
  zigzagMovement() {
    // Move towards the player with a zigzag pattern
    let dir = createVector(player.x - this.x, player.y - this.y);
    dir.normalize();
    // Apply zigzag oscillation perpendicular to the direction
    let perpendicular = createVector(-dir.y, dir.x);
    let zigzag = perpendicular.copy().mult(sin(this.oscillationAngle) * 0.5);
    dir.add(zigzag);
    dir.normalize();
    this.x += dir.x * this.currentSpeed;
    this.y += dir.y * this.currentSpeed;
  }
  
  swarmingMovement() {
    // Move in a swarming pattern, slightly cohesive
    let dir = createVector(player.x - this.x, player.y - this.y);
    dir.normalize();
    // Add some cohesion with nearby opponents
    let nearby = opponents.filter(op => op !== this && dist(this.x, this.y, op.x, op.y) < 100);
    if (nearby.length > 0) {
      let avgDir = createVector(0, 0);
      nearby.forEach(op => {
        avgDir.add(p5.Vector.sub(createVector(op.x, op.y), createVector(this.x, this.y)));
      });
      avgDir.div(nearby.length);
      avgDir.normalize();
      dir.add(avgDir.mult(0.1));
      dir.normalize();
    }
    this.x += dir.x * this.currentSpeed;
    this.y += dir.y * this.currentSpeed;
  }
  
  slowSpreadMovement() {
    // Move slowly and spread out over time
    let dir = createVector(player.x - this.x, player.y - this.y);
    dir.normalize();
    this.x += dir.x * this.currentSpeed * 0.5; // Move slower
    this.y += dir.y * this.currentSpeed * 0.5;
    
    // Gradually spread out from the player
    let spreadFactor = map(this.currentSpeed, this.baseSpeed * 0.5, this.maxSpeed, 0, 1);
    this.x += random(-spreadFactor, spreadFactor);
    this.y += random(-spreadFactor, spreadFactor);
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

// ImmuneCell Assistance Class
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

// Function to load room data
function loadRoom(roomData) {
  currentRoom = roomData;
  
  // Load background image
  loadImage(roomData.backgroundImageUrl, img => {
    currentBackgroundImage = img;
    roomLoaded = true;
    loadOpponents(roomData);
  }, () => {
    console.error(`Failed to load background image: ${roomData.backgroundImageUrl}`);
    roomLoaded = true; // Even if image fails, proceed to load opponents
    loadOpponents(roomData);
  });
}

// Load Opponents based on room data
function loadOpponents(room) {
  opponents = []; // Clear existing opponents
  room.opponents.forEach(opponentType => {
    for (let i = 0; i < opponentType.count; i++) {
      opponents.push(new Opponent(opponentType.type, opponentType.movementPattern, opponentType.difficulty, room.roomId));
    }
  });
  
  // Reset Easter Egg Trigger
  easterEggTriggered = false;
  
  // Reset immune cells
  immuneCells = [];
  
  // Optionally, reset player position or other stats
  player.resetPosition();
}

// Handle Key Presses
function keyPressed() {
  if (key === ' ') { // Spacebar to shoot
    player.shoot();
  }
}

// Easter Egg Checking Function
function checkEasterEgg() {
  let egg = currentRoom.easterEgg;
  if (egg && !easterEggTriggered) {
    // Implement trigger tasks based on room
    // For simplicity, we'll assume the triggerTask is met based on roomId and specific conditions
    switch(currentRoom.roomId) {
      case 'lungs_alveoli_07':
        // "Find the hidden antibody power-up among the capillaries."
        // Implement logic to find and collect the power-up
        // Not implemented in this example
        break;
      case 'stomach_gastric_pit_03':
        // "Collect all digestive enzymes scattered around the room."
        // Implement logic to collect items
        // Not implemented in this example
        break;
      case 'bloodstream_capillary_12':
        // "Defeat all pathogens within a time limit of 60 seconds."
        // Implement timer
        // Not implemented in this example
        break;
      default:
        break;
    }
  }
}

// Trigger Easter Egg Reward
function triggerEasterEgg(reward) {
  immuneCells.push(new ImmuneCellAssist(reward));
  // Optionally, display reward description
  alert("Easter Egg Unlocked: " + getEasterEggDescription(reward));
}

// Get Easter Egg Description
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
  // Update the health bar's width and color
  let healthBar = select('#health');
  if (healthBar) {
    healthBar.style('width', `${player.health}%`);
    if (player.health > 60) {
      healthBar.style('background-color', 'green');
    } else if (player.health > 30) {
      healthBar.style('background-color', 'yellow');
    } else {
      healthBar.style('background-color', 'red');
    }
  }
}

// Update Health Bar Function
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
  
  // Example: Implement shield and invincibility effects
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

// Display Room Status
function displayRoomStatus() {
  // If all opponents are defeated, prompt player to move to a wall to transition
  if (opponents.length === 0 && !loading) {
    fill(255);
    textSize(20);
    textAlign(CENTER, CENTER);
    text("All germs defeated!\nMove to a wall to proceed.", width / 2, 50);
    
    // Check if player is touching a wall
    if (isPlayerAtWall()) {
      transitionToNextRoom();
    }
  }
}

// Check if player is at any wall
function isPlayerAtWall() {
  let buffer = 20; // Distance from wall to trigger transition
  return (player.x <= buffer || player.x >= width - buffer ||
          player.y <= buffer || player.y >= height - buffer);
}
