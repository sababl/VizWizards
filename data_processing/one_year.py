import pandas as pd


def one_year_data(data_path):
    data = pd.read_csv(data_path)
    one_year_data = data[data["Year"] == 1996]
    sorted = one_year_data.sort_values(
        "Annual CO₂ emissions (per capita)", ascending=False
    )
    sorted.to_csv("data_processing/output/sorted_emissions_one_year.csv", index=False)

    return

if __name__ == "__main__":
    one_year_data("data/co-emissions-per-capita.csv")
