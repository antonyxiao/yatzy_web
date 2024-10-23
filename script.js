const expandButton = document.getElementById('expandButton');
const columnCountInput = document.getElementById('columnCount');
const dynamicTable = document.getElementById('dynamicTable').getElementsByTagName('tbody')[0];
const headerRow = document.getElementById('headerRow');
const tableContainer = document.getElementById('tableContainer');

const initialRows = 12;

let selectedDice = []; // Global variable to store selection state
                
let needSelectionListener = true;

// Get references to the dice elements
const diceElements = [
    document.getElementById('dice1'),
    document.getElementById('dice2'),
    document.getElementById('dice3'),
    document.getElementById('dice4'),
    document.getElementById('dice5')
];


function createTable(rows, cols) {
    // Clear existing rows and headers
    dynamicTable.innerHTML = '';
    headerRow.innerHTML = '';
    
    categories = ['Ones', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes', 'Three of a Kind', 'Four of a Kind', 'Full House', 'Straight', 'Yatzy'];

    // Create header
    for (let j = 0; j < cols; j++) {
        const headerCell = document.createElement('th');

        // first header
        if (j === 0) {
            headerCell.innerText = "Categories";
        } else {
            headerCell.innerText = `Player ${j}`;
            headerCell.setAttribute("id", `p${j}`);
        }
        headerRow.appendChild(headerCell);
    }

    // Create rows and columns
    for (let i = 0; i < rows; i++) {
        const row = dynamicTable.insertRow();
        for (let j = 0; j < cols; j++) {
            const cell = row.insertCell();
            
            // categories cell
            if (j === 0 && i == rows - 1) {
                cell.innerHTML = '<b>Score</b>';
            } else if (j === 0 ) {
                cell.innerText = categories[i];
            } else {
                // start with empty cells
                cell.innerText = '';
                cell.setAttribute("id", `c${j}_${i}`);
            }
        }
    }

    // Adjust the column width dynamically based on the number of columns
    const columnWidth = 100 / cols;
    const thElements = headerRow.getElementsByTagName('th');
    for (let th of thElements) {
        th.style.width = `${columnWidth}%`;
    }

    const tdElements = dynamicTable.getElementsByTagName('td');
    for (let td of tdElements) {
        td.style.width = `${columnWidth}%`;
    }

    // Show the table container
    tableContainer.style.display = 'flex';
    
    // parameter is number of players
    const playerCount = cols - 1;
    startGame(playerCount);
}


async function startGame(playerCount) {
    console.log(`starting game with ${playerCount} players`);
    console.log(`selected dice ${selectedDice}`);

    // default player 1 starts
    let currentTurn = 1;

    // each player is an element here
    const scoreBoard = new Array(playerCount).fill(0).map(() => new Array(11).fill(-1));

    // no dice selected at first
    selectedDice = [false, false, false, false, false];

    // Example loop that checks if the game should continue
    let gameActive = true;
    
    const rollDiceButton = document.getElementById('rollDice');
    
    while (gameActive) {
        rollDiceButton.style.visibility = 'visible';

        document.getElementById(`p${currentTurn}`).style.backgroundColor = 'gray';
        let roll = [];

        selectedDice = [false, false, false, false, false]; // Global variable to store selection state

        // begin with dice having question mark image
        for (let i = 1; i < 6; i++) {
            document.getElementById(`dice${i}`).src = './dice_unknown.png';
        }

        // no dice selected
        diceElements.forEach((die, index) => {
            die.classList.remove('selected'); // Remove red border
        });


        let playerRolled = false;

        for (let i = 0; i < 3; i++) {

            // allows 3 rolls
            roll = await playerRollDice(roll, currentTurn, playerRolled);
            
            // 3rd pass hide roll button
            if (i === 2) {
                const rollDiceButton = document.getElementById('rollDice');
                rollDiceButton.style.visibility = 'hidden';
            }

            console.log(`Player ${currentTurn} rolled:`, roll);
       
            // Add click event listeners to each die
            // player can lock dice
            if (needSelectionListener) {
                needSelectionListener = false;
                diceElements.forEach((die, index) => {
                    die.addEventListener('click', () => {
                        // Toggle the selection state
                        selectedDice[index] = !selectedDice[index];

                        // Update the die's appearance based on selection state
                        if (selectedDice[index]) {
                            die.classList.add('selected'); // Add red border
                        } else {
                            die.classList.remove('selected'); // Remove red border
                        }
                        console.log(selectedDice);
                    });
                });
            }

            // update dice images
            displayRoll(roll);

            // update corresponding score
            let scores = displayCategories(currentTurn, roll, scoreBoard);

            // 1st pass - select or roll again
            // 2nd pass - select or roll again
            // 3rd pass - select only
            // player selects score -> returns category selected
            // player rolls again -> return false
            let catSelection = await playerSelectCat(currentTurn, scores);

            const catElements = [];

            for (let n = 0; n <= 10; n++) {
                catElements.push(document.getElementById(`c${currentTurn}_${n}`));
            }

            catElements.forEach((cat, index) => {
                if (cat.listener) {
                    cat.removeEventListener('click', cat.listener);
                    delete cat.listener; // Clean up the listener reference
                }
            });

            if (catSelection) {
                let row = catSelection.id.split('_')[1];
                catSelection.style.backgroundColor = 'lightgray';
                scoreBoard[currentTurn-1][row] = parseInt(catSelection.innerText, 10);
                catElements.forEach((cat, index) => {
                    if (cat.value !== 1) {
                        cat.innerText = '';
                    }
                });
                updateScore(scoreBoard);
                console.log(scoreBoard);
                break;
            } else {
                // player chose to roll again
                playerRolled = true;
                continue;
            }
        }        


        console.log(scoreBoard);

        // Example logic to end the game (update as needed)
        let containsNegative = false; // game still ongoing
        for (let i = 0; i < initialRows; i++) {
            if (scoreBoard[playerCount-1][i] === -1) {
                containsNegative = true;
                break;
            }
        }
        if (!containsNegative) {
            gameActive = false; // Set to false to exit the loop
        }

        document.getElementById(`p${currentTurn}`).style.backgroundColor = '';
        currentTurn = (currentTurn % playerCount) + 1; // Move to the next player
        document.getElementById(`p${currentTurn}`).style.backgroundColor = 'gray';
    }
        
    // game over
    console.log('Game has ended.');
    rollDiceButton.style.display = 'none';

    let totalScores = [];

    for (let i = 0; i < playerCount; i++) {
        totalScores.push(getPlayerTotalScore(scoreBoard, i)); 
    }

    console.log(totalScores);
    let winner = totalScores.indexOf(Math.max(...totalScores)) + 1;

    document.getElementById(`c${winner}_11`).style.backgroundColor = 'darkseagreen';

    document.getElementById('result').innerText = `Player ${winner} won!`;
}

function getPlayerTotalScore(scoreBoard, player) {
    let sum = 0;
    for (val of scoreBoard[player]) {
        if (val > 0) {
            sum += val; 
        }
    }
    return sum;
}


function updateScore(scoreBoard) {
    for (let i = 0; i < scoreBoard.length; i++) {
        let cell = document.getElementById(`c${i+1}_11`);
        cell.innerText = getPlayerTotalScore(scoreBoard, i);
    }
}

function onCatClick(cat, resolve) {
    console.log(`category clicked: ${cat.value} points`);
    cat.value = 1;
    resolve(cat);
}

function playerSelectCat(player, scores) {
    return new Promise((resolve) => { 
        const catElements = [];

        for (let n = 0; n <= 10; n++) {
            catElements.push(document.getElementById(`c${player}_${n}`));
        }

        const rollDiceButton = document.getElementById('rollDice');

        // player decides to roll dice instead of selecting points
        rollDiceButton.addEventListener('click', function onClick() {

            // Remove the event listener after the first click
            rollDiceButton.removeEventListener('click', onClick);

            resolve(false);
        });

        catElements.forEach((cat, index) => {
            if (!cat.value) {
                console.log('cat event listener added', cat.value);
                const listener = onCatClick.bind(null, cat, resolve); // Binding parameters
                cat.addEventListener('click', listener, { once: true });

                // Store the reference of the listener function for later removal
                cat.listener = listener;
            } 
        }, { once: true }); // 'once' option automatically removes listener after the first invocation
    });
}

function displayRoll(roll) {
    console.log(`roll: ${roll}`);

    for (let i = 0; i < roll.length; i++) {
        document.getElementById(`dice${i+1}`).src = `./dice_${roll[i]}.svg`;
    }
}


function displayCategories(player, roll, scoreBoard) {
    // Ensure the input is a valid array of dice rolls
    if (!Array.isArray(roll) || roll.length !== 5) {
        throw new Error('Input must be an array of 5 dice rolls.');
    }

    // Initialize the score object
    const scores = {
        Ones: 0,
        Twos: 0,
        Threes: 0,
        Fours: 0,
        Fives: 0,
        Sixes: 0,
        ThreeOfAKind: 0,
        FourOfAKind: 0,
        FullHouse: 0,
        Straight: 0,
        Yatzy: 0
    };

    // Count occurrences of each die face
    const counts = Array(7).fill(0); // Index 0 is unused, counts[1] to counts[6]
    roll.forEach(die => counts[die]++);

    // Calculate scores for ones to sixes
    for (let i = 1; i <= 6; i++) {
        scores[`${i}s`] = counts[i] * i; // Score is value times occurrences
    }

    // Calculate scores for Three of a Kind and Four of a Kind
    for (let i = 1; i <= 6; i++) {
        if (counts[i] >= 3) {
            scores.ThreeOfAKind = roll.reduce((sum, die) => sum + die, 0); // Sum of all dice
        }
        if (counts[i] >= 4) {
            scores.FourOfAKind = roll.reduce((sum, die) => sum + die, 0); // Sum of all dice
        }
    }

    // Check for Full House
    if (counts.includes(3) && counts.includes(2)) {
        scores.FullHouse = 25; // 25 points for full house
    }

    // Check for Straight (Small Straight and Large Straight)
    //if ((counts[1] && counts[2] && counts[3] && counts[4]) || (counts[2] && counts[3] && counts[4] && counts[5])) {
        //scores.Straight = 30; // Small Straight
    //} 
    if ((counts[1] && counts[2] && counts[3] && counts[4] && counts[5])
      || (counts[2] && counts[3] && counts[4] && counts[5] && counts[6])){
        scores.Straight = 40; // Large Straight
    }

    // Check for Yatzy
    if (counts.includes(5)) {
        scores.Yatzy = 50; // 50 points for Yatzy
    }

    const orderedKeys = [
        "1s",
        "2s",
        "3s",
        "4s",
        "5s",
        "6s",
        "ThreeOfAKind",
        "FourOfAKind",
        "FullHouse",
        "Straight",
        "Yatzy"
    ];

    let cat = 0;
    orderedKeys.forEach(key => {
        // Append the value as innerText to the tag with the specified ID
        const cellId = `c${player}_${cat}`; // Construct the cell Index
        const cell = document.getElementById(cellId); // Get the cell elements
        if (scoreBoard[player-1][cat] === -1) {
            cell.innerText = scores[key]; // Set the innerText to the score value
        }
        cat++;
    });   


    return scores;
}

function rollWithSelectedDice(current) {
    let newRoll = generateRandomNumbers(5, 1, 6);

    for (let i = 0; i < selectedDice.length; i++) {
        if (selectedDice[i]) {
            newRoll[i] = current[i];
        }
    }

    return newRoll;
}

let isRolling = false; // To prevent multiple clicks

function playerRollDice(current, player, playerRolled) {
    const rollDiceButton = document.getElementById('rollDice');
    if (playerRolled) {
        return new Promise((resolve) => {
            const newRoll = rollWithSelectedDice(current);
            resolve(newRoll);
        }, { once: true });
    }

    return new Promise((resolve) => {

        if (!isRolling) {
            isRolling = true; // Prevent further clicks

            rollDiceButton.addEventListener('click', function onClick() {

                // Remove the event listener after the first click
                rollDiceButton.removeEventListener('click', onClick);
                isRolling = false; // Allow future rolls
                
                const newRoll = rollWithSelectedDice(current);

                resolve(newRoll);

            }, { once: true }); // 'once' option automatically removes listener after the first invocation
        }
    });
}

function generateRandomNumbers(count, min, max) {
    if (max - min + 1 < count) {
        throw new Error("Range is too small to generate the requested amount of unique numbers.");
    }

    const numbers = [];

    for (let i = 0; i < count; i++) {
        // Generate cryptographically secure random numbers
        const randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        const number = (randomBuffer[0] % (max - min + 1)) + min;
        numbers.push(number);
    }
    return numbers;
}

expandButton.addEventListener('click', () => {
    const columnCount = parseInt(columnCountInput.value) + 1 || 3; // Default to 3 if input is invalid
    createTable(initialRows, columnCount);
    
    // Hide the input and button after creating the table
    columnCountInput.style.display = 'none';
    expandButton.style.display = 'none';
});

