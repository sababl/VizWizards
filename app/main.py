from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from typing import List
import pandas as pd
import json

app = FastAPI()

app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/templates")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/map1", response_class=HTMLResponse)
async def map1(request: Request):
    return templates.TemplateResponse("map.html", {"request": request})

@app.get("/map1_r_all", response_class=HTMLResponse)
async def map1(request: Request):
    return templates.TemplateResponse("final_alluvial_rom.html", {"request": request})

@app.get("/map2_r_slope", response_class=HTMLResponse)
async def map1(request: Request):
    return templates.TemplateResponse("final_slope_rom.html", {"request": request})

@app.get("/map3_r_flowplot", response_class=HTMLResponse)
async def map1(request: Request):
    return templates.TemplateResponse("final_flowplot_rom.html", {"request": request})

@app.get("/map4_r_heatmap", response_class=HTMLResponse)
async def map1(request: Request):
    return templates.TemplateResponse("final_heatmap_rom.html", {"request": request})

@app.get("/map5_r_bubblemap", response_class=HTMLResponse)
async def map1(request: Request):
    return templates.TemplateResponse("final_bubblemap_rom.html", {"request": request})


@app.get("/bar", response_class=HTMLResponse)
async def bar(request: Request):
    return templates.TemplateResponse("bar.html", {"request": request})


@app.get("/map2", response_class=HTMLResponse)
async def map2(request: Request):
    return templates.TemplateResponse("choropleth2.html", {"request": request})


@app.get("/heatmap", response_class=HTMLResponse)
async def heatmap(request: Request):
    return templates.TemplateResponse("heatmap.html", {"request": request})


@app.get("/snakey", response_class=HTMLResponse)
async def snakey(request: Request):
    return templates.TemplateResponse("snakey.html", {"request": request})


@app.get("/stacked", response_class=HTMLResponse)
async def stacked(request: Request):
    return templates.TemplateResponse("stacked.html", {"request": request})


@app.get("/radar", response_class=HTMLResponse)
async def radar(request: Request):
    return templates.TemplateResponse("radar_chart.html", {"request": request})

@app.get("/line", response_class=HTMLResponse)
async def line(request: Request):
    return templates.TemplateResponse("linechart.html", {"request": request})


@app.get("/temperature")
def get_temperature(state_code: str, years: List[str] = Query(..., min_items=1, max_items=10)):
    print(state_code)
    years = years[0].split(',')
    print(years)
    mean_df = pd.read_csv(
        "app/static/data/climdiv-tmpcst-v1.0.0-20241205",
        delim_whitespace=True,
        header=None,
        index_col=False,
        dtype={0: str},
    )
    filtered_df = mean_df[
        (mean_df.iloc[:, 0].str[:3] == state_code)
        & (
            mean_df.iloc[:, 0].str[-4:].isin(years)
        )
    ]
    print(filtered_df.head(5))
    filtered_df = filtered_df.reset_index(drop=True)
    filtered_df.iloc[:, 0] = filtered_df.iloc[:, 0].str[-4:]

    json_data = filtered_df.to_json(orient="values")
    return JSONResponse(content=json_data)
