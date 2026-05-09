#!/usr/bin/env python3
"""
Generate a bonus lookup table from the new equipment builder JSON files.
This creates a master bonuses file that maps each module selection to its effects.
"""

import json
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
DATA_DIR = REPO_ROOT / "data"
LIGHTSABER_BUILDER = DATA_DIR / "lightsaber-builder.json"
BLASTER_BUILDER = DATA_DIR / "blaster-builder.json"

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def generate_lightsaber_bonuses():
    """Generate a bonus lookup keyed by module selection."""
    data = load_json(LIGHTSABER_BUILDER)
    bonuses = {}
    
    # Crystals have tiers and add damage dice
    for color, info in data['lightsaber']['modules']['crystals']['options'].items():
        for tier in ['tier1', 'tier2', 'tier3']:
            tier_num = tier[-1]  # '1', '2', or '3'
            tier_data = info[tier]
            key = f"crystal_{color}_t{tier_num}"
            bonuses[key] = {
                "type": "crystal",
                "name": f"{info['name']} (T{tier_num})",
                "effect": tier_data.get("effect", ""),
                "damageDicePerTier": tier_data.get("damageDice", 0),
                "source": "lightsaber_modular_system_full_player_v3.pdf"
            }
    
    # Enhancements (6 per tier)
    for tier_num_int in [1, 2, 3]:
        tier_str = f"tier{tier_num_int}"
        for enhancement in data['lightsaber']['modules']['enhancements']['options'][tier_str]:
            key = f"enhancement_{enhancement['name'].lower().replace(' ', '_')}_t{tier_num_int}"
            bonuses[key] = {
                "type": "enhancement",
                "name": f"{enhancement['name']} (T{tier_num_int})",
                "effect": enhancement.get("effect", ""),
                "source": "lightsaber_modular_system_full_player_v3.pdf"
            }
    
    # Mods (6 per tier)
    for tier_num_int in [1, 2, 3]:
        tier_str = f"tier{tier_num_int}"
        for mod in data['lightsaber']['modules']['mods']['options'][tier_str]:
            key = f"mod_{mod['name'].lower().replace(' ', '_')}_t{tier_num_int}"
            bonuses[key] = {
                "type": "mod",
                "name": f"{mod['name']} (T{tier_num_int})",
                "effect": mod.get("effect", ""),
                "source": "lightsaber_modular_system_full_player_v3.pdf"
            }
    
    # Hilts (6 per tier)
    for tier_num_int in [1, 2, 3]:
        tier_str = f"tier{tier_num_int}"
        for hilt in data['lightsaber']['modules']['hilts']['options'][tier_str]:
            key = f"hilt_{hilt['name'].lower().replace(' ', '_')}_t{tier_num_int}"
            bonuses[key] = {
                "type": "hilt",
                "name": f"{hilt['name']} (T{tier_num_int})",
                "effect": hilt.get("effect", ""),
                "source": "lightsaber_modular_system_full_player_v3.pdf"
            }
    
    return bonuses

def generate_blaster_bonuses():
    """Generate a bonus lookup for blaster modules."""
    data = load_json(BLASTER_BUILDER)
    bonuses = {}
    
    # Power Cell Mods (6 per tier)
    for tier_num_int in [1, 2, 3]:
        tier_str = f"tier{tier_num_int}"
        for mod in data['blaster']['modules']['powerCell']['options'][tier_str]:
            key = f"powerCell_{mod['name'].lower().replace(' ', '_')}_t{tier_num_int}"
            bonuses[key] = {
                "type": "powerCell",
                "name": f"{mod['name']} (T{tier_num_int})",
                "effect": mod.get("effect", ""),
                "source": "blaster_modular_system_complete.pdf"
            }
    
    # Firing Module Mods (6 per tier)
    for tier_num_int in [1, 2, 3]:
        tier_str = f"tier{tier_num_int}"
        for mod in data['blaster']['modules']['firingModule']['options'][tier_str]:
            key = f"firingModule_{mod['name'].lower().replace(' ', '_')}_t{tier_num_int}"
            bonuses[key] = {
                "type": "firingModule",
                "name": f"{mod['name']} (T{tier_num_int})",
                "effect": mod.get("effect", ""),
                "source": "blaster_modular_system_complete.pdf"
            }
    
    # Targeting Array Mods (6 per tier)
    for tier_num_int in [1, 2, 3]:
        tier_str = f"tier{tier_num_int}"
        for mod in data['blaster']['modules']['targetingArray']['options'][tier_str]:
            key = f"targetingArray_{mod['name'].lower().replace(' ', '_')}_t{tier_num_int}"
            bonuses[key] = {
                "type": "targetingArray",
                "name": f"{mod['name']} (T{tier_num_int})",
                "effect": mod.get("effect", ""),
                "source": "blaster_modular_system_complete.pdf"
            }
    
    # Cooling Jacket Mods (6 per tier)
    for tier_num_int in [1, 2, 3]:
        tier_str = f"tier{tier_num_int}"
        for mod in data['blaster']['modules']['coolingJacket']['options'][tier_str]:
            key = f"coolingJacket_{mod['name'].lower().replace(' ', '_')}_t{tier_num_int}"
            bonuses[key] = {
                "type": "coolingJacket",
                "name": f"{mod['name']} (T{tier_num_int})",
                "effect": mod.get("effect", ""),
                "source": "blaster_modular_system_complete.pdf"
            }
    
    # Grip Mods (6 per tier)
    for tier_num_int in [1, 2, 3]:
        tier_str = f"tier{tier_num_int}"
        for mod in data['blaster']['modules']['grip']['options'][tier_str]:
            key = f"grip_{mod['name'].lower().replace(' ', '_')}_t{tier_num_int}"
            bonuses[key] = {
                "type": "grip",
                "name": f"{mod['name']} (T{tier_num_int})",
                "effect": mod.get("effect", ""),
                "source": "blaster_modular_system_complete.pdf"
            }
    
    return bonuses

if __name__ == "__main__":
    print("Generating equipment module bonuses...")
    
    lightsaber_bonuses = generate_lightsaber_bonuses()
    blaster_bonuses = generate_blaster_bonuses()
    
    output = {
        "lightsaber": lightsaber_bonuses,
        "blaster": blaster_bonuses,
        "description": "Master bonus lookup table for all equipment modules from the modular system PDFs"
    }
    
    output_path = DATA_DIR / "equipment-module-bonuses.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Generated {len(lightsaber_bonuses)} lightsaber bonuses")
    print(f"✓ Generated {len(blaster_bonuses)} blaster bonuses")
    print(f"✓ Saved to: {output_path}")
