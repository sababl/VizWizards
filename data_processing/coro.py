# Ensure "Both sexes" is excluded (already filtered out)
df_filtered = df[df["Indicator"] == "Healthy life expectancy (HALE) at age 60 (years)"]
df_filtered = df_filtered[df_filtered["Dim1"].isin(["Male", "Female"])]

# Keep all rows, do not drop missing values
df_filtered = df_filtered[["Location", "Period", "Dim1", "FactValueNumeric"]]

# Convert the FactValueNumeric column to numeric values
df_filtered["FactValueNumeric"] = pd.to_numeric(df_filtered["FactValueNumeric"], errors="coerce")

# Define a manual mapping for country name mismatches
country_name_mapping = {
    "Bolivia (Plurinational State of)": "Bolivia",
    "Brunei Darussalam": "Brunei",
    "Czechia": "Czech Republic",
    "Democratic People's Republic of Korea": "North Korea",
    "Democratic Republic of the Congo": "DR Congo",
    "Iran (Islamic Republic of)": "Iran",
    "Lao People's Democratic Republic": "Laos",
    "Micronesia (Federated States of)": "Micronesia",
    "Republic of Korea": "South Korea",
    "Republic of Moldova": "Moldova",
    "Russian Federation": "Russia",
    "Syrian Arab Republic": "Syria",
    "Tanzania, United Republic of": "Tanzania",
    "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
    "United States of America": "United States",
    "Venezuela (Bolivarian Republic of)": "Venezuela",
    "Viet Nam": "Vietnam"
}

# Apply the mapping to standardize country names
df_pivot["Location"] = df_pivot["Location"].replace(country_name_mapping)

# Display the updated dataset
tools.display_dataframe_to_user(name="Updated Country Names in Data", dataframe=df_pivot)

# Pivot table to have Male and Female values in separate columns
df_pivot = df_filtered.pivot(index=["Location", "Period"], columns="Dim1", values="FactValueNumeric").reset_index()

# Load a reference dataset with standard ISO Alpha-3 country codes to help with name mapping
iso_reference_url = "https://raw.githubusercontent.com/datasets/country-codes/master/data/country-codes.csv"
iso_df = pd.read_csv(iso_reference_url)

# Extract relevant columns
iso_df = iso_df[["official_name_en", "ISO3166-1-Alpha-3"]]

# Convert to dictionary for mapping
country_name_to_iso = dict(zip(iso_df["official_name_en"], iso_df["ISO3166-1-Alpha-3"]))

# Check which names in our dataset do not match standard country names
mismatched_countries = [name for name in unique_countries if name not in country_name_to_iso]

# Display mismatched country names
mismatched_countries


# Rename columns for clarity
df_pivot.columns = ["Location", "Period", "Female", "Male"]

# Calculate the Female-to-Male ratio
df_pivot["SexRatio"] = df_pivot["Female"] / df_pivot["Male"]

# Display the processed data with all rows intact
tools.display_dataframe_to_user(name="Processed Healthy Life Expectancy at Age 60 Data (Including NaNs)", dataframe=df_pivot)
