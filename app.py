import dash
from dash.dependencies import Input, Output, State
import dash_table
import dash_core_components as dcc
import dash_html_components as html

app = dash.Dash(__name__)

app.layout = html.Div(
    [
        dash_table.DataTable(
            id="adding-rows-table",
            columns=[
                {
                    "name": "Période",
                    "id": "periode",
                    "deletable": False,
                    "renamable": False,
                },
                {
                    "name": "stock",
                    "id": "stock",
                    "deletable": False,
                    "renamable": False,
                },
                {
                    "name": "ETP",
                    "id": "etp",
                    "deletable": False,
                    "renamable": False,
                },
                {
                    "name": "Entrées",
                    "id": "entrees",
                    "deletable": False,
                    "renamable": False,
                },
                {
                    "name": "Sorties",
                    "id": "sorties",
                    "deletable": False,
                    "renamable": False,
                },
                {
                    "name": "Délais d'attente",
                    "id": "attente",
                    "deletable": False,
                    "renamable": False,
                },
                {
                    "name": "Taux de Couverture",
                    "id": "couverture",
                    "deletable": False,
                    "renamable": False,
                },
            ],
            data=[
                {
                    "periode": 0,
                    "stock": 100,
                    "etp": 2,
                    "entrees": 10,
                },
                {
                    "periode": 1,
                    "stock": 100,
                    "etp": 3,
                    "entrees": 10,
                },
            ],
            editable=True,
            row_deletable=True,
        ),
        html.Button("Add Row", id="editing-rows-button", n_clicks=0),
        dcc.Graph(id="adding-rows-graph"),
    ]
)


@app.callback(
    Output("adding-rows-table", "data"),
    Input("editing-rows-button", "n_clicks"),
    State("adding-rows-table", "data"),
    State("adding-rows-table", "columns"),
)
def add_row(n_clicks, rows, columns):
    if n_clicks > 0:
        rows.append({c["id"]: "" for c in columns})

    for row in rows:
        try:
            row["sorties"] = float(row["etp"]) * 2
        except:
            row["sorties"] = "NA"
        try:
            row["attente"] = float(row["stock"]) / (float(row["etp"]) * 2)
        except:
            row["attente"] = "NA"
        try:
            row["couverture"] = (float(row["etp"]) * 2) / float(row["entrees"])
        except:
            row["couverture"] = "NA"

    return rows


@app.callback(
    Output("adding-rows-graph", "figure"),
    Input("adding-rows-table", "data"),
    Input("adding-rows-table", "columns"),
)
def display_output(rows, columns):
    return {
        "data": [
            {
                "type": "line",
                "y": [row.get("attente") for row in rows],
                "x": [row.get("periode") for row in rows],
            }
        ]
    }


if __name__ == "__main__":
    app.run_server(debug=True)
