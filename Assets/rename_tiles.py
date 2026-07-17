import os

# 1. Map your CURRENT filenames to the TARGET standard notation filenames
# Adjust the keys (left side) to match exactly what your current SVGs are called.
mapping = {
    # Example: If your files are named "Man1.svg", this renames it to "1m.svg"
    "Man1.svg": "1m.svg", "Man2.svg": "2m.svg", "Man3.svg": "3m.svg",
    "Man4.svg": "4m.svg", "Man5.svg": "5m.svg", "Man6.svg": "6m.svg",
    "Man7.svg": "7m.svg", "Man8.svg": "8m.svg", "Man9.svg": "9m.svg",
    
    "Pin1.svg": "1p.svg", "Pin2.svg": "2p.svg", "Pin3.svg": "3p.svg",
    "Pin4.svg": "4p.svg", "Pin5.svg": "5p.svg", "Pin6.svg": "6p.svg",
    "Pin7.svg": "7p.svg", "Pin8.svg": "8p.svg", "Pin9.svg": "9p.svg",

    "Sou1.svg": "1s.svg", "Sou2.svg": "2s.svg", "Sou3.svg": "3s.svg",
    "Sou4.svg": "4s.svg", "Sou5.svg": "5s.svg", "Sou6.svg": "6s.svg",
    "Sou7.svg": "7s.svg", "Sou8.svg": "8s.svg", "Sou9.svg": "9s.svg",

    "Man5-Dora.svg": "0m.svg", "Pin5-Dora.svg": "0p.svg", "Sou5-Dora.svg": "0s.svg",
    
    # Honors (z): 1=East, 2=South, 3=West, 4=North, 5=Haku, 6=Hatsu, 7=Chun
    "Ton.svg": "1z.svg", "Nan.svg": "2z.svg", "Shaa.svg": "3z.svg", 
    "Pei.svg": "4z.svg", "Haku.svg": "5z.svg", "Hatsu.svg": "6z.svg", "Chun.svg": "7z.svg"
}

# 2. Loop through the folder and rename the files
for old_name, new_name in mapping.items():
    if os.path.exists(old_name):
        os.rename(old_name, new_name)
        print(f"Renamed {old_name} -> {new_name}")
    else:
        print(f"File {old_name} not found, skipping.")

print("Finished renaming tiles!")