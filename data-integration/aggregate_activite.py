import sys

import pandas as pd

JURIDICTION = sys.argv[1]

TO_AGGREGATE = [
    f"outputs/{JURIDICTION}_activite_{cont}.csv" for cont in {"CNS", "JAF", "JLD", "SOC"}
]


def run():
    df_final = pd.DataFrame()
    for data in TO_AGGREGATE:
        df = pd.read_csv(data, index_col=0)
        df_final = (
            pd.concat([df_final, df])
            # .reset_index()
            .groupby(["Niveau 4", "periode"], sort=False, as_index=False).sum(
                min_count=1
            )
        )
    df_final.to_csv(f"outputs/{JURIDICTION}_activite.csv")


if __name__ == "__main__":
    run()
