import pandas as pd


def create_continent_co2_summary(emissions_path, continents_path, countries_path, year):
    # Filter emissions data for the specified year
    emissions_df = pd.read_csv(emissions_path)
    continents_df = pd.read_csv(continents_path)
    countries_df = pd.read_csv(countries_path)
    valid_countries = set(countries_df["Country"])

    year_data = emissions_df[emissions_df["Year"] == year]
    year_data = year_data[year_data["Entity"].isin(valid_countries)]
    # Merge emissions data with continent information
    merged_data = year_data.merge(continents_df, left_on="Entity", right_on="Country")

    # Group by continent and calculate total emissions for each continent
    continent_summary = []
    for continent, group in merged_data.groupby("Continent"):
        # Calculate total CO₂ emissions for the continent
        total_emissions = group["Annual CO₂ emissions (per capita)"].sum()
        # Get the top 5 countries by CO₂ emissions
        top_countries = group.nlargest(5, "Annual CO₂ emissions (per capita)")[
            ["Entity", "Annual CO₂ emissions (per capita)"]
        ]
        top_countries_list = top_countries.values.tolist()

        row = {"Continent": continent, "annual_co2": total_emissions}

        for i in range(1, 6):
            if i <= len(top_countries_list):
                country, emissions = top_countries_list[i - 1]
                row[f"country_{i}"] = {country: emissions}
            else:
                row[f"country_{i}"] = None

        # Calculate emissions for "other" countries
        other_emissions = (
            total_emissions - top_countries["Annual CO₂ emissions (per capita)"].sum()
        )
        row["other"] = {"Other", other_emissions}

        continent_summary.append(row)

    # Create the DataFrame from the summary data
    summary_df = pd.DataFrame(
        continent_summary,
        columns=[
            "Continent",
            "annual_co2",
            "country_1",
            "country_2",
            "country_3",
            "country_4",
            "country_5",
            "other",
        ],
    )
    summary_df.to_csv(
        f"data_processing/output/continent_summary_{year}.csv", index=False
    )
    return


# Using the function for a sample year, e.g., 2020
summary_df_2020 = create_continent_co2_summary(
    "data/co-emissions-per-capita.csv",
    "data/countries_with_continents.csv",
    "data/Countries by continents.csv",
    1996,
)
