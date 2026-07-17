import cv2
import pytesseract
import re

# IMPORTANT FOR WINDOWS USERS: Update this path to where Tesseract is installed
pytesseract.pytesseract.tesseract_cmd = r'E:\Apps\Tesseract\tesseract.exe'

def format_text(text):
    # 1. The list of Yaku (and other terms) you want strictly UPPERCASE
    yaku_list = [
        "Pinfu", "Iipeikou", "Tanyao", "Riichi", "Yakuhai",
        "Sanshoku", "Itsuu", "Toitoi", "Chiitoitsu", "Sanankou", 
        "Sankantsu", "Chanta", "Junchan", "Honitsu", "Chinitsu", 
        "Ryanpeikou", "Honroutou", "Shousangen", "Daisangen", 
        "Suuankou", "Kokushi"
    ]
    
    # 2. Force the entire string to lowercase
    text = text.lower()
    
    # 3. Capitalize the very first letter, and any letter following a period and space
    text = re.sub(r'(^\s*[a-z]|\.\s+[a-z])', lambda match: match.group().upper(), text)
    
    # 4. Find any yaku in the text and convert it to UPPERCASE
    for yaku in yaku_list:
        # \b ensures we only match whole words (so we don't accidentally capitalize inside other words)
        text = re.sub(rf'\b{yaku.lower()}\b', yaku, text)
        
    return text

def extract_explanations(image_path):
    # 1. Load and pre-process the image
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
    
    # 2. Run Tesseract OCR
    custom_config = r'--oem 3 --psm 6'
    raw_text = pytesseract.image_to_string(thresh, config=custom_config)
    
    # 3. STRICT FILTERING: Extract ONLY all-caps sentences
    # This regex looks for chunks of text that are at least 30 characters long,
    # containing mostly uppercase letters, spaces, numbers, and basic punctuation.
    # It completely ignores lowercase gibberish and brackets [ ] |
    pattern = r'[A-Z0-9][A-Z0-9\s,\.\'-]{30,}'
    
    # Find all matches on the page
    matches = re.findall(pattern, raw_text)
    
    # Clean up the extra spaces inside the matches
    cleaned_explanations = []
    for match in matches:
        # Replace multiple spaces/newlines with a single space
        clean_text = re.sub(r'\s+', ' ', match).strip()
        
        # Apply your new sentence case and yaku capitalization logic
        final_text = format_text(clean_text)
        
        cleaned_explanations.append(final_text)
        
    return cleaned_explanations

# Run the script
if __name__ == "__main__":
    file_name = "image.png"  # Replace with your image name
    results = extract_explanations(file_name)
    
    print("\n--- EXTRACTED EXPLANATIONS ---\n")
    for i, text in enumerate(results, 1):
        print(f"Puzzle {i}:")
        print(text)
        print("-" * 40)