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
        
    // NEW: Render the Dora as an image
    const doraImg = document.getElementById('ui-dora-img');
    doraImg.src = `Assets/Regular-Tiles/${currentPuzzle.dora}.svg`;
    doraImg.style.display = 'block';
    
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