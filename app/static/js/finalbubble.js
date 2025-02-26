// Set up initial width and height for the map dynamically
let width = window.innerWidth * 0.9; // Increased map width
let height = window.innerHeight * 0.85; // Increased map height

// Create an SVG container
const svg = d3.select("#bubble-map")
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("viewBox", `0 0 ${width + 200} ${height}`) // Increased extra space for legend
    .style("width", "100%")
    .style("height", "95vh");

const mapGroup = svg.append("g")
    .attr("transform", `translate(${width / 10}, ${height / 6})`);

// Define a Mercator projection for a flat world map
let projection = d3.geoMercator()
    .scale(width / 6) // Increased scale for a bigger map
    .translate([width / 2.2, height / 1.6]); 

const path = d3.geoPath().projection(projection);

// Add after projection creation
console.log("Testing projection:", projection([0, 0])); // Should return valid x,y coordinates

// Load World Map, Life Expectancy Data, and Country Coordinates
Promise.all([
    d3.csv("../static/data/population.csv", d => ({
        Location: d["Country Name"].trim(),
        Population: parseFloat(d["2021"]) || 0  // Parse as float and default to 0 if invalid
    })),
    d3.json("https://d3js.org/world-110m.v1.json"),  // World Map
    d3.csv("../static/data/le.csv", d => ({
        Location: d.Location.trim(), // Read country name
        Indicator: d.Indicator.trim(),
        Period: +d.Period,
        LifeExpectancy: +d.FactValueNumeric,
        Dim1: d.Dim1.trim()
        // Use FactValueNumeric for life expectancy
    })),
    d3.json("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json") // Country coordinates
    ]).then(([populationData, world, lifeData, countryCoords]) => {
    console.log("✅ Loaded Data Successfully");

    // Draw the complete world map
    mapGroup.append("path")
        .datum(topojson.feature(world, world.objects.countries))
        .attr("d", path)
        .attr("fill", "#e0c37a") 
        .attr("stroke", "#999");

    console.log("✅ World map drawn successfully");

    // Normalize country names and store centroids
    const countryLookup = {};
    countryCoords.features.forEach(d => {
        const countryName = d.properties.name.toLowerCase().trim();
        // Use d3.geoCentroid to get the proper coordinates
        const centroid = d3.geoCentroid(d);
        countryLookup[countryName] = centroid;
    });

    console.log("✅ Loaded Country Coordinates:", countryLookup);
    const countryNameCorrections = {
        "eswatini": "swaziland",
        "guinea-bissau": "guinea bissau",
        "kiribati": "kiribati",
        "congo": "republic of the congo",
        "cote d'ivoire": "ivory coast",
        "bolivia (plurinational state of)": "bolivia",
        "micronesia (federated states of)": "micronesia",
        "comoros": "comoros",
        "timor-leste": "east timor",
        "lao people's democratic republic": "laos",
        "republic of moldova": "moldova",
        "russian federation": "russia",
        "samoa": "samoa",
        "bahamas": "bahamas",
        "saint lucia": "saint lucia",
        "venezuela (bolivarian republic of)": "venezuela",
        "sao tome and principe": "sao tome and principe",
        "syrian arab republic": "syria",
        "democratic people's republic of korea": "north korea",
        "saint vincent and the grenadines": "saint vincent and the grenadines",
        "tonga": "tonga",
        "grenada": "grenada",
        "serbia": "serbia",
        "north macedonia": "macedonia",
        "cabo verde": "cape verde",
        "mauritius": "mauritius",
        "occupied palestinian territory, including east jerusalem": "palestine",
        "viet nam": "vietnam",
        "seychelles": "seychelles",
        "bahrain": "bahrain",
        "iran (islamic republic of)": "iran",
        "türkiye": "turkey",
        "maldives": "maldives",
        "barbados": "barbados",
        "antigua and barbuda": "antigua and barbuda",
        "brunei darussalam": "brunei",
        "czechia": "czech republic",
        "united kingdom of great britain and northern ireland": "united kingdom",
        "netherlands (kingdom of the)": "netherlands",
        "republic of korea": "south korea",
        "singapore": "singapore"
    };
    
    

    // Filter life expectancy data for 2021 and only keep relevant indicators
    const filteredData = lifeData.filter(d => 
        d.Period === 2021 && d.Indicator === "Life expectancy at birth (years)" && d.Dim1 === "Both sexes"
    );

    console.log("✅ Filtered Data (Life Expectancy at Birth - 2021):", filteredData);


    let populationLookup = {};
    populationData.forEach(d => {
        let country = d.Location.toLowerCase().trim();
        if (countryNameCorrections[country]) {
            country = countryNameCorrections[country]; // Apply name corrections
        }
        populationLookup[country] = d.Population; // Use the parsed Population value
    });
    console.log("✅ Population Lookup:", populationLookup);
    const populationExtent = d3.extent(Object.values(populationLookup));
    const sizeScale = d3.scaleSqrt()
        .domain(populationExtent)
        .range([2, 23]); // Define a bubble size scale

    // Debug the population data
    console.log("✅ Sample Population Data:", populationData.slice(0,5));
        
        
    // Define a broader range for Life Expectancy (0-100)
    const lifeExpExtent = [0, 100];

    // Define a color scale for life expectancy
    const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
        .domain(lifeExpExtent);

    // Match countries with coordinates
    const countryStats = new Map();
    let missingCountries = [];

    filteredData.forEach(d => {
        let country = d.Location.toLowerCase().trim();
        if (countryNameCorrections[country]) {
            country = countryNameCorrections[country];
        }
        if (countryLookup[country]) {
            // Store the raw coordinates first
            countryStats.set(country, {
                lifeExpectancy: d.LifeExpectancy,
                coordinates: countryLookup[country], // Store raw coordinates
                population: populationLookup[country] || 0
            });
        } else {
            missingCountries.push(d.Location);
        }
    });

    
    if (missingCountries.length > 0) {
        console.warn("⚠️ Missing country matches:", missingCountries);
    }

    const processedData = Array.from(countryStats, ([country, values]) => {
        // Project the coordinates using the projection function
        const coords = projection(values.coordinates);
        return {
            country,
            lifeExpectancy: values.lifeExpectancy,
            coordinates: coords,
            population: values.population
        };
    }).filter(d => d.coordinates != null); // Filter out any null projections

    // Add debug logging
    console.log("Sample coordinates:", processedData.slice(0,5).map(d => ({
        country: d.country,
        coordinates: d.coordinates
    })));

    console.log("✅ Processed Data:", processedData);

    console.log("Population values in processedData:", processedData.map(d => d.population));
    console.log("Sample bubble sizes:", processedData.slice(0,5).map(d => ({
        country: d.country,
        population: d.population,
        bubbleSize: sizeScale(d.population)
    })));

    // Add after processedData creation
    console.log("First few processed coordinates:", 
        processedData.slice(0,3).map(d => ({
            country: d.country,
            coords: d.coordinates,
            population: d.population,
            lifeExpectancy: d.lifeExpectancy
        }))
    );

    if (processedData.length === 0) {
        console.error("❌ No valid country data available for 2021!");
        return;
    }

    // Add the visualization code
    mapGroup.selectAll("circle")
        .data(processedData)
        .enter()
        .append("circle")
        .attr("cx", d => d.coordinates[0])
        .attr("cy", d => d.coordinates[1])
        .attr("r", d => sizeScale(d.population))
        .attr("fill", d => colorScale(d.lifeExpectancy))
        .attr("opacity", 0.8)
        .attr("stroke", "#333")
        .on("mouseover", (event, d) => {
            d3.select("#tooltip")
                .style("visibility", "visible")
                .html(`<strong>${d.country}</strong><br>Life Expectancy: ${d.lifeExpectancy.toFixed(1)}`);
        })
        .on("mousemove", event => {
            d3.select("#tooltip")
                .style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", () => {
            d3.select("#tooltip").style("visibility", "hidden");
        });

    console.log("✅ Bubbles Drawn Successfully!");

    // ---- FIXED LEGEND ----
    const legendHeight = 200; 

    // Define legend scale
    const legendScale = d3.scaleLinear()
        .domain(lifeExpExtent)
        .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
        .ticks(10)
        .tickFormat(d => `${d} years`);

    // Append legend group
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 30}, 50)`);

    legend.append("g")
        .attr("class", "legend-axis")
        .attr("transform", "translate(30,0)")
        .call(legendAxis);

    // Define color gradient
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "100%")
        .attr("y2", "0%");

    for (let i = 0; i <= 100; i += 10) {
        linearGradient.append("stop")
            .attr("offset", `${i}%`)
            .attr("stop-color", colorScale(i));
    }

    // Append legend color bar
    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 30)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");
});
