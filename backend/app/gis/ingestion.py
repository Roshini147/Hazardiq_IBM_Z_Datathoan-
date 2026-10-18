from pathlib import Path
import pandas as pd
def read_table(path:str):
    p=Path(path); return pd.read_csv(p) if p.suffix.lower()=='.csv' else None
def validate_columns(df,required): return [c for c in required if c not in df.columns]
