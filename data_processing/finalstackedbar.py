import pandas as pd

# Reload the CSV file after reset
file_path = 'hle.csv'
df = pd.read_csv(file_path)

# Filter relevant data for life expectancy at age 60 from 2000 to 2021
df_filtered = df[(df['Indicator'] == 'Life expectancy at age 60') & (df['Period'] >= 2000) & (df['Period'] <= 2021)]

# Calculate the average life expectancy for each region (ParentLocation) by year
df_avg = df_filtered.groupby(['ParentLocation', 'Period'])['FactValueNumeric'].mean().reset_index()

# Save the processed data for visualization
output_file = 'hle_processed.csv'
df_avg.to_csv(output_file, index=False)

df_avg.head()
