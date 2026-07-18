import pandas as pd
import json

# 1. Load the Excel file
file_name = "Puzzles.xlsx"
df = pd.read_excel(file_name)

puzzles = []

# 2. Loop through each row in the spreadsheet
for index, row in df.iterrows():
    
    # Helper function to prevent "NaN" errors if a cell is empty
    def get_val(val, default=""):
        return str(val) if pd.notna(val) else default

    # 3. Map the spreadsheet columns to JSON keys (kept separate)
    puzzle = {
        "id": int(row['ID']) if pd.notna(row['ID']) else index + 1,
        "source": get_val(row['Source']),
        "qnum": get_val(row['Q-Num']),
        "hand": get_val(row['Hand']).strip(),
        "draw": get_val(row['Draw']).strip(),
        "dora": get_val(row['Dora']).strip(),
        
        # Kept as separate variables for UI flexibility
        "round": get_val(row['Round']).strip(),
        "seat": get_val(row['Seat']).strip(),
        "turn": get_val(row['Turn']).strip(),
        
        "correct_discard": get_val(row['Answer']).strip(),
        "shanten": get_val(row['Shanten']).strip(),
        "waits": get_val(row['Waits']).strip(),
        "explanation": get_val(row['Explanation']).strip()
    }
    puzzles.append(puzzle)

# 4. Save the data out as a formatted JSON file
output_file = "puzzles.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(puzzles, f, indent=4, ensure_ascii=False)

print(f"Success! Converted {len(puzzles)} puzzles and saved to {output_file}.")