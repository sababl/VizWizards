df = pd.read_csv("le.csv")

# Filter the dataset based on the given conditions again
filtered_csv_data = df[
    (df["ParentLocation"].isin(["Africa", "Eastern Mediterranean", "Western Pacific", "Americas", "South-East Asia", "Europe"])) &
    (df["Dim1"] == "Both sexes") &
    (df["Indicator"] == "Life expectancy at birth (years)")
]

# Group by ParentLocation (Region) and compute the average life expectancy per region
region_avg_data = filtered_csv_data.groupby("ParentLocation")["FactValueNumeric"].mean().reset_index()

# Rename columns for clarity
region_avg_data.rename(columns={"ParentLocation": "Region", "FactValueNumeric": "AverageLifeExpectancy"}, inplace=True)

# Save the filtered regional data as CSV
regional_csv_file_path = "life_expectancy_by_region.csv"
region_avg_data.to_csv(regional_csv_file_path, index=False)

# Provide the download link
regional_csv_file_path