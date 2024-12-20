from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/templates")

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

@app.get("/radar", response_class=HTMLResponse)
async def radar(request: Request):
    return templates.TemplateResponse("radar_chart.html", {"request": request})

@app.get("/snakey", response_class=HTMLResponse)
async def snakey(request: Request):
    return templates.TemplateResponse("snakey.html", {"request": request})

@app.get("/stacked", response_class=HTMLResponse)
async def stacked(request: Request):
    return templates.TemplateResponse("stacked.html", {"request": request})