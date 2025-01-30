# Life Expectancy API

## Overview
REST API endpoint for accessing WHO's Life Expectancy (LE) and Healthy Life Expectancy (HLE) data.

## API Reference

### Required Query Parameters
| Parameter | Type     | Description                       | Options                    |
|-----------|----------|-----------------------------------|---------------------------|
| `years`   | `array`  | Years to filter data              | e.g., "2020,2021"        |
| `metric`  | `string` | Type of life expectancy measure   | "LE", "HLE", "BOTH"      |
| `sex`     | `string` | Gender filter                     | "MALE", "FEMALE", "BOTH SEXES" |

### Optional Query Parameters
| Parameter   | Type     | Description          |
|------------|----------|---------------------|
| `country`   | `string` | Country name         |
| `continent` | `string` | Continent/Region     |

### Response Format

```json
{
    "le": {
        "2020": [
            {
                "Location": "somalia",
                "ParentLocation": "eastern mediterranean", 
                "Sex": "male",
                "FactValueNumeric": 52.85
            },
        ],
        "2021": [
            {
                "Location": "somalia",
                "ParentLocation": "eastern mediterranean",
                "Sex": "male",
                "FactValueNumeric": 51.75
            },
        ]
    },
    "hle": {
        "2020": [
            {
                "Location": "somalia", 
                "ParentLocation": "eastern mediterranean",
                "Sex": "male",
                "FactValueNumeric": 47.28
            },
        ],
        "2021": [
            {
                "Location": "somalia",
                "ParentLocation": "eastern mediterranean",
                "Sex": "male", 
                "FactValueNumeric": 46.23
            },
        ]
    }
}
```

### Example Usage

#### Get HLE data for India
```bash
curl -X GET "http://localhost:8000/life?years=2021&metric=HLE&country=India&sex=FEMALE"
```

#### Get both LE and HLE for Europe
```bash
curl -X GET "http://localhost:8000/life?years=2021&metric=BOTH&continent=Europe&sex=BOTH%20SEXES"
```

### Available Continents/Regions
- Africa
- Americas
- South-East Asia
- Europe
- Eastern Mediterranean
- Western Pacific

### Error Responses
- 400: Missing required parameters
- 404: No data found for given filters

### Notes
- All string inputs are case-insensitive
- Years must be comma-separated for multiple values
- Data is sourced from WHO datasets
````