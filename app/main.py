from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from typing import List
import pandas as pd
import numpy as np

import json
from typing import List, Optional

app = FastAPI()

app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/templates")

def init_data():
    """Initialize data at startup"""
    le_file = "app/static/data/le.csv"
    hle_file = "app/static/data/hle.csv"
    df_le = pd.read_csv(
        le_file,
        dtype={
            'Period': str,
            'Location': str, 
            'Dim1': str,
            'ParentLocation': str,
            'FactValueNumeric': float
        }
    )
    # Clean up column names and values for easier filtering
    df_le['Sex'] = df_le['Dim1'].str.lower()
    df_le['Location'] = df_le['Location'].str.lower()
    df_le['ParentLocation'] = df_le['ParentLocation'].str.lower()

    df_hle = pd.read_csv(
        hle_file,
        dtype={
            'Period': str,
            'Location': str, 
            'Dim1': str,
            'ParentLocation': str,
            'FactValueNumeric': float
        }
    )
    # Clean up column names and values for easier filtering
    df_hle['Sex'] = df_hle['Dim1'].str.lower()
    df_hle['Location'] = df_hle['Location'].str.lower()
    df_hle['ParentLocation'] = df_hle['ParentLocation'].str.lower()

    return df_le, df_hle


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/map1", response_class=HTMLResponse)
async def map1(request: Request):
    return templates.TemplateResponse("map.html", {"request": request})


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

@app.get("/le-bee", response_class=HTMLResponse)
async def le_beeswarm(request: Request):
    return templates.TemplateResponse("le_beeswarm.html", {"request": request})

@app.get("/le-radar", response_class=HTMLResponse)
async def le_radar(request: Request):
    return templates.TemplateResponse("le_radar.html", {"request": request})

@app.get("/le-stacked", response_class=HTMLResponse)
async def le_stacked(request: Request):
    return templates.TemplateResponse("le_stacked.html", {"request": request})

@app.get("/le-error", response_class=HTMLResponse)
async def le_error(request: Request):
    return templates.TemplateResponse("le_error.html", {"request": request})


@app.get("/temperature")
async def get_temperature(state_code: str, years: List[str] = Query(..., min_items=1, max_items=10)):
    years = years[0].split(',')
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
    filtered_df = filtered_df.reset_index(drop=True)
    filtered_df.iloc[:, 0] = filtered_df.iloc[:, 0].str[-4:]

    json_data = filtered_df.to_json(orient="values")
    return JSONResponse(content=json_data)


# Add age mapping constants
AGE_INDICATORS = {
    'birth': 'Life expectancy at birth (years)',
    '60': 'Life expectancy at age 60 (years)',
    'both': None  # For both ages
}

@app.get("/life")
async def get_life_data(
    years: str = Query(..., description="Comma separated years e.g. 2020,2021"),
    metric: str = Query(..., description="HLE or LE or BOTH"),
    sex: str = Query(..., description="MALE, FEMALE or BOTH"),
    age: str = Query(..., description="BIRTH, 60, BOTH"),
    country: Optional[str] = Query(None, description="Country name"),
    continent: Optional[str] = Query(None, description="Continent/Region name")
):
    try:
        year_list = years.split(',')
        df_le, df_hle = init_data()
        
        # Validate age parameter
        age = age.lower()
        if age not in AGE_INDICATORS:
            raise HTTPException(status_code=400, detail="Invalid age parameter")
        
        response = {'le': None, 'hle': None}
        
        if metric.lower() == "both":
            df_dict = {"le": df_le, "hle": df_hle}
        else:
            df_dict = {"le": df_le} if metric.lower() == "le" else {"hle": df_hle}
        
        if sex.lower() == 'both':
            sex = "Both sexes"
        for df_key in df_dict:
            df = df_dict[df_key]
            mask = (
                df['Period'].isin(year_list) &
                (df['Sex'].str.lower() == sex.lower())
            )
            
            # Apply age filter
            if age != 'both':
                mask &= (df['Indicator'] == AGE_INDICATORS[age])
                
            if country:
                mask &= (df['Location'] == country.lower())
            if continent:
                mask &= (df['ParentLocation'].str.lower() == continent.lower())
                
            df = df[mask]
            
            # Group by year for response format
            result = df.groupby('Period').apply(
                lambda x: x[['Location', 'ParentLocation', 'Sex', 'FactValueNumeric',
                               'FactValueNumericLow', 'FactValueNumericHigh', 'Indicator']]
                          .replace(np.nan, None)
                          .to_dict('records')
            ).to_dict()
                     
            response[df_key] = result
        return JSONResponse(content=response)
        
    except Exception as e:
        print(f"Error occurred: {str(e)}")  # Debug print
        import traceback
        print(traceback.format_exc())  # Print full traceback
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/countries")
async def get_countries():
    """Get list of all available countries"""
    df_le = pd.read_csv('app/static/data/le.csv')
    le_countries = df_le['Location'].unique().tolist()
    # Combine unique countries from both datasets    
    return JSONResponse(content={"countries": le_countries} )


@app.get("/continents")
async def get_continents():
    """Get list of all available continents/regions"""
    df_le, df_hle = init_data()
    
    # Combine unique continents from both datasets
    continents = sorted(set(df_le['ParentLocation'].unique()) | set(df_hle['ParentLocation'].unique()))
    
    return JSONResponse(content={"continents": continents})

@app.get("/years")
async def get_years():
    """Get list of all available years"""
    df_le = pd.read_csv('app/static/data/le.csv')
    le_years = df_le['Period'].unique().tolist()
    # Combine unique countries from both datasets    
    return JSONResponse(content={"years": le_years} )

@app.get("/regions")
async def get_regions():
    """Get list of all available regions"""
    df_le = pd.read_csv('app/static/data/le.csv')
    le_regions = df_le['ParentLocation'].unique().tolist()
    # Combine unique countries from both datasets    
    return JSONResponse(content={"regions": le_regions} )
