import pandas as pd

# Load datasets   
countries_path = "C:/Users/studente/Documents/unige/VizWizards/data/countries_with_continents.csv"  
emissions_path = "C:/Users/studente/Documents/unige/VizWizards/data/co2-fossil-plus-land-use.csv" # Replace with your file path

countries_data = pd.read_csv(countries_path)
emissions_data = pd.read_csv(emissions_path)

# Merge on the "country" or "Entity" column (adjust column names as needed)
merged_data = pd.merge(emissions_data, countries_data, left_on="Entity", right_on="Country", how="inner")

# Optional: Filter for the most recent year or a specific year
# merged_data = merged_data[merged_data["Year"] == 2020]

# Save to a new CSV file
output_path = "C:/Users/studente/Documents/unige/VizWizards/data/Alluvial.csv"  # Replace with your desired output file path
merged_data.to_csv(output_path, index=False)

print(f"Merged data saved to {output_path}")
