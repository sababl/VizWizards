import pandas as pd

# Load the CSV file
df = pd.read_csv('co2-fossil-plus-land-use.csv')

# Drop rows where 'Code' is NaN or where 'Entity' is 'World'
cleaned_df = df.dropna(subset=['Code'])
cleaned_df = cleaned_df[cleaned_df['Entity'] != 'World']

# Save the cleaned DataFrame to a new CSV file
cleaned_df.to_csv('cleaned_co2_data.csv', index=False)

# Load the CSV file
df = pd.read_csv('cleaned_co2_data.csv')

# Filter for the year 1996 and select relevant columns
data_1996 = df[df['Year'] == 1996][['Entity', 'Code', 'Annual CO₂ emissions from land-use change', 'Annual CO₂ emissions from fossil']]

# Drop rows where emissions might be NaN
data_1996 = data_1996.dropna()

# Convert emissions columns to numeric
data_1996['Annual CO₂ emissions from land-use change'] = pd.to_numeric(data_1996['Annual CO₂ emissions from land-use change'], errors='coerce')
data_1996['Annual CO₂ emissions from fossil'] = pd.to_numeric(data_1996['Annual CO₂ emissions from fossil'], errors='coerce')

# Sort and get top 10 countries by total emissions (land-use + fossil)
data_1996['Total Emissions'] = data_1996['Annual CO₂ emissions from land-use change'] + data_1996['Annual CO₂ emissions from fossil']
top_10_countries = data_1996.nlargest(10, 'Total Emissions')

# Prepare data for heatmap
heatmap_data = top_10_countries[['Entity', 'Annual CO₂ emissions from land-use change', 'Annual CO₂ emissions from fossil']]

# Save the processed data to a new CSV if needed
heatmap_data.to_csv('heatmap_data_1996.csv', index=False)

# Print the top 10 countries data
print(heatmap_data)