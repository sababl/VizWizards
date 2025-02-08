import pandas as pd

# Load the CSV files
le_df = pd.read_csv("../app/static/data/le.csv")  # Ensure correct file path
hle_df = pd.read_csv("../app/static/data/hle.csv")
population_df = pd.read_csv("../app/static/data/population.csv")  # Load population data

# Keep only required columns and rename them
le_data = le_df[["ParentLocation", "Location", "Period", "Dim1", "FactValueNumericLow"]].rename(columns={"FactValueNumericLow": "LifeExpectancy"})
hle_data = hle_df[["ParentLocation", "Location", "Period", "Dim1", "FactValueNumericLow"]].rename(columns={"FactValueNumericLow": "HealthyLifeExpectancy"})

# Clean population dataset
population_df = population_df.rename(columns={"Country Name": "Location"})

# Merge datasets on 'Location' and 'Period' (matching country and year)
merged_data = pd.merge(le_data, hle_data, on=["ParentLocation", "Location", "Period", "Dim1"], how="inner")
merged_data = pd.merge(merged_data, population_df, on=["Location"], how="left")  # Merge with population data

# Fill missing population values with NaN if no match was found
# merged_data["Population"] = merged_data["Population"].fillna("Unknown")

# Save the JSON file including all years, sex category, and population data
json_file_path = "../app/static/data/life_expectancy_allyears.json"
merged_data.to_json(json_file_path, orient="records", indent=2)

print(f"✅ JSON file saved as {json_file_path}")
