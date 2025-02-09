import pandas as pd

# Load the CSV files
le_df = pd.read_csv("../app/static/data/le.csv")  # Ensure correct file path
hle_df = pd.read_csv("../app/static/data/hle.csv")

# Keep only required columns and rename them
le_data = le_df[["ParentLocation", "Location", "Period", "FactValueNumericLow"]].rename(columns={"FactValueNumericLow": "LifeExpectancy"})
hle_data = hle_df[["ParentLocation", "Location", "Period", "FactValueNumericLow"]].rename(columns={"FactValueNumericLow": "HealthyLifeExpectancy"})

# Merge datasets on 'Location' and 'Period'
merged_data = pd.merge(le_data, hle_data, on=["ParentLocation", "Location", "Period"], how="inner")

# Filter for the latest year available (2021)
filtered_data = merged_data[merged_data["Period"] == 2021]

# Drop 'Period' column
filtered_data = filtered_data.drop(columns=["Period"])

# Convert to JSON format
json_file_path = "../app/static/data/life_expectancy.json"
filtered_data.to_json(json_file_path, orient="records", indent=2)
print(f"JSON file saved as {json_file_path}")
