// Array to hold all entries during the current session
let puzzleEntries = [];

// Listen for the form submission
document.getElementById('puzzle-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevents the page from reloading

    // 1. Build the Hand String
    let handParts = [];
    const manzu = document.getElementById('inp-manzu').value.trim();
    const pinzu = document.getElementById('inp-pinzu').value.trim();
    const souzu = document.getElementById('inp-souzu').value.trim();
    const honors = document.getElementById('inp-honors').value.trim();

    if (manzu) handParts.push(manzu + "m");
    if (pinzu) handParts.push(pinzu + "p");
    if (souzu) handParts.push(souzu + "s");
    if (honors) handParts.push(honors + "z");
    
    const formattedHand = handParts.join(" ");

    // 2. Gather all other fields
    // Replacing any accidental pipes (|) or newlines in text fields to prevent CSV breaking
    const cleanText = (text) => text.replace(/\|/g, "").replace(/\n/g, " ");

    const entry = [
        cleanText(document.getElementById('inp-source').value),
        formattedHand,
        cleanText(document.getElementById('inp-draw').value),
        cleanText(document.getElementById('inp-dora').value),
        cleanText(document.getElementById('inp-round').value),
        cleanText(document.getElementById('inp-seat').value),
        cleanText(document.getElementById('inp-turn').value),
        cleanText(document.getElementById('inp-answer').value),
        cleanText(document.getElementById('inp-shanten').value),
        cleanText(document.getElementById('inp-waits').value),
        cleanText(document.getElementById('inp-explanation').value)
    ];

    // 3. Add to our array
    puzzleEntries.push(entry.join("|"));

    // 4. Update UI and reset form
    document.getElementById('entry-count').innerText = `${puzzleEntries.length} puzzle(s) ready to download.`;
    document.getElementById('puzzle-form').reset();
    
    // Focus back on the source field for rapid entry
    document.getElementById('inp-source').focus();
});

// Function to trigger the CSV download
function downloadCSV() {
    if (puzzleEntries.length === 0) {
        alert("No puzzles to download! Add at least one puzzle first.");
        return;
    }

    // Include a header row
    const headers = "Source|Hand|Draw|Dora|Round|Seat|Turn|Answer|Shanten|Waits|Explanation";
    const csvContent = headers + "\n" + puzzleEntries.join("\n");

    // Create a Blob containing the CSV data
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary hidden link to trigger the download
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

    // Double-check before deleting data
    const isConfirmed = confirm("Are you sure you want to clear all un-downloaded puzzles? This cannot be undone.");
    
    if (isConfirmed) {
        puzzleEntries = []; // Wipe the array
        document.getElementById('entry-count').innerText = "0 puzzle(s) ready to download.";
    }
}