#!/usr/bin/env python3
import os
import csv

# Directory containing annual data folders (e.g., 2010/, 2011/, ...)
DATA_DIR = "data"
# Output CSV path for aggregated offender sex counts
OUTPUT_CSV = "public/processed/offender_sex_trends.csv"

# Ensure the output directory exists
os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)

with open(OUTPUT_CSV, "w", newline="", encoding="utf8") as fout:
    writer = csv.writer(fout)
    # Write header row
    writer.writerow(["year", "total_offender_count"])

    # Iterate through each year directory in sorted order
    for year in sorted(os.listdir(DATA_DIR)):
        year_path = os.path.join(DATA_DIR, year)
        # Skip if not a directory or not a numeric year
        if not os.path.isdir(year_path) or not year.isdigit():
            continue

        # Locate the CSV file that contains offender sex data
        sex_file = next(
            f for f in os.listdir(year_path)
            if "offender sex" in f.lower() and f.lower().endswith(".csv")
        )

        total = 0
        with open(os.path.join(year_path, sex_file), newline="", encoding="utf8") as fin:
            reader = csv.DictReader(fin)
            # Sum all numeric values in each row
            for row in reader:
                for val in row.values():
                    try:
                        total += int(val)
                    except ValueError:
                        # Ignore non-integer entries
                        pass

        # Write the year and aggregated total to the output CSV
        writer.writerow([year, total])

print(f"→ Wrote annual offender sex totals to {OUTPUT_CSV}")
