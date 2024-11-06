import pandas as pd

# Load the CSV file
df = pd.read_csv('co-emissions-per-capita.csv')

# Filter for the decade 2001-2010
filtered_df = df[(df['Year'] >= 2001) & (df['Year'] <= 2010)]

# Group by 'Entity' and calculate the average CO₂ emissions per capita
average_emissions = filtered_df.groupby('Entity')['Annual CO₂ emissions (per capita)'].mean().reset_index()

# Rename the column for clarity
average_emissions.rename(columns={'Annual CO₂ emissions (per capita)': 'Average CO₂ emissions (2001-2010)'}, inplace=True)

# Display the results
print(average_emissions)

average_emissions.to_csv('average_emissions_2001_2010.csv', index= False)
