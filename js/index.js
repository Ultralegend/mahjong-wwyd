let puzzles = [];
let currentIndex = 0;
let currentPuzzle = null;
let selectedTileValue = null;
let isAnswerRevealed = false;

fetch('Puzzles/puzzles.json?v=' + Date.now())
    .then(response => {
        if (!response.ok) throw new Error("Could not load puzzles.json");
        return response.json();
    })
    .then(data => {
        puzzles = data;
        loadPuzzle(currentIndex);
    })
    .catch(error => console.error("Error loading puzzles:", error));

function parseHandString(handStr) {
    let tiles = [];
    let blocks = handStr.trim().split(/\s+/);
    
    blocks.forEach(block => {
        if (!block) return;
        let suit = block.slice(-1);
        let numbers = block.slice(0, -1);
        
        for (let num of numbers) {
            tiles.push(num + suit);
        }
    });

    const suitOrder = { 'm': 1, 'p': 2, 's': 3, 'z': 4 };
    
    tiles.sort((a, b) => {
        let suitA = a.slice(-1);
        let suitB = b.slice(-1);
        let numA = a.charAt(0);
        let numB = b.charAt(0);
        
        if (suitOrder[suitA] !== suitOrder[suitB]) {
            return suitOrder[suitA] - suitOrder[suitB];
        }
        
        let valA = numA === '0' ? 5 : parseInt(numA);
        let valB = numB === '0' ? 5 : parseInt(numB);
        
        if (valA !== valB) return valA - valB;
        return numA.localeCompare(numB);
    });

    return tiles;
}

function getDoraIndicator(doraTile) {
    if (!doraTile || doraTile.length < 2) return doraTile;
    
    let numStr = doraTile.charAt(0);
    let suit = doraTile.charAt(1);
    let indicatorNum;

    // Numbered suits (Manzu, Pinzu, Souzu)
    if (suit === 'm' || suit === 'p' || suit === 's') {
        if (numStr === '0') {
            indicatorNum = 4; // If actual dora is a Red 5, indicator is 4
        } else {
            let num = parseInt(numStr);
            if (num === 1) {
                indicatorNum = 9; // 1 wraps around to 9
            } else {
                indicatorNum = num - 1; // Standard -1 step
            }
        }
    } 
    // Honor tiles (Winds and Dragons)
    else if (suit === 'z') {
        let num = parseInt(numStr);
        // Winds cycle: East(1) -> South(2) -> West(3) -> North(4) -> East(1)
        if (num === 1) indicatorNum = 4;
        else if (num === 2) indicatorNum = 1;
        else if (num === 3) indicatorNum = 2;
        else if (num === 4) indicatorNum = 3;
        
        // Dragons cycle: Haku(5) -> Hatsu(6) -> Chun(7) -> Haku(5)
        else if (num === 5) indicatorNum = 7;
        else if (num === 6) indicatorNum = 5;
        else if (num === 7) indicatorNum = 6;
    }

    return indicatorNum + suit;
}

function loadPuzzle(index) {
    currentPuzzle = puzzles[index];
    
    // Reset selection state for the new puzzle
    selectedTileValue = null;
    isAnswerRevealed = false;
    document.getElementById('confirm-btn').classList.add('hidden');
    document.getElementById('result-area').classList.add('hidden');
    
    // Update Top Info
    document.getElementById('ui-situation').innerText = 
        `${currentPuzzle.round}, ${currentPuzzle.seat} Seat, Turn ${currentPuzzle.turn}`;
        
    // Render the Dead Wall (Dora Indicators)
    const deadWallContainer = document.getElementById('dead-wall-container');
    deadWallContainer.innerHTML = '';
    
    // Split the dora string into an array
    const actualDoras = currentPuzzle.dora.trim().split(/\s+/).filter(Boolean);
    const indicators = actualDoras.map(dora => getDoraIndicator(dora));
    
    // Calculate how many Rinshan (replacement) stacks have been completely drawn
    // 1 extra indicator = 0 removed (bottom tile remains)
    // 2 extra indicators = 1 removed (entire stack depleted)
    const extraIndicators = indicators.length - 1;
    const removedTilesCount = Math.floor(extraIndicators / 2);
    
    // Generate 7 tiles for the wall
    for (let i = 0; i < 7; i++) {
        if (i < removedTilesCount) {
            // Render a hidden placeholder so the rest of the wall doesn't shift left
            let div = document.createElement('div');
            div.className = 'mahjong-tile ui-tile back-tile';
            div.style.visibility = 'hidden'; 
            deadWallContainer.appendChild(div);
            
        } else if (i >= 2 && i < 2 + indicators.length) {
            // The face-up Dora indicators
            let indicatorIndex = i - 2; 
            let img = document.createElement('img');
            img.className = 'mahjong-tile ui-tile';
            img.src = `Assets/Regular-Tiles/${indicators[indicatorIndex]}.svg`;
            deadWallContainer.appendChild(img);
            
        } else {
            // Face-down CSS tiles
            let div = document.createElement('div');
            div.className = 'mahjong-tile ui-tile back-tile';
            deadWallContainer.appendChild(div);
        }
    }
    
    // Parse and render the Hand
    const handContainer = document.getElementById('hand-container');
    handContainer.innerHTML = '';
    const handTiles = parseHandString(currentPuzzle.hand);
    
    handTiles.forEach(tileName => {
        let img = document.createElement('img');
        img.src = `Assets/Regular-Tiles/${tileName}.svg`; 
        img.className = 'mahjong-tile';
        img.onclick = (e) => selectTile(tileName, e.target);
        handContainer.appendChild(img);
    });

    // Render the Drawn tile
    const drawContainer = document.getElementById('draw-container');
    drawContainer.innerHTML = '';
    let drawImg = document.createElement('img');
    drawImg.src = `Assets/Regular-Tiles/${currentPuzzle.draw}.svg`;
    drawImg.className = 'mahjong-tile';
    drawImg.onclick = (e) => selectTile(currentPuzzle.draw, e.target);
    drawContainer.appendChild(drawImg);
}

function selectTile(tileName, imgElement) {
    if (isAnswerRevealed) return;

    // 1. Check if the user tapped the tile that is already selected
    if (imgElement.classList.contains('selected')) {
        // Deselect the tile
        imgElement.classList.remove('selected');
        selectedTileValue = null; // Clear the memory
        document.getElementById('confirm-btn').classList.add('hidden'); // Hide the button
        return; // Stop the function here
    }

    // 2. Remove 'selected' class from all tiles (clears previous selections)
    document.querySelectorAll('.mahjong-tile').forEach(tile => {
        tile.classList.remove('selected');
    });

    // 3. Add 'selected' class to the newly clicked tile
    imgElement.classList.add('selected');

    // 4. Store the value and show the confirm button
    selectedTileValue = tileName;
    document.getElementById('confirm-btn').classList.remove('hidden');
    
    // Hide results if user changes their mind before moving to the next puzzle
    document.getElementById('result-area').classList.add('hidden');
}

function confirmSelection() {
    if (!selectedTileValue) return; // Do nothing if no tile is selected
    
    // Hide the confirm button
    document.getElementById('confirm-btn').classList.add('hidden');
    
    // Pass the stored selection to the answer checker
    checkAnswer(selectedTileValue);
}

function checkAnswer(selectedTile) {
    isAnswerRevealed = true;
    const resultArea = document.getElementById('result-area');
    const resultTitle = document.getElementById('result-title');
    
    // Check answer correctness
    if (selectedTile === currentPuzzle.correct_discard) {
        resultTitle.innerText = "Correct! ✅";
        resultTitle.style.color = "#27ae60"; 
    } else {
        resultTitle.innerText = "Incorrect ❌";
        resultTitle.style.color = "#c0392b"; 
    }
    
    // 1. Show the Correct Discard as an image
    document.getElementById('res-correct').innerHTML = 
        `<img src="Assets/Regular-Tiles/${currentPuzzle.correct_discard}.svg" class="mahjong-tile inline-tile">`;
    
    document.getElementById('res-shanten').innerText = currentPuzzle.shanten;

    // 2. Format the Waits (e.g., converting "5s19" into "[5s Image] x 19")
    let waitsHtml = '';
    let waitsArray = currentPuzzle.waits.trim().split(/\s+/); // Splits by space
    
    waitsArray.forEach(waitStr => {
        if (waitStr.length >= 2) {
            let tileName = waitStr.substring(0, 2); // Gets '5s'
            let ukeireCount = waitStr.substring(2); // Gets '19'
            
            waitsHtml += `<span class="wait-item">
                <img src="Assets/Regular-Tiles/${tileName}.svg" class="mahjong-tile inline-tile"> 
                ${ukeireCount ? 'x ' + ukeireCount : ''}
            </span>`;
        } else {
            waitsHtml += waitStr + " "; // Fallback if string is weird
        }
    });
    document.getElementById('res-waits').innerHTML = waitsHtml;

    // 3. Format the Explanation (Add new line after every period)
    let formattedExplanation = currentPuzzle.explanation
        .split('.')
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 0) // Removes empty strings
        .join('.<br>') + '.'; // Rebuilds with line breaks and adds the final period
        
    document.getElementById('res-explanation').innerHTML = formattedExplanation;
    
    // Reveal the results
    resultArea.classList.remove('hidden');
}

function nextPuzzle() {
    currentIndex++;
    if (currentIndex >= puzzles.length) {
        currentIndex = 0; 
    }
    loadPuzzle(currentIndex);
}