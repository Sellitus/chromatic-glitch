import Matter from 'matter-js';

// Alias Matter.js modules
const Engine = Matter.Engine;
const Render = Matter.Render; // For debugging, might remove later
const Runner = Matter.Runner;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Events = Matter.Events;
const Body = Matter.Body;
const Vector = Matter.Vector;

/**
 * Manages the physics simulation for dice rolling using Matter.js.
 */
export class DicePhysics {
  /**
   * Creates a new DicePhysics instance.
   * @param {HTMLElement} renderElement - Optional DOM element for debug rendering.
   * @param {function} onSettleCallback - Callback when dice settle. Signature: (results: Array<{id: string, value: number}>) => void
   */
  constructor(renderElement, onSettleCallback) {
    this.engine = Engine.create();
    this.world = this.engine.world;
    this.runner = Runner.create(); // Manages the engine update loop
    this.onSettleCallback = onSettleCallback;
    this.bodyToDieIdMap = new Map(); // Map<number, string> (Matter body.id to Die.id)
    this.settlingThreshold = 0.1; // Velocity/angular velocity below which a die is considered potentially settled
    this.settleCheckInterval = 500; // ms between checks for settled dice
    this.lastSettleCheckTime = 0;
    this.rollingBodies = new Set(); // Keep track of bodies currently expected to be moving

    // Disable gravity for a top-down view feel, or adjust as needed
    this.world.gravity.y = 0; // No vertical gravity
    this.world.gravity.x = 0; // No horizontal gravity (unless desired)

    // Optional: Setup debug renderer
    if (renderElement) {
      this.setupDebugRenderer(renderElement);
    }

    this.setupBounds(); // Create walls/boundaries

    // Event listener for engine updates (after physics step)
    Events.on(this.engine, 'afterUpdate', this.checkSettlement.bind(this));

    // Start the physics engine runner
    Runner.run(this.runner, this.engine);
    console.log("DicePhysics initialized and runner started.");
  }

  setupDebugRenderer(element) {
    const render = Render.create({
      element: element,
      engine: this.engine,
      options: {
        width: 800, // Adjust as needed
        height: 600,
        wireframes: false, // Show solid shapes
      },
    });
    Render.run(render);
    console.log("DicePhysics debug renderer started.");
  }

  setupBounds() {
    // Create boundaries (walls) for the dice area
    const wallOptions = { isStatic: true };
    const width = 800; // Match debug renderer or game area width
    const height = 600; // Match debug renderer or game area height
    const thickness = 50;

    Composite.add(this.world, [
      Bodies.rectangle(width / 2, -thickness / 2, width, thickness, wallOptions), // Top
      Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, wallOptions), // Bottom
      Bodies.rectangle(-thickness / 2, height / 2, thickness, height, wallOptions), // Left
      Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, wallOptions), // Right
    ]);
  }

  /**
   * Creates a physics body for a given die instance.
   * @param {Die} die - The Die instance.
   * @returns {Matter.Body} The created physics body.
   */
  addBody(die) {
    // For simplicity, represent all dice as squares for now
    // Adjust size, shape (e.g., Bodies.polygon for d4/d8) as needed
    const size = 50; // Visual size, adjust as needed
    const body = Bodies.rectangle(
      Math.random() * 600 + 100, // Random initial X position within bounds
      Math.random() * 400 + 100, // Random initial Y position within bounds
      size,
      size,
      {
        restitution: 0.5, // Bounciness
        friction: 0.1,    // Surface friction
        frictionAir: 0.02, // Air resistance (damping)
        // density: 0.001 // Adjust mass if needed
      }
    );

    // Store mapping from Matter's internal body ID to our Die ID
    this.bodyToDieIdMap.set(body.id, die.id);
    Composite.add(this.world, body);
    console.log(`Physics body added for die ${die.id} (Body ID: ${body.id})`);
    return body;
  }

  /**
   * Removes a physics body from the world.
   * @param {Matter.Body} body - The body to remove.
   */
  removeBody(body) {
    if (body) {
      this.bodyToDieIdMap.delete(body.id);
      this.rollingBodies.delete(body.id); // Ensure it's not tracked if removed mid-roll
      Composite.remove(this.world, body);
      console.log(`Physics body removed: ${body.id}`);
    }
  }

  /**
   * Applies initial random forces and torque to start dice rolling.
   * @param {Matter.Body[]} bodies - The bodies to roll.
   */
  roll(bodies) {
    bodies.forEach(body => {
      if (!body) return;

      // Wake the body up if it was sleeping
      Body.setSleeping(body, false);

      // Apply random force
      const forceMagnitude = 0.05; // Adjust as needed
      const force = {
        x: (Math.random() - 0.5) * forceMagnitude,
        y: (Math.random() - 0.5) * forceMagnitude,
      };
      Body.applyForce(body, body.position, force);

      // Apply random torque (rotation)
      const torqueMagnitude = 0.1; // Adjust as needed
      const torque = (Math.random() - 0.5) * torqueMagnitude;
      Body.setAngularVelocity(body, 0); // Reset angular velocity before applying torque
      Body.setTorque(body, torque);

      // Mark this body as rolling
      this.rollingBodies.add(body.id);
      console.log(`Applied roll force/torque to body ${body.id}`);
    });
    // Reset settle check timer to allow movement
    this.lastSettleCheckTime = Date.now();
  }

  /**
   * Sets the physics properties of a body based on locked state.
   * @param {Matter.Body} body - The body to modify.
   * @param {boolean} isLocked - Whether the die is locked.
   */
  setLockedState(body, isLocked) {
    if (!body) return;
    Body.setStatic(body, isLocked);
    // Optionally change visual properties or collision filters here too
    console.log(`Body ${body.id} static state set to: ${isLocked}`);
     if (!isLocked) {
         // Ensure body is awake if unlocked
         Body.setSleeping(body, false);
     } else {
         // Remove from rolling set if locked mid-roll
         this.rollingBodies.delete(body.id);
     }
  }

  /**
   * Removes all dice bodies from the physics world.
   */
  clearAllBodies() {
    const allBodies = Composite.allBodies(this.world);
    // Filter out static boundary walls before removing
    const bodiesToRemove = allBodies.filter(body => !body.isStatic && this.bodyToDieIdMap.has(body.id));
    bodiesToRemove.forEach(body => this.removeBody(body)); // Use removeBody to clean up maps too
    console.log("Cleared all dynamic dice bodies from physics world.");
  }

  /**
   * Checks if rolling bodies have settled based on velocity thresholds.
   * Called automatically after each engine update.
   */
  checkSettlement() {
    const now = Date.now();
    // Only check periodically and if there are bodies expected to be rolling
    if (this.rollingBodies.size === 0 || now - this.lastSettleCheckTime < this.settleCheckInterval) {
      return;
    }

    this.lastSettleCheckTime = now;
    const settledResults = [];
    const stillRolling = new Set();

    this.rollingBodies.forEach(bodyId => {
      const body = Composite.get(this.world, bodyId, 'body');
      if (!body) {
          console.warn(`Body ID ${bodyId} not found during settlement check.`);
          return; // Body might have been removed
      }

      const speed = Vector.magnitude(body.velocity);
      const angularSpeed = Math.abs(body.angularVelocity);

      if (speed < this.settlingThreshold && angularSpeed < this.settlingThreshold) {
        // Body is considered settled
        const dieId = this.bodyToDieIdMap.get(bodyId);
        if (dieId) {
          const value = this.determineFaceValue(body);
          settledResults.push({ id: dieId, value: value });
          console.log(`Body ${bodyId} (Die ${dieId}) settled with value ${value}`);
        } else {
            console.warn(`No Die ID found for settled body ${bodyId}`);
        }
        // Don't add to stillRolling set
      } else {
        // Body is still moving
        stillRolling.add(bodyId);
      }
    });

    // Update the set of rolling bodies
    this.rollingBodies = stillRolling;

    // If any dice settled in this check, report them
    if (settledResults.length > 0 && this.onSettleCallback) {
      // It's possible dice settle in batches, decide if callback should be immediate
      // or wait until ALL rollingBodies are settled. Let's report immediately for now.
      this.onSettleCallback(settledResults);
    }

     // Optional: If ALL originally rolling dice are now settled, maybe a final confirmation?
     // if (this.rollingBodies.size === 0 && settledResults.length > 0) {
     //    console.log("All dice have settled.");
     // }
  }

  /**
   * Determines the face value of a settled die based on its orientation.
   * THIS IS A SIMPLIFIED PLACEHOLDER for 2D squares.
   * Real implementation needs a robust way to map 2D angle to 3D die face.
   * @param {Matter.Body} body - The settled body.
   * @returns {number} The determined face value (1-6 for now).
   */
  determineFaceValue(body) {
    // Placeholder: Use angle to roughly determine value for a D6
    // Normalize angle to 0-2PI
    const angle = body.angle % (2 * Math.PI);
    const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;

    // Divide 2PI into 6 segments (for a D6)
    const segment = (2 * Math.PI) / 6;

    // Determine value based on which segment the angle falls into
    // This is highly arbitrary and needs proper mapping based on die geometry/textures
    if (normalizedAngle < segment) return 1;
    if (normalizedAngle < 2 * segment) return 2;
    if (normalizedAngle < 3 * segment) return 3;
    if (normalizedAngle < 4 * segment) return 4;
    if (normalizedAngle < 5 * segment) return 5;
    return 6;

    // A more robust method might involve:
    // - Using 3D physics if possible.
    // - Defining specific vectors for each face in the body's local coordinates
    //   and checking which one points most "upwards" (against gravity or towards a reference vector)
    //   after settling.
    // - Using sensors attached to the body.
  }

  /**
   * Provides the current physics state (position, rotation) for rendering.
   * @returns {Array<{id: string, position: {x: number, y: number}, angle: number}>}
   */
  getPhysicsDataForRendering() {
      const data = [];
      const allBodies = Composite.allBodies(this.world);
      allBodies.forEach(body => {
          if (!body.isStatic && this.bodyToDieIdMap.has(body.id)) { // Only dynamic dice bodies
              const dieId = this.bodyToDieIdMap.get(body.id);
              data.push({
                  id: dieId,
                  position: { x: body.position.x, y: body.position.y },
                  angle: body.angle,
              });
          }
      });
      return data;
  }

  // Method to stop the physics engine runner if needed
  stop() {
      Runner.stop(this.runner);
      // If using debug renderer: Render.stop(this.render);
      console.log("DicePhysics runner stopped.");
  }
}
