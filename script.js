// Change the UI to have a start/stop button and a clear button
const CHANGE_UI = true;

// Define constants for the number of milliseconds in a day and a week
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const WEEK_IN_MS = 7 * DAY_IN_MS;

// Define an array of offsets for each of the neighboring cells relative to the current cell
const NEIGHBORS = [
    // top left - (-1 week - 1 day)
    -WEEK_IN_MS - DAY_IN_MS,
    // top - (1 day)
    -DAY_IN_MS,
    // top right - (-1 week + 1 day)
    -WEEK_IN_MS + DAY_IN_MS,
    // left - (-1 week)
    -WEEK_IN_MS,
    // right - (1 week)
    WEEK_IN_MS,
    // bottom left - (1 week - 1 day)
    WEEK_IN_MS - DAY_IN_MS,
    // bottom - (1 day)
    DAY_IN_MS,
    // bottom right - (1 week + 1 day)
    WEEK_IN_MS + DAY_IN_MS,
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
 * @param {number} percentage The percentage of cells that should be on (default is 50).
 */
function randomBoard(percentage = 50) {
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
       // Set the background color of the cell to the specified value
       cell.style.backgroundColor = color;
    });
}


if (CHANGE_UI) {
    const divElement = document.querySelector(
        "div.width-full.f6.px-0.px-md-5.py-1"
    );

    // change from px-md-5 to px-md-3
    divElement.classList.remove("px-md-5");
    divElement.classList.add("px-md-3");

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
                randomBoard(40);
            }
        },
    ]

    for (let i = 0; i < BUTTONS.length; i++) {
        const button = BUTTONS[i];
        const anchorElement = document.createElement("a");
        anchorElement.textContent = button.text;
        // add the id of game-status
        anchorElement.id = button.id;
        // make the cursor a pointer
        anchorElement.style.cursor = "pointer";
        // add a margin left and right of 10px
        anchorElement.style.margin = "0 10px";
        // make it when you click on it, it will start the game
        anchorElement.onclick = button.onclick;
        divElement.insertBefore(anchorElement, divElement.children[i + 1]);
    }


    const link = document.querySelector(
        'a[href="https://docs.github.com/articles/why-are-my-contributions-not-showing-up-on-my-profile"].Link--muted'
    );
    link.innerText = "Learn how this was made";
    // make it rick roll
    link.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
} else {
    clearBoard();
    randomBoard(40);
    startGame();
}











// // function to make the cell alive when you click on it
// function makeAlive(cell) {
//     // get all cells
//     const cells = getAllCells();
//     // loop through all cells
//     for (const cell of cells) {
//         // remove old event listener from cell
//         cell.removeEventListener("click", toggleCell);
//         // add new event listener to cell
//         cell.addEventListener("click", (cell) => {
//             // if cell is alive
//             if (isAlive(cell)) {
//                 // make cell dead
//                 cell.style.backgroundColor = "#161b22";
//             // else
//             } else {
//                 // make cell alive
//                 cell.style.backgroundColor = "#f2f2f2";
//             }
//         });
//     }
// }
