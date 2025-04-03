/** @jest-environment node */
// tests/integration/appStartup.test.js
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');
const fetch = require('node-fetch'); // Import node-fetch

const APP_URL = 'http://127.0.0.1:9000'; // Use explicit IPv4 loopback
const PROJECT_DIR = path.resolve(__dirname, '../..'); // Adjust if your tests dir is nested differently

describe('Application Startup and Basic Health Check', () => {
  let browser;
  let page;
  let appProcess;
  let appReady = false;
  let startupError = null;

  // Increase Jest timeout for browser tests and server startup
  jest.setTimeout(90000); // 90 seconds

  beforeAll(async () => {
    // Start the development server
    // Add --no-hot to potentially stabilize server startup in test environment
    appProcess = spawn('npm', ['run', 'start', '--', '--no-hot'], {
      cwd: PROJECT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'], // Pipe stdout and stderr
      detached: true, // Allows killing the process tree
    });

    console.log(`Starting 'npm start' (PID: ${appProcess.pid})...`);

    // Capture stdout/stderr for debugging and readiness check
    let startupOutput = ''; // Accumulate all output
    let pollTimer = null; // Timer for polling the server

    // Declare timeoutTimer outside the promise so finally can access it
    let timeoutTimer;
    const readinessTimeout = 75000; // Increase internal timeout to 75 seconds
    const initialPollingDelay = 5000; // Start polling after 5 seconds

    // Re-declare the promise with the timeout logic correctly scoped
    const actualReadyPromise = new Promise((resolve, reject) => {

      // Function to check if the server is responding
      const checkServerReady = async () => {
        try {
          console.log(`Polling ${APP_URL}...`); // Log each poll attempt
          const response = await fetch(APP_URL, { method: 'GET', timeout: 1500 }); // Short timeout for poll
          if (response.ok) { // Check for 2xx status code
            console.log(`Server responded OK from ${APP_URL}. Ready.`);
            if (pollTimer) clearInterval(pollTimer);
            appReady = true;
            resolve(); // Resolve the main promise
            return true; // Stop polling
          }
          console.log(`Server responded with status ${response.status}. Polling...`); // Log non-OK status
          return false; // Continue polling
        } catch (error) {
          // Network errors likely mean server is not ready yet
          console.log(`Polling ${APP_URL} failed: ${error.message}. Retrying...`); // Log fetch errors
          return false; // Continue polling
        }
      };

      // Function to start polling the server endpoint
      const startPolling = () => {
        if (pollTimer || appReady) return; // Don't start multiple pollers or poll if already ready
        console.log(`Starting server polling after initial delay...`); // Updated log message
        // Initial check
        checkServerReady().then(ready => {
          if (!ready && !pollTimer) { // Start interval only if not ready and timer not set
             pollTimer = setInterval(async () => { // Assign to pollTimer here
               if (await checkServerReady()) {
                 // Ensure interval is cleared from within the callback upon success
                 if (pollTimer) clearInterval(pollTimer); // Clear the correct timer variable
                  pollTimer = null;
               }
             }, 2000); // Poll every 2 seconds
          }
        });
      };

       // Just accumulate stdout for debugging purposes if needed
       appProcess.stdout.on('data', (data) => {
         startupOutput += data.toString();
       });

       // Listen on STDERR for webpack-dev-server output (for logging only now)
       appProcess.stderr.on('data', (data) => {
         const output = data.toString();
         startupOutput += output;
         console.error(`[App STDERR]: ${output.trim()}`); // Keep logging stderr
         // Removed the polling trigger logic from here
       });

       appProcess.on('error', (err) => {
         console.error('Failed to start subprocess.', err);
         startupError = err;
         if (pollTimer) clearInterval(pollTimer);
         reject(err);
       });

       appProcess.on('exit', (code, signal) => {
         if (!appReady) {
            const message = `App process exited prematurely with code ${code}, signal ${signal}. Output:\n${startupOutput}`;
            console.error(message);
            startupError = new Error(message);
            if (pollTimer) clearInterval(pollTimer);
            reject(startupError);
         }
       });

      // Start polling after a fixed delay
      setTimeout(startPolling, initialPollingDelay);

      // Setup the timeout inside the promise constructor
      timeoutTimer = setTimeout(() => {
        if (!appReady) {
          const message = `App server did not become ready (polling ${APP_URL}) within the timeout (${readinessTimeout / 1000}s). Output:\n${startupOutput}`;
          console.error(message);
          startupError = new Error(message);
          if (pollTimer) clearInterval(pollTimer);
          reject(startupError);
        }
      }, readinessTimeout);

    }).catch(() => {
      // Catch needed to prevent unhandled rejection, actual error handling is done inside
    }).finally(() => {
      // Clear the timeout regardless of outcome
      clearTimeout(timeoutTimer);
    });

    try {
      // Wait for the correctly scoped promise
      await actualReadyPromise;
      console.log('App server started successfully.');
    } catch (error) {
      console.error('Failed to start app server:', error);
      // Ensure the process is killed if startup failed
      if (appProcess && appProcess.pid) {
        try {
          // Kill the entire process group (works on Unix-like systems)
          process.kill(-appProcess.pid, 'SIGTERM');
          console.log(`Sent SIGTERM to process group ${appProcess.pid}`);
        } catch (killError) {
          console.error(`Error killing process group ${appProcess.pid}:`, killError);
          // Fallback: try killing just the main process
          try {
            appProcess.kill('SIGTERM');
            console.log(`Sent SIGTERM to main process ${appProcess.pid}`);
          } catch (mainKillError) {
             console.error(`Error killing main process ${appProcess.pid}:`, mainKillError);
          }
        }
      }
      // Rethrow the error to fail the test suite setup
      throw error;
    }


    // Launch Puppeteer only if the server started
    browser = await puppeteer.launch({
      // headless: false, // Uncomment for debugging
      // slowMo: 50, // Slow down operations for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Common args for CI environments
    });
    page = await browser.newPage();

    // --- Add Request Interception ---
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().endsWith('/favicon.ico')) {
        // console.log('Aborting favicon request:', request.url());
        request.abort();
      } else {
        request.continue();
      }
    });
    // --- End Request Interception ---

  });

  afterAll(async () => {
    await browser?.close();
    console.log('Browser closed.');

    if (appProcess && appProcess.pid) {
      console.log(`Attempting to stop 'npm start' process (PID: ${appProcess.pid})...`);
      try {
        // Kill the entire process group (works on Unix-like systems)
        // The negative PID sends the signal to the entire process group.
        process.kill(-appProcess.pid, 'SIGTERM');
        console.log(`Sent SIGTERM to process group ${appProcess.pid}`);
      } catch (e) {
        console.error(`Error killing process group ${appProcess.pid}, attempting to kill main process:`, e);
         try {
            appProcess.kill('SIGTERM'); // Fallback for systems where process group killing might fail or isn't supported
            console.log(`Sent SIGTERM to main process ${appProcess.pid}`);
         } catch (e2) {
            console.error(`Failed to kill main process ${appProcess.pid}:`, e2);
         }
      }
      // Add a small delay to allow the process to terminate
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
        console.log('App process was not running or PID not found.');
    }
  });

  test('should load the page without console or page errors', async () => {
    if (startupError) {
        throw new Error(`Skipping test due to server startup failure: ${startupError.message}`);
    }
    if (!page) {
        throw new Error("Puppeteer page is not initialized. Server might have failed to start.");
    }

    const errors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Ignore the specific error caused by aborting the favicon request
        if (msg.text().includes('net::ERR_FAILED')) {
          // console.log('Ignoring known ERR_FAILED for aborted request.');
          return;
        }
        console.log(`[Browser Console Error]: ${msg.text()}`);
        errors.push(msg.text());
      }
      // Optional: Log other console messages for debugging
      // else {
      //   console.log(`[Browser Console ${msg.type()}]: ${msg.text()}`);
      // }
    });

    page.on('pageerror', err => {
      console.log(`[Browser Page Error]: ${err.message}`);
      errors.push(err.message);
    });

    try {
      console.log(`Navigating to ${APP_URL}...`);
      await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 }); // Wait for DOM content only
      console.log('Page navigation complete.');

      // Optional: Wait for a specific element to ensure the app is fully loaded
      // await page.waitForSelector('#app-container', { timeout: 10000 });
      // console.log('#app-container found.');

      // Add a small delay just in case some async errors pop up after load
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Error during page navigation or waiting: ${error}`);
      // Take a screenshot on error for debugging
      const screenshotPath = path.join(__dirname, 'error-screenshot.png');
       try {
           await page.screenshot({ path: screenshotPath });
           console.log(`Screenshot saved to ${screenshotPath}`);
       } catch (screenshotError) {
           console.error(`Failed to take screenshot: ${screenshotError}`);
       }
      // Fail the test immediately if navigation fails
      throw new Error(`Failed to load ${APP_URL}: ${error.message}`);
    }

    // Assert that no errors were collected
    expect(errors).toEqual([]);
  });

  test('should display essential UI elements', async () => {
    if (startupError) {
      throw new Error(`Skipping test due to server startup failure: ${startupError.message}`);
    }
    if (!page) {
      throw new Error("Puppeteer page is not initialized.");
    }

    // Wait for the main canvas element used by PixiJS (assuming it exists)
    // Adjust the selector if your canvas has a specific ID or class
    const canvasSelector = 'canvas'; // Common tag for canvas
    try {
      console.log(`Waiting for selector: ${canvasSelector}`);
      await page.waitForSelector(canvasSelector, { visible: true, timeout: 15000 });
      console.log(`${canvasSelector} is visible.`);
    } catch (error) {
      throw new Error(`Failed to find or verify visibility of the main canvas ('${canvasSelector}'): ${error.message}`);
    }

    // Check for the PixiJS DrawPileDisplay component within the Pixi stage
    const drawPileName = 'DrawPileDisplay'; // Name set in PixiDrawPileDisplay.js
    try {
      console.log(`Checking for PixiJS object: ${drawPileName}`);

      // Wait until the DrawPileDisplay object exists and is visible in the Pixi stage
      await page.waitForFunction(
        (name) => {
        if (!window.__PIXI_APP__ || !window.__PIXI_APP__.stage) {
          return false; // Pixi app not ready or exposed
        }
        // Recursive function to find a child by name
        function findChildByName(container, childName) {
            if (container.name === childName) {
                return container;
            }
            if (!container.children) {
                return null;
            }
            // Use a standard for loop to avoid potential transpilation issues in evaluate context
            for (let i = 0; i < container.children.length; i++) {
                const child = container.children[i];
                const found = findChildByName(child, childName);
                if (found) {
                    return found;
                }
            }
            return null;
        }

        const drawPile = findChildByName(window.__PIXI_APP__.stage, name);
        // Check if found and if its direct visible property is true
        return !!(drawPile && drawPile.visible);
        },
        { timeout: 15000 }, // Increased timeout for scene loading + rendering
        drawPileName
      );

      console.log(`PixiJS object '${drawPileName}' was found and is visible.`);

      // Optional: Add a basic interaction test if applicable
      // console.log(`Attempting to click ${drawPileSelector}`);
      // await page.click(drawPileSelector);
      // console.log(`${drawPileSelector} clicked.`);
      // Add assertions here to check the result of the interaction if needed

    } catch (error) {
       // If the draw pile *must* be present on startup, fail the test.
       // waitForFunction throws its own error on timeout
       throw new Error(`PixiJS object '${drawPileName}' did not appear or become visible within the timeout: ${error.message}`);
    }

    // Add checks for other critical UI elements as needed
    // e.g., hand container, discard pile, end turn button
  });

});