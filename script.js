// Change the UI to have a start/stop button and a clear button
const CHANGE_UI = true;

// Define constants for the number of milliseconds in a day and a week
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WEEK_IN_MS = 7 * DAY_IN_MS;

// Define an array of offsets for each of the neighboring cells relative to the current cell
const NEIGHBORS = [
    -WEEK_IN_MS - DAY_IN_MS, // top left - (-1 week - 1 day)
    -DAY_IN_MS, // top - (1 day)
    -WEEK_IN_MS + DAY_IN_MS, // top right - (-1 week + 1 day)
    -WEEK_IN_MS, // left - (-1 week)
    WEEK_IN_MS, // right - (1 week)
    WEEK_IN_MS - DAY_IN_MS, // bottom left - (1 week - 1 day)
    DAY_IN_MS, // bottom - (1 day)
    WEEK_IN_MS + DAY_IN_MS, // bottom right - (1 week + 1 day)
];

// Define the colors that can be used for the cells.
const COLORS = [
    "--color-calendar-graph-day-L4-bg",
    "--color-calendar-graph-day-L3-bg",
    "--color-calendar-graph-day-L2-bg",
    "--color-calendar-graph-day-L1-bg",
];

// Define the background colors for on and off cells.
const BACKGROUND_COLOR_ON = "#39d353";
const BACKGROUND_COLOR_OFF = "#161b22";

// initial state of the game
let started = false;
// fill amount for the random generation
let fillAmount = 50;
// the timer for the game
let timer;

/**
 * Retrieves the DOM element representing the cell for the given date.
 *
 * @param {string} date - The date of the cell to retrieve, in "YYYY-MM-DD" format.
 * @returns {HTMLElement|null} The DOM element representing the cell, or null if not found.
 */
function getCell(date) {
    // return the cell with the matching data-date attribute
    return document.querySelector(`td[data-date="${date}"]`);
}

/**
 * Gets all cells in the calendar.
 * 
 * @returns {HTMLElement[]} An array of all cell elements.
 */
function getAllCells() {
    return document.querySelectorAll("td[data-ix]");
}

/**
 * Formats the provided date object as an ISO 8601 date string (YYYY-MM-DD) as required by the GitHub commit history.
 *
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
function formatDate(date) {
    // Convert the date to an ISO string, then split the string at the "T" character to get just the date portion
    return date.toISOString().split("T")[0];
}

/**
 * Gets the neighboring cells of the cell with the provided date.
 *
 * @param {string} date - The date string of the cell for which to get neighbors.
 * @returns {HTMLElement[]} An array of neighboring cell elements.
 */
function getNeighbors(date) {
    // Get the date object for the current cell
    const currentDate = new Date(date);

    // initialize an array to hold the neighboring cells
    let neighborCells = [];

    // loop through the offsets and add the neighboring cells to the array
    for (let offset of NEIGHBORS) {
        // create a new date object for the neighbor cell by adding the offset to the current cell's date
        let date = new Date(currentDate.getTime() + offset);
        // format the date as an ISO 8601 date string
        let formattedDate = formatDate(date);
        // get the cell for the neighbor date
        let cell = getCell(formattedDate);
        
        // add the cell to the array if it exists
        if (cell) neighborCells.push(cell);
    }
    // return the array of neighboring cells
    return neighborCells;
}

/**
 * Determines whether the specified cell is alive.
 * 
 * @param {HTMLElement} cell - The DOM element representing the cell to check if alive.
 * @returns {boolean} True if the cell is alive, false otherwise.
 */
function isAlive(cell) {
    // handle null cells (a date may go out of the calendar)
    if (!cell || !cell.style) return false;

    // check if the cell is alive by getting its background color and checking against the default background color
    return cell.style.backgroundColor !== "rgb(22, 27, 34)";
}

/**
 * Returns an array of the alive neighbors of the provided cell.
 *
 * @param {HTMLElement} cell - The DOM element representing the cell to check neighbors for.
 * @returns {HTMLElement[]} An array of the DOM elements representing the alive neighbors.
 */
function getAliveNeighbors(cell) {
    // Get the neighbors of the cell
    let neighbors = getNeighbors(cell.dataset.date);
    // return the filtered list of neighbors that are alive
    return neighbors.filter(isAlive);
}

/**
 * Returns an array of the dead neighbors of the provided cell.
 *
 * @param {HTMLElement} cell - The DOM element representing the cell to check neighbors for.
 * @returns {HTMLElement[]} An array of the DOM elements representing the dead neighbors.
 */
function getDeadNeighbors(cell) {
    // Get the neighbors of the cell
    let neighbors = getNeighbors(cell.dataset.date);
    // return the filtered list of neighbors that are dead
    return neighbors.filter((neighborCell) => !isAlive(neighborCell));
}

/**
 * Returns the count of the alive neighbors of the provided cell.
 *
 * @param {HTMLElement} cell - The DOM element representing the cell to count neighbors for.
 * @returns {number} The count of the alive neighbors.
 */
function getAliveNeighborsCount(cell) {
    // Get the count of alive neighbors for the cell.
    return getAliveNeighbors(cell).length;
}

/**
 * Returns the count of the dead neighbors of the provided cell.
 *
 * @param {HTMLElement} cell - The DOM element representing the cell to count neighbors for.
 * @returns {number} The count of the dead neighbors.
 */
function getDeadNeighborsCount(cell) {
    // Get the count of dead neighbors for the cell.
    return getDeadNeighbors(cell).length;
}

/**
 * Determines whether the specified cell will survive in the next generation based on the number of alive neighbors.
 * 
 * @param {number} aliveNeighborsCount - The number of alive neighbors for the cell.
 * @returns {boolean} - True if the cell will survive, false otherwise.
 */
function willLive(aliveNeighborsCount) {
    // A cell will survive in the next generation if it has 2 or 3 alive neighbors.
    return aliveNeighborsCount === 2 || aliveNeighborsCount === 3;
}

/**
 * Determines whether the specified cell will be born in the next generation based on the number of alive neighbors.
 * 
 * @param {number} aliveNeighborsCount - The number of alive neighbors for the cell.
 * @returns {boolean} - True if the cell will be born, false otherwise.
 */
function willBeBorn(aliveNeighborsCount) {
    // A cell will be born in the next generation if it has exactly three alive neighbors.
    return aliveNeighborsCount === 3;
}

/**
 * Returns an array of cells that will be alive in the next generation based on the current generation's state.
 * 
 * @returns {HTMLElement[]} Array of cells that will be alive in the next generation.
 */
function getNextGeneration() {
    // Get all cells on the game board
    let cells = getAllCells();

    // Array to hold cells that will be alive in the next generation
    let nextGeneration = [];

    // Iterate over each cell
    cells.forEach((cell) => {
        // Check if the cell is currently alive
        let isCellAlive = isAlive(cell);
        // Get the count of alive neighbors for the cell
        let aliveNeighborsCount = getAliveNeighborsCount(cell);

        // Check if the cell will survive to the next generation or be born in the next generation
        if ((isCellAlive && willLive(aliveNeighborsCount)) || (!isCellAlive && willBeBorn(aliveNeighborsCount))) {
            // Add the cell to the next generation
            nextGeneration.push(cell);
        }
    });

    // Return the cells that will be alive in the next generation
    return nextGeneration;
}

/**
 * Clear the game board by setting the background color of each cell to a default value
 */
function clearBoard() {
    // get all the cells on the game board
    let cells = getAllCells();

    // iterate over each cell and set the background color to the default value
    cells.forEach((cell) => {
        cell.style.backgroundColor = "#161b22"; // default background color
    });
}

/**
 * Renders the next generation of cells on the board with randomized colors.
 */
function renderNextGeneration() {
    // Get the next generation of cells.
    let nextGeneration = getNextGeneration();

    // Clear the board.
    clearBoard();

    // For each cell in the next generation, set its background color to a randomly selected color.
    nextGeneration.forEach((cell) => {
        let randomColor = COLORS[Math.floor(Math.random() * COLORS.length)]; // Generate a random color from the COLORS array.
        cell.style.setProperty("background-color", `var(${randomColor})`); // Set the cell's background color to the generated color.
    });
}

/**
 * Sets the board to a random state.
 * @param {number} percentage The percentage of cells that should be on (default is the fillAmount).
 */
function randomBoard(percentage = fillAmount) {
    // Select all cells on the board.
    let cells = getAllCells();

    // For each cell, generate a random number between 0 and 99 and set its background color based on the given percentage.
    cells.forEach((cell) => {
        // Generate a random number between 0 and 99.
        let random = Math.floor(Math.random() * 100); 
        
        // Set the background color based on the random number and the given percentage.
        let backgroundColor = random < percentage ? BACKGROUND_COLOR_ON : BACKGROUND_COLOR_OFF;
        
        // Set the cell's background color to the generated color.
        cell.style.backgroundColor = backgroundColor;
    });
}

/**
 * Increases the fill percentage by 10.
 */
function increaseFill() {
    // max fill is 100
    if (fillAmount == 100) return;

    // increase fill by 10
    fillAmount += 5;

    // update the the fill display to reflect the new fill percentage
    updateFillDisplay();
}

/**
 * Decreases the fill percentage by 10.
 */
function decreaseFill() {
    // min fill is 0
    if (fillAmount == 0) return;

    // decrease fill by 10
    fillAmount -= 5;

    // update the the fill display to reflect the new fill percentage
    updateFillDisplay();
}

/**
 * Function to update the fill display of the contribution graph based on fillAmount
 * The fill graph is made up of 5 SVGs, each representing 20% of the fill amount the following function changes the intensity of the color of each SVG based on the fill amount.
 */
function updateFillDisplay() {

    // Select all the SVGs within the specified DOM element
    const svgs = document.querySelectorAll('.float-right.color-fg-muted rect');
  
    // Set the default color to the background color of the SVGs
    let color = "var(--color-calendar-graph-day-bg)";
  
    // Loop through each SVG and update the color based on the fillAmount
    svgs.forEach((svg, i) => {
        switch (true) {
            // 100%
            case fillAmount >= (20 + (i * 20)):
                color = "var(--color-calendar-graph-day-L4-bg)";
                break;
            // 75%
            case fillAmount >= (15 + (i * 20)):
                color = "var(--color-calendar-graph-day-L3-bg)";
                break;
            // 50%
            case fillAmount >= (10 + (i * 20)):
                color = "var(--color-calendar-graph-day-L2-bg)";
                break;
            // 25%
            case fillAmount >= (5 + (i * 20)):
                color = "var(--color-calendar-graph-day-L1-bg)";
                break;
            // 0%
            default:
                color = "var(--color-calendar-graph-day-bg)";
        }
  
      // Update the fill color and background color of the SVG with the calculated color
      svg.style.fill = color;
      svg.style.backgroundColor = color;
    });
}

/**
 * Display the number of alive neighbors for each cell on the game board.
 */
function showNeighbors() {
    // get all the cells on the game board
    let cells = getAllCells();

    // iterate over each cell and set the background color to the default value
    cells.forEach((cell) => {
        // get the number of alive neighbors for the cell
        let aliveNeighborsCount = getAliveNeighborsCount(cell);
        // set the background color of the cell to the default value
        cell.innerHTML = `<div style="font-size: 6px" class="alive">${aliveNeighborsCount}</div>`;
    });
}

/**
 * Remove the display that shows the number of alive neighbors for each cell on the game board.
 */
function hideNeighbors() {
    // get all the cells on the game board
    let cells = getAllCells();

    // iterate over each cell and set the background color to the default value
    cells.forEach((cell) => {
        // set the background color of the cell to the default value
        cell.innerHTML = "";
    });
}

/**
 * Start the interval timer that will render the next generation of cells.
 */
function startGame() {
    // check if the game is already running don't start it again
    if (started) return;
    started = true;

    let statusButton = document.getElementById("game-status");
    if (statusButton) {
        statusButton.textContent = "Stop";
        // change the button to stop
        statusButton.onclick = stopGame;
    }

    timer = setInterval(() => {
        renderNextGeneration();
        // showNeighbors();
    }, 20);
}

/**
 * Stop the interval timer that renders the next generation of cells.
 */
function stopGame() {
    if (!started) return;
    started = false;

    let statusButton = document.getElementById("game-status");
    if (statusButton) {
        statusButton.textContent = "Play";
        // change the button to play
        statusButton.onclick = startGame;
    }

    clearInterval(timer);
}

/**
 * Sets the background color of cells in the game of life grid to form a specific pattern.
 *
 * @param {string[]} pattern An array of dates that correspond to the cells that form the desired pattern.
 * @param {string} color The background color to set the cells.
 *
 * @example
 * Block pattern
 * setPattern(["2022-09-14", "2022-09-15", "2022-09-21", "2022-09-22"], "#39d353");
 *
 * @example
 * Blinker pattern
 * setPattern(["2022-09-14", "2022-09-15", "2022-09-16"], "#39d353");
 *
 * @example
 * Beacon pattern
 * setPattern(["2022-09-14", "2022-09-15", "2022-09-21", "2022-09-22", "2022-09-19", "2022-09-20", "2022-09-26", "2022-09-27"], "#39d353");
 * 
 * @example
 * Glider pattern
 * setPattern(["2022-03-23", "2022-03-30", "2022-04-06", "2022-04-05", "2022-03-28"], "#39d353");
 */
function setPattern(pattern, color) {
    pattern.forEach((date) => {
        // Get the cell that corresponds to the date
        let cell = getCell(date);

        if (!cell) {
            console.warn(`Cell for date ${date} not found`);
            return;
        }

        // Set the background color of the cell to the specified value
        cell.style.backgroundColor = color;
    });
}


if (CHANGE_UI) {

    // get the div element that contains the buttons
    const divElement = document.querySelector(
        "div.width-full.f6.px-0.px-md-5.py-1"
    );

    // change from px-md-5 to px-md-3 gives the ui more space while still aligning with the calendar
    divElement.classList.remove("px-md-5");
    divElement.classList.add("px-md-3");

    // new UI buttons
    const BUTTONS = [
        {
            "text": "Play",
            "id": "game-status",
            "onclick": startGame
        },
        {
            "text": "Clear",
            "id": "clear-board",
            "onclick": clearBoard
        },
        {
            "text": "Random",
            "id": "random-board",
            "onclick": () => {
                randomBoard();
            }
        },
    ]

    for (let i = 0; i < BUTTONS.length; i++) {
        const button = BUTTONS[i]; // get the button
        const anchorElement = document.createElement("a"); // create new anchor element for the button
        anchorElement.textContent = button.text; // Change the text
        anchorElement.id = button.id; // give it the corresponding id
        anchorElement.style.cursor = "pointer"; // Make the cursor a pointer
        anchorElement.style.margin = "0 10px"; // add margin to the sides
        anchorElement.onclick = button.onclick; // make it clickable
        divElement.insertBefore(anchorElement, divElement.children[i + 1]); // insert the button so that it is in the middle
    }


    const link = document.querySelector('a[href="https://docs.github.com/articles/why-are-my-contributions-not-showing-up-on-my-profile"].Link--muted');
    link.innerText = "Learn how this was made"; // Change the text
    link.href = "https://github.com/TravisPooley/Conways-Game-of-Life-Simulation-Senior-Developer-Edition"; // Change the link to the repo


    // Get the parent element that contains the text nodes
    const parentEl = document.querySelector('.float-right.color-fg-muted');

    // Create a new span element for "Less"
    const lessSpan = document.createElement('span');
    lessSpan.textContent = ' Less '; // Set the text content
    lessSpan.style.cursor = 'pointer'; // Make the cursor a pointer
    lessSpan.style.userSelect = 'none'; // Prevent the text from being selected

    // Create a new span element for "More"
    const moreSpan = document.createElement('span');
    moreSpan.textContent = ' More '; // Set the text content
    moreSpan.style.cursor = 'pointer'; // Make the cursor a pointer
    moreSpan.style.userSelect = 'none'; // Prevent the text from being selected

    // Replace the "Less" text node with the new "Less" span element
    parentEl.replaceChild(lessSpan, parentEl.childNodes[0]);

    // Replace the "More" text node with the new "More" span element
    parentEl.replaceChild(moreSpan, parentEl.childNodes[parentEl.childNodes.length - 1]);

    // Set the onClick functions for the span elements
    moreSpan.onclick = increaseFill;
    lessSpan.onclick = decreaseFill;

    updateFillDisplay();



} else {
    clearBoard();
    randomBoard(40);
    startGame();
}



