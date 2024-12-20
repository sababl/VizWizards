from fastapi import FastAPI, Path

app = FastAPI()

@app.get("/radar/{state}/")
def get_state(state: str = Path(None, Description="The code of the state and the years you want to show")):
    return {"state": "radar"}