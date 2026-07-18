let puzzleEntries = [];
let isBatchMode = false;
let currentTabIndex = 0;
let batchData = [{}, {}, {}]; // Holds data for the 3 batch slots

const requiredIds = [
    'inp-source', 'inp-draw', 'inp-dora', 'inp-round', 'inp-seat', 'inp-turn',
    'inp-answer', 'inp-shanten', 'inp-waits', 'inp-explanation'
];

const inputIds = [
    'inp-source', 'inp-manzu', 'inp-pinzu', 'inp-souzu', 'inp-honors',
    'inp-draw', 'inp-dora', 'inp-round', 'inp-seat', 'inp-turn',
    'inp-answer', 'inp-shanten', 'inp-waits', 'inp-explanation'
];

const requiredFields = [
    { id: 'inp-draw', name: 'Draw' },
    { id: 'inp-dora', name: 'Dora' },
    { id: 'inp-round', name: 'Round' },
    { id: 'inp-seat', name: 'Seat' },
    { id: 'inp-turn', name: 'Turn' },
    { id: 'inp-answer', name: 'Answer (Discard)' },
    { id: 'inp-shanten', name: 'Shanten' },
    { id: 'inp-waits', name: 'Waits (Ukeire)' },
    { id: 'inp-explanation', name: 'Explanation' }
];

// Handles switching between Single and Batch mode
function toggleMode() {
    const mode = document.querySelector('input[name="entry-mode"]:checked').value;
    const batchNav = document.getElementById('batch-nav');
    const submitBtn = document.getElementById('btn-submit');
    
    if (mode === 'batch') {
        isBatchMode = true;
        batchNav.classList.remove('hidden');
        submitBtn.innerText = "Save Puzzles";
        saveCurrentTab(); 
    } else {
        isBatchMode = false;
        batchNav.classList.add('hidden');
        submitBtn.innerText = "Save Puzzle";
        
        // When going back to single, load whatever was in slot 1 so work isn't lost
        currentTabIndex = 0;
        loadCurrentTab();
    }
}

// Handles switching tabs in Batch mode
function switchTab(newIndex) {
    if (!isBatchMode) return;
    
    saveCurrentTab(); // Save current work before switching
    
    // Update active button styling
    document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', idx === newIndex);
    });
    
    currentTabIndex = newIndex;
    loadCurrentTab(); // Load the data for the new tab
}

// Grabs all inputs from the screen and saves them to memory
function saveCurrentTab() {
    let data = {};
    inputIds.forEach(id => {
        data[id] = document.getElementById(id).value;
    });
    batchData[currentTabIndex] = data;
}

// Pushes data from memory onto the screen
function loadCurrentTab() {
    let data = batchData[currentTabIndex] || {};
    
    // UX Helper: Auto-copy the Source from Tab 1 if we are on Tab 2 or 3 and it's empty
    if (currentTabIndex > 0 && !data['inp-source'] && batchData[0]['inp-source']) {
        data['inp-source'] = batchData[0]['inp-source'];
    }

    inputIds.forEach(id => {
        document.getElementById(id).value = data[id] || '';
    });
}
function isValidPuzzle(data) {
    // 1. Check if all standard required fields have text in them
    for (let id of requiredIds) {
        if (!data[id] || data[id].trim() === '') {
            return false;
        }
    }
    
    // 2. Check if at least one of the hand suits (Manzu, Pinzu, Souzu, Honors) is filled out
    const hasHand = (data['inp-manzu'] || '').trim() ||
                    (data['inp-pinzu'] || '').trim() ||
                    (data['inp-souzu'] || '').trim() ||
                    (data['inp-honors'] || '').trim();
                    
    if (!hasHand) return false;

    return true; // The puzzle passes all checks
}

function validatePuzzle(data) {
    // 1. Check if all standard required fields have text in them
    for (let field of requiredFields) {
        if (!data[field.id] || data[field.id].trim() === '') {
            return { valid: false, error: `Missing required field: ${field.name}` };
        }
    }
    
    // 2. Check if at least one of the hand suits is filled out
    const hasHand = (data['inp-manzu'] || '').trim() ||
                    (data['inp-pinzu'] || '').trim() ||
                    (data['inp-souzu'] || '').trim() ||
                    (data['inp-honors'] || '').trim();
                    
    if (!hasHand) {
        return { valid: false, error: `Missing required field: Hand (Please enter at least one suit)` };
    }

    return { valid: true }; // The puzzle passes all checks
}

// Core function that processes a single raw data object into a formatted CSV string
function processAndAddEntry(data) {
    let handParts = [];
    const manzu = (data['inp-manzu'] || '').trim();
    const pinzu = (data['inp-pinzu'] || '').trim();
    const souzu = (data['inp-souzu'] || '').trim();
    const honors = (data['inp-honors'] || '').trim();

    if (manzu) handParts.push(manzu + "m");
    if (pinzu) handParts.push(pinzu + "p");
    if (souzu) handParts.push(souzu + "s");
    if (honors) handParts.push(honors + "z");
    
    const formattedHand = handParts.join(" ");
    const cleanText = (text) => (text || '').replace(/\|/g, "").replace(/\n/g, " ");

    const entry = [
        cleanText(data['inp-source']),
        formattedHand,
        cleanText(data['inp-draw']),
        cleanText(data['inp-dora']),
        cleanText(data['inp-round']),
        cleanText(data['inp-seat']),
        cleanText(data['inp-turn']),
        cleanText(data['inp-answer']),
        cleanText(data['inp-shanten']),
        cleanText(data['inp-waits']),
        cleanText(data['inp-explanation'])
    ];

    puzzleEntries.push(entry.join("|"));
}

document.getElementById('puzzle-form').addEventListener('submit', function(e) {
    e.preventDefault();

    saveCurrentTab(); // Always save the tab currently being viewed to memory

    if (isBatchMode) {
        // 1. Validate all 3 tabs before saving
        for (let i = 0; i < 3; i++) {
            const check = validatePuzzle(batchData[i]);
            if (!check.valid) {
                alert(`Puzzle ${i + 1} is incomplete!\n${check.error}`);
                switchTab(i); // Automatically flip the UI to the tab with the missing data
                return; // Stop the form submission completely
            }
        }
        
        // 2. If validation passes, process all 3
        for (let i = 0; i < 3; i++) {
            processAndAddEntry(batchData[i]);
        }
        
        // 3. Wipe the batch slate clean for the next page of the book
        batchData = [{}, {}, {}];
        currentTabIndex = 0;
        switchTab(0); // Reset UI to Puzzle 1
        document.getElementById('puzzle-form').reset();
        document.getElementById('inp-source').focus();
        
    } else {
        // Single Entry Mode Validation
        const check = validatePuzzle(batchData[0]);
        if (check.valid) {
            processAndAddEntry(batchData[0]);
            batchData = [{}, {}, {}];
            document.getElementById('puzzle-form').reset();
            document.getElementById('inp-source').focus();
        } else {
            // Pinpoints exactly what field you missed in single mode
            alert(`Puzzle is incomplete!\n${check.error}`); 
        }
    }

    // Update the counter
    document.getElementById('entry-count').innerText = `${puzzleEntries.length} puzzle(s) ready to download.`;
});

function downloadCSV() {
    if (puzzleEntries.length === 0) {
        alert("No puzzles to download! Add at least one puzzle first.");
        return;
    }
    const headers = "Source|Hand|Draw|Dora|Round|Seat|Turn|Answer|Shanten|Waits|Explanation";
    const csvContent = headers + "\n" + puzzleEntries.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "newPuzzles.csv");
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function clearPuzzles() {
    if (puzzleEntries.length === 0) {
        alert("The list is already empty!");
        return;
    }
    if (confirm("Are you sure you want to clear all un-downloaded puzzles? This cannot be undone.")) {
        puzzleEntries = []; 
        document.getElementById('entry-count').innerText = "0 puzzle(s) ready to download.";
    }
}