import pandas as pd

# Load the data from the uploaded CSV file
file_path = 'le.csv'
life_expectancy_data = pd.read_csv(file_path)

# Display the first few rows of the dataset to understand its structure
life_expectancy_data.head()

# Filter the data for life expectancy of females at age 60 from the year 2000 to 2021 across different countries
filtered_data = life_expectancy_data[
    (life_expectancy_data['Period'].between(2000, 2021)) &
    (life_expectancy_data['Indicator'].str.contains("age 60")) &
    (life_expectancy_data['Dim1'] == "Female")  # Assuming 'Dim1' column specifies gender
]

# Selecting relevant columns for the visualization
relevant_columns = filtered_data[["Location", "Period", "FactValueNumeric"]]
relevant_columns = relevant_columns.rename(columns={"FactValueNumeric": "LifeExpectancy"})

# Group the data by Location and Period to ensure uniqueness
grouped_data = relevant_columns.groupby(["Location", "Period"]).mean().reset_index()

grouped_data.head()
