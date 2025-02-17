
# -- 0. Import libraries --
import pandas as pd

# -- 1. Load data and create a dataframe --
json_path = "../data/dades.json"
input_data = pd.read_json(json_path)

# -- 2. Data cleaning --
main_df = input_data.copy()

main_df = main_df.dropna() # Drop rows with missing values if any

main_df = main_df.reset_index(drop=True)
main_df.index += 1

# Rename auxiliar column
main_df = main_df.rename(columns={"auxiliar": "auxiliar(borrar)"})

# Reorder columns
main_df = main_df.iloc[:, [0, 1, 5, 2, 3, 4, 7, 8, 9, 10, 6]]


# -- 3. Save the dataframe --
df = main_df.copy()

# -- Save to CSV --
output_path_csv = "../data/dades_netes.csv"
df.to_csv(output_path_csv, index=False)

# -- Save to CSV --
output_path_json = "../data/dades_netes.json"
df.to_json(output_path_json, index=False)