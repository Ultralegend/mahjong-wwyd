let puzzleEntries = [];
let isBatchMode = false;
let currentTabIndex = 0;
let batchData = [{}];

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

// Handles generating the tabs based on how many exist in the array
function renderTabs() {
    const container = document.getElementById('tabs-container');
    container.innerHTML = ''; // Clear existing tabs

    batchData.forEach((_, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tab-btn' + (index === currentTabIndex ? ' active' : '');
        btn.innerText = `P${index + 1}`; // Changed from Puzzle to P
        btn.onclick = () => switchTab(index);
        container.appendChild(btn);
    });

    // Show or hide the remove button (don't allow removing the last tab)
    const removeBtn = document.getElementById('btn-remove-tab');
    if (batchData.length > 1) {
        removeBtn.classList.remove('hidden');
    } else {
        removeBtn.classList.add('hidden');
    }
}

// Add a new empty tab to the batch
function addTab() {
    saveCurrentTab();
    batchData.push({}); // Add an empty puzzle object
    currentTabIndex = batchData.length - 1; // Jump to the new tab
    renderTabs();
    loadCurrentTab();
}

// Remove the currently viewed tab from the batch
function removeTab() {
    if (batchData.length <= 1) return; // Failsafe
    
    saveCurrentTab(); // Grab the latest typing from the screen
    const currentData = batchData[currentTabIndex];

    // Check if the puzzle is empty (ignoring 'inp-source' since it auto-copies)
    const isEmpty = inputIds.every(id => {
        if (id === 'inp-source') return true; 
        return !currentData[id] || currentData[id].trim() === '';
    });

    // If the puzzle has data, ask for confirmation. If it's empty, skip this step.
    if (!isEmpty) {
        const isConfirmed = confirm(`Are you sure you want to remove P${currentTabIndex + 1}?`);
        if (!isConfirmed) return; // Stop if the user clicks Cancel
    }
    
    // Proceed with deletion
    batchData.splice(currentTabIndex, 1);
    
    // Ensure index doesn't go out of bounds if we delete the last tab
    if (currentTabIndex >= batchData.length) {
        currentTabIndex = batchData.length - 1;
    }
    
    renderTabs();
    loadCurrentTab();
}

// Handles switching between Single and Batch mode
function toggleMode() {
    const mode = document.querySelector('input[name="entry-mode"]:checked').value;
    const batchNav = document.getElementById('batch-nav');
    const submitBtn = document.getElementById('btn-submit');
    
    saveCurrentTab(); // Always save work in progress

    if (mode === 'batch') {
        isBatchMode = true;
        batchNav.classList.remove('hidden');
        submitBtn.innerText = "Save Puzzles";
        renderTabs();
    } else {
        isBatchMode = false;
        batchNav.classList.add('hidden');
        submitBtn.innerText = "Save Puzzle";
        
        // When switching back to single, collapse down to just the currently viewed puzzle
        batchData = [batchData[currentTabIndex] || {}];
        currentTabIndex = 0;
        loadCurrentTab();
    }
}

// Handles switching tabs in Batch mode
function switchTab(newIndex) {
    if (!isBatchMode || newIndex === currentTabIndex) return;
    
    saveCurrentTab();
    currentTabIndex = newIndex;
    renderTabs();
    loadCurrentTab();
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
    
    // Auto-copy the Source from Tab 1 if we are on a later tab and it's empty
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
        // 1. Validate ALL dynamic tabs before saving
        for (let i = 0; i < batchData.length; i++) {
            const check = validatePuzzle(batchData[i]);
            if (!check.valid) {
                alert(`P${i + 1} is incomplete!\n${check.error}`); // Changed from Puzzle to P
                switchTab(i); 
                return; 
            }
        }
        
        // 2. Process ALL dynamic tabs
        for (let i = 0; i < batchData.length; i++) {
            processAndAddEntry(batchData[i]);
        }
        
        // 3. Reset everything back to a clean 1-tab slate
        batchData = [{}];
        currentTabIndex = 0;
        renderTabs();
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