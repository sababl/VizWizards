// Set up initial width and height for the map dynamically
let width = window.innerWidth * 0.75; // Adjusted width to leave space for the legend
let height = window.innerHeight * 0.8; // Keep height proportional

// Create an SVG container
const svg = d3.select("#bubble-map")
    .attr("preserveAspectRatio", "xMidYMid meet") // Ensures proper scaling
    .attr("viewBox", `0 0 ${width + 150} ${height}`) // Added extra space for legend
    .style("width", "100%")
    .style("height", "90vh");

const mapGroup = svg.append("g")
    .attr("transform", `translate(${width / 10}, ${height / 6})`); // Center map properly

// Define a Mercator projection for a flat world map
let projection = d3.geoMercator()
    .scale(width / 7)  // Adjust scale for better display
    .translate([width / 2.2, height / 1.6]); // Center map properly

const path = d3.geoPath().projection(projection);

// Load World Map & Country Coordinates
Promise.all([
    d3.json("https://d3js.org/world-110m.v1.json"),  // World Map
    d3.json("../static/data/life_expectancy_allyears.json"), // Life Expectancy Data
    d3.json("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json") // Country Coordinates
]).then(([world, lifeData, countryCoords]) => {
    console.log("✅ Loaded Data Successfully");

    // Draw the complete world map
    mapGroup.append("path")
        .datum(topojson.feature(world, world.objects.countries))
        .attr("d", path)
        .attr("fill", "#e0c37a") // Light brown color for land
        .attr("stroke", "#999");

    console.log("✅ World map drawn successfully");

    // Convert country coordinate data into a dictionary with centroids
    const countryLookup = {};
    countryCoords.features.forEach(d => {
        const normalizedName = d.properties.name.toLowerCase().trim(); // Normalize country names
        countryLookup[normalizedName] = d3.geoCentroid(d); // Store centroid instead of first coordinate
    });

    console.log("✅ Loaded Country Coordinates (Centroids):", countryLookup);

    // Filter data to include only the year 2021
    const filteredData = lifeData.filter(d => d.Period === 2021);

    // Define a broader range for Life Expectancy to enhance color differentiation
    const lifeExpExtent = [0, 40]; // Setting a fixed broader range

    // Define a color scale for life expectancy with the broader range
    const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
        .domain(lifeExpExtent);

    // Define a bubble size scale based on population in 2021
    const populationExtent = d3.extent(filteredData, d => d["2021"]);
    const sizeScale = d3.scaleSqrt()
        .domain(populationExtent) // Population range from JSON
        .range([5, 40]); // Adjusted to make bubbles more visible

    // Extract life expectancy and population for the year 2021 per country
    const countryStats = new Map();
    filteredData.forEach(d => {
        const country = d.Location.toLowerCase().trim();
        if (countryLookup[country]) {
            countryStats.set(country, {
                lifeExpectancy: d.LifeExpectancy,
                population: d["2021"],
                coordinates: countryLookup[country]
            });
        }
    });

    const processedData = Array.from(countryStats, ([country, values]) => ({
        country,
        lifeExpectancy: values.lifeExpectancy,
        population: values.population,
        coordinates: values.coordinates
    }));

    console.log("✅ Processed Data with Coordinates and Population for 2021:", processedData);

    if (processedData.length === 0) {
        console.error("❌ No valid country data available for 2021!");
        return;
    }

    // Draw Bubbles (Using Accurate Centroid Positions & Population for Size)
    mapGroup.selectAll("circle")
        .data(processedData)
        .enter()
        .append("circle")
        .attr("cx", d => projection(d.coordinates)[0])
        .attr("cy", d => projection(d.coordinates)[1])
        .attr("r", d => sizeScale(d.population)) // Bubble size based on 2021 population
        .attr("fill", d => colorScale(+d.lifeExpectancy))
        .attr("opacity", 0.7)
        .attr("stroke", "#333")
        .on("mouseover", (event, d) => {
            d3.select("#tooltip")
                .style("visibility", "visible")
                .html(`<strong>${d.country}</strong><br>Life Expectancy: ${d.lifeExpectancy.toFixed(1)}<br>Population: ${d.population.toLocaleString()}`);
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

    // Update the legend with the new broader range
    const legendScale = d3.scaleLinear()
        .domain(lifeExpExtent)
        .range([100, 0]);

    const legendAxis = d3.axisRight(legendScale)
        .ticks(5)
        .tickFormat(d => d + " years");

    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, 50)`);

    legend.append("g")
        .attr("class", "legend-axis")
        .attr("transform", "translate(30,0)")
        .call(legendAxis);

    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "100%")
        .attr("y2", "0%");

    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(lifeExpExtent[0]));

    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(lifeExpExtent[1]));

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 30)
        .attr("height", 100)
        .style("fill", "url(#legend-gradient)");
});
