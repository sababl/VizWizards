import pandas as pd

# Load the CSV files
le_df = pd.read_csv("../app/static/data/le.csv")  # Ensure correct file path
hle_df = pd.read_csv("../app/static/data/hle.csv")

# Keep only required columns and rename them
le_data = le_df[["ParentLocation", "Location", "Period", "Dim1", "FactValueNumericLow"]].rename(columns={"FactValueNumericLow": "LifeExpectancy"})
hle_data = hle_df[["ParentLocation", "Location", "Period", "Dim1", "FactValueNumericLow"]].rename(columns={"FactValueNumericLow": "HealthyLifeExpectancy"})

# Merge datasets on 'ParentLocation', 'Location', 'Period', and 'Dim1' (sex category)
merged_data = pd.merge(le_data, hle_data, on=["ParentLocation", "Location", "Period", "Dim1"], how="inner")

# Save the JSON file including all years and sex category
json_file_path = "../app/static/data/life_expectancy_allyears.json"
merged_data.to_json(json_file_path, orient="records", indent=2)

print(f"✅ JSON file saved as {json_file_path}")
