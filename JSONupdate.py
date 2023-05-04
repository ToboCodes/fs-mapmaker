import json
import re

# Load the old JSON
with open("src/coordinates.json", "r") as f:
    old_data = json.load(f)

# Prepare new data structure
new_data = {
    "territories": {}
}

def extract_square_name(key):
    zone_number = re.findall(r'\d+', key)[0]
    square_letter = key.split(zone_number)[-1]
    return int(zone_number), square_letter

square_marker_counters = {letter: 0 for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ"}

for key, value in old_data["territorios"].items():
    territory_number, square_letter = extract_square_name(key)
    territory_key = f"terr{territory_number}"
    
    if territory_key not in new_data["territories"]:
        new_data["territories"][territory_key] = {
            "color": old_data["colors"][str(territory_number)],
            "terrMarker": old_data["markers"]["num"][territory_number - 1]
        }

    if square_marker_counters[square_letter] < len(old_data["markers"][square_letter]):
        square_marker = old_data["markers"][square_letter][square_marker_counters[square_letter]]
        square_marker_counters[square_letter] += 1
    else:
        square_marker = None

    new_data["territories"][territory_key][f"Square{square_letter}"] = {
        "edges": value,
        "squareMarker": square_marker
    }

# Save the new JSON
with open("new_coordinates.json", "w") as f:
    json.dump(new_data, f, indent=2)
