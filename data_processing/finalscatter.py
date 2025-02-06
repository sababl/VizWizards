# Load the newly uploaded CSV file
file_path = "le.csv"
df = pd.read_csv(file_path)

# Filter the dataset to keep only rows where:
# - 'Dim1' is 'Male'
# - 'Dim1ValueCode' is 'SEX_MLE'
# - 'Indicator' is 'Life expectancy at birth (years)'
df_filtered = df[
    (df["Dim1"] == "Male") &
    (df["Dim1ValueCode"] == "SEX_MLE") &
    (df["Indicator"] == "Life expectancy at birth (years)")
]

# Select only the required columns: Location, Period, and FactValueNumeric
df_filtered = df_filtered[["Location", "Period", "FactValueNumeric"]]

# Convert 'Period' to integer and 'FactValueNumeric' to numeric for correct sorting
df_filtered["Period"] = pd.to_numeric(df_filtered["Period"], errors='coerce')
df_filtered["FactValueNumeric"] = pd.to_numeric(df_filtered["FactValueNumeric"], errors='coerce')

# Drop any remaining NaN values in the FactValueNumeric column after conversion
df_filtered = df_filtered.dropna(subset=["FactValueNumeric"])

# Sort values to ensure correct filtering
df_filtered = df_filtered.sort_values(by=["Period", "FactValueNumeric"])

# Get the bottom 5 countries with the lowest life expectancy for each year from 2000 to 2021
df_lowest_per_year = df_filtered[(df_filtered["Period"] >= 2000) & (df_filtered["Period"] <= 2021)]
df_lowest_per_year = df_lowest_per_year.groupby("Period").head(5)

# Save the filtered data to a new CSV file
filtered_file_path = "lowest_life_expectancy_male_filtered.csv"
df_lowest_per_year.to_csv(filtered_file_path, index=False)

# Return the path to the user
filtered_file_path
