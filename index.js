// sketch.js

// Game Variables
let rooms = [];
let currentRoomIndex = 0;
let currentRoom;
let player;
let bullets = [];
let opponents = [];
let immuneCells = [];
let easterEggTriggered = false;

// Images (Placeholder colors will be used instead of actual images)
let backgroundImages = {};

// Preload function to load images (if available)
function preload() {
  // Load images if you have them
  // Example:
  // backgroundImages['lungs'] = loadImage('images/lungs.png');
  // For placeholders, we'll skip image loading
}

// Setup function
function setup() {
  createCanvas(800, 600);
  
  // Initialize Rooms
  initializeRooms();
  
  // Set the first room
  currentRoom = rooms[currentRoomIndex];
  
  // Initialize Player
  player = new Player();
  
  // Load Opponents for the current room
  loadOpponents(currentRoom);
}

// Draw function
function draw() {
  background(0); // Default background

  // Draw Room Background
  drawRoomBackground(currentRoom);

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
  
  // Check if room is cleared
  if (opponents.length === 0) {
    transitionToNextRoom();
  }
  
  // Check and handle Easter Eggs
  checkEasterEgg();
}

// Initialize Room Data
function initializeRooms() {
  rooms = [
    {
      "roomId": "lungs",
      "background": "lungs",
      "opponents": [
        {
          "type": "virus",
          "count": 5,
          "movementPattern": "coordinated",
          "difficulty": "medium"
        },
        {
          "type": "bacteria",
          "count": 8,
          "movementPattern": "simplePathfinding",
          "difficulty": "easy"
        }
      ],
      "sceneDescription": "You are now in the lungs, where oxygen is exchanged. A viral infection is disrupting the airflow, making it harder for the body to breathe.",
      "diseaseExplanation": "Viruses attack cells in the respiratory system, leading to symptoms like difficulty breathing and coughing.",
      "easterEgg": {
        "triggerTask": "Destroy all viruses without missing any shots.",
        "reward": "ImmuneCellAssist",
        "description": "Completing this task summons immune cells that provide temporary shields."
      }
    },
    {
      "roomId": "stomach",
      "background": "stomach",
      "opponents": [
        {
          "type": "bacteria",
          "count": 10,
          "movementPattern": "simplePathfinding",
          "difficulty": "easy"
        },
        {
          "type": "parasite",
          "count": 3,
          "movementPattern": "aggressive",
          "difficulty": "hard"
        }
      ],
      "sceneDescription": "Inside the stomach, acidic conditions are being compromised by harmful bacteria and parasites, threatening the digestive process.",
      "diseaseExplanation": "Bacterial infections can disrupt digestion, while parasites consume nutrients, weakening the body.",
      "easterEgg": {
        "triggerTask": "Collect all digestive enzymes scattered around the room.",
        "reward": "HealthBoost",
        "description": "Completing this task restores a portion of your health."
      }
    },
    {
      "roomId": "bloodstream",
      "background": "bloodstream",
      "opponents": [
        {
          "type": "virus",
          "count": 7,
          "movementPattern": "coordinated",
          "difficulty": "medium"
        },
        {
          "type": "bacteria",
          "count": 5,
          "movementPattern": "simplePathfinding",
          "difficulty": "easy"
        },
        {
          "type": "fungus",
          "count": 4,
          "movementPattern": "slowAdvance",
          "difficulty": "hard"
        }
      ],
      "sceneDescription": "Navigating through the bloodstream, you encounter a mix of pathogens trying to evade your attacks and spread through the body.",
      "diseaseExplanation": "Pathogens in the bloodstream can quickly reach various organs, making them dangerous and requiring swift action.",
      "easterEgg": {
        "triggerTask": "Defeat all pathogens within a time limit of 60 seconds.",
        "reward": "SpeedBoost",
        "description": "Completing this task temporarily increases your movement and shooting speed."
      }
    },
    {
      "roomId": "skin",
      "background": "skin",
      "opponents": [
        {
          "type": "bacteria",
          "count": 12,
          "movementPattern": "simplePathfinding",
          "difficulty": "easy"
        },
        {
          "type": "virus",
          "count": 4,
          "movementPattern": "coordinated",
          "difficulty": "medium"
        },
        {
          "type": "allergen",
          "count": 2,
          "movementPattern": "randomMovement",
          "difficulty": "hard"
        }
      ],
      "sceneDescription": "On the skin's surface, allergens and microbes are causing irritation and infections, threatening the body's first line of defense.",
      "diseaseExplanation": "Allergens trigger immune responses that can lead to inflammation, while microbes on the skin can cause infections.",
      "easterEgg": {
        "triggerTask": "Identify and eliminate all allergens by targeting their unique markers.",
        "reward": "TemporaryInvisibility",
        "description": "Completing this task makes you invisible to enemies for a short duration."
      }
    }
    // Add more rooms as needed
  ];
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
}

// Draw Room Background
function drawRoomBackground(room) {
  // Placeholder: Change background color based on room
  switch(room.background) {
    case 'lungs':
      background(135, 206, 235); // Sky blue
      break;
    case 'stomach':
      background(255, 165, 0); // Orange
      break;
    case 'bloodstream':
      background(220, 20, 60); // Crimson
      break;
    case 'skin':
      background(245, 222, 179); // Wheat
      break;
    default:
      background(0); // Default black
  }
  
  // If using images, uncomment below and ensure images are loaded
  /*
  if (backgroundImages[room.background]) {
    image(backgroundImages[room.background], 0, 0, width, height);
  }
  */
  
  // Optionally, display scene description and disease explanation
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text(room.sceneDescription, 10, height - 80, 300, 70);
  text(room.diseaseExplanation, 10, height - 40, 300, 30);
}

// Transition to Next Room
function transitionToNextRoom() {
  currentRoomIndex++;
  if (currentRoomIndex < rooms.length) {
    currentRoom = rooms[currentRoomIndex];
    loadOpponents(currentRoom);
    player.resetPosition();
  } else {
    // Game Completed
    noLoop();
    background(0);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Congratulations!\nThe body is germ-free.", width / 2, height / 2);
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

// Opponent Class
class Opponent {
  constructor(type, movementPattern, difficulty, roomId) {
    this.type = type;
    this.movementPattern = movementPattern;
    this.difficulty = difficulty;
    this.roomId = roomId;
    this.size = 30;
    this.health = this.setHealth();
    this.speed = this.setSpeed();
    this.damage = this.setDamage();
    this.color = this.setColor();
    this.x = random(this.size, width - this.size);
    this.y = random(this.size, height - this.size);
    this.target = player;
    this.direction = createVector(0, 0);
    this.movementTimer = 0;
    this.movementInterval = 60; // frames
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
      default:
        this.simplePathfinding();
    }
  }
  
  display() {
    push();
    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, this.size);
    pop();
  }
  
  simplePathfinding() {
    // Move towards the player
    let dir = createVector(player.x - this.x, player.y - this.y);
    dir.normalize();
    this.x += dir.x * this.speed;
    this.y += dir.y * this.speed;
  }
  
  coordinated() {
    // Move in groups or coordinated patterns
    // For simplicity, same as simplePathfinding
    this.simplePathfinding();
    
    // Additional coordinated behavior can be added here
  }
  
  aggressive() {
    // Move faster towards the player
    let dir = createVector(player.x - this.x, player.y - this.y);
    dir.normalize();
    this.x += dir.x * this.speed;
    this.y += dir.y * this.speed;
    
    // Optionally, add shooting behavior
    // Not implemented in this example
  }
  
  slowAdvance() {
    // Move slowly towards the player
    let dir = createVector(player.x - this.x, player.y - this.y);
    dir.normalize();
    this.x += dir.x * this.speed;
    this.y += dir.y * this.speed;
  }
  
  randomMovement() {
    // Move randomly
    if (frameCount % this.movementInterval === 0) {
      this.direction = p5.Vector.random2D();
    }
    this.x += this.direction.x * this.speed;
    this.y += this.direction.y * this.speed;
    
    // Keep within bounds
    this.x = constrain(this.x, this.size / 2, width - this.size / 2);
    this.y = constrain(this.y, this.size / 2, height - this.size / 2);
  }
  
  camouflage() {
    // Move towards the player but occasionally hide or slow down
    let dir = createVector(player.x - this.x, player.y - this.y);
    dir.normalize();
    this.x += dir.x * this.speed;
    this.y += dir.y * this.speed;
    
    // Occasional slowdown or hiding can be implemented here
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
      tint(255, 150);
      ellipse(player.x, player.y, player.size + 10);
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

// Easter Egg Checking Function
function checkEasterEgg() {
  let egg = currentRoom.easterEgg;
  if (egg && !easterEggTriggered) {
    // Implement trigger tasks based on room
    // For simplicity, we'll assume the triggerTask is met when all opponents of a certain type are defeated
    switch(currentRoom.roomId) {
      case 'lungs':
        // "Destroy all viruses without missing any shots."
        // Implement logic to check if all viruses are destroyed without missing
        // For simplicity, trigger when no viruses remain
        let viruses = opponents.filter(op => op.type === 'virus');
        if (viruses.length === 0) {
          triggerEasterEgg(egg.reward);
          easterEggTriggered = true;
        }
        break;
      case 'stomach':
        // "Collect all digestive enzymes scattered around the room."
        // Implement logic to collect items
        // Not implemented in this example
        break;
      case 'bloodstream':
        // "Defeat all pathogens within a time limit of 60 seconds."
        // Implement timer
        // Not implemented in this example
        break;
      case 'skin':
        // "Identify and eliminate all allergens by targeting their unique markers."
        // Implement logic to target specific enemies
        let allergens = opponents.filter(op => op.type === 'allergen');
        if (allergens.length === 0) {
          triggerEasterEgg(egg.reward);
          easterEggTriggered = true;
        }
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
    default:
      description = "You have received a reward!";
      break;
  }
  return description;
}

// Display Health Bar
function displayHealth() {
  // Optional: If using HTML elements for health bar
  let healthBar = select('#health');
  if (healthBar) {
    healthBar.style('width', player.health + '%');
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
}

// Optional: Implement Immune Cells effects on player or opponents
// Not implemented in this example

