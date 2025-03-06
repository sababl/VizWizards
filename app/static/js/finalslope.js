const s_margin = { top: 60, right: 220, bottom: 60, left: 80 }; // Increased right s_margin for legend
const s_width = 900 - s_margin.left - s_margin.right; // Smaller width
const s_height = 550 - s_margin.top - s_margin.bottom; // Smaller height

const s_svg = d3.select("#slope-chart")
    .append("svg")
    .attr("width", s_width + s_margin.left + s_margin.right)
    .attr("height", s_height + s_margin.top + s_margin.bottom)
    .append("g")
    .attr("transform", `translate(${s_margin.left},${s_margin.top})`);

let data;
let initializeChart = true;

// Modify the data loading section to use both CSVs
Promise.all([
    d3.csv("../static/data/le.csv"),
    d3.csv("../static/data/hle.csv")
]).then(([leData, hleData]) => {
    // Filter LE data for years 2015-2021 and Both sexes
    const filteredLE = leData.filter(d => 
        d.Indicator === "Life expectancy at birth (years)" && 
        d.Dim1 === "Both sexes" && 
        d.Period >= 2015 && 
        d.Period <= 2021
    ).map(d => ({
        Location: d.Location,
        Period: +d.Period,
        LifeExpectancy: +d.FactValueNumeric
    }));

    // Filter HLE data for years 2015-2021 and Both sexes
    const filteredHLE = hleData.filter(d => 
        d.Indicator === "Healthy life expectancy (HALE) at birth (years)" && 
        d.Dim1 === "Both sexes" && 
        d.Period >= 2015 && 
        d.Period <= 2021
    ).map(d => ({
        Location: d.Location,
        Period: +d.Period,
        HealthyLifeExpectancy: +d.FactValueNumeric
    }));

    // Get all years to ensure proper matching
    const allYears = [...new Set([...filteredLE.map(d => d.Period), ...filteredHLE.map(d => d.Period)])].sort();

    // Merge LE and HLE data, ensuring all years are included
    data = filteredLE.map(le => {
        const hle = filteredHLE.find(h => h.Location === le.Location && h.Period === le.Period);
        return {
            ...le,
            HealthyLifeExpectancy: hle ? hle.HealthyLifeExpectancy : null
        };
    });

    data = data.flatMap(entry => {
        return allYears.map(year => ({
            Location: entry.Location,
            Period: year,
            LifeExpectancy: data.find(d => d.Location === entry.Location && d.Period === year)?.LifeExpectancy || null,
            HealthyLifeExpectancy: data.find(d => d.Location === entry.Location && d.Period === year)?.HealthyLifeExpectancy || null
        }));
    });

    // Debugging logs
    // console.log("Filtered LE Data:", filteredLE);
    // console.log("Filtered HLE Data:", filteredHLE);
    // console.log("Merged Data:", data);

    // Check specific countries for debugging
    const testCountries = ["Italy", "USA", "Germany"];
    testCountries.forEach(country => {
        // console.log(`Data for ${country}:`, data.filter(d => d.Location === country));
    });

    const uniqueCountries = [...new Set(data.map(d => d.Location))].sort();

    const country1Dropdown = d3.select("#country1");
    const country2Dropdown = d3.select("#country2");

    country1Dropdown.selectAll("option").remove();
    country2Dropdown.selectAll("option").remove();

    country1Dropdown.selectAll("option")
        .data(uniqueCountries)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    country2Dropdown.selectAll("option")
        .data(uniqueCountries)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    // Add event listeners for the country dropdowns
    country1Dropdown.on("change", function() {
        const country1 = d3.select(this).property("value");
        const country2 = country2Dropdown.property("value");
        if (country1 && country2) {
            updateChart(country1, country2);
        }
    });

    country2Dropdown.on("change", function() {
        const country1 = country1Dropdown.property("value");
        const country2 = d3.select(this).property("value");
        if (country1 && country2) {
            updateChart(country1, country2);
        }
    });

    // Initialize chart with first two countries
    if (uniqueCountries.length >= 2) {
        updateChart(uniqueCountries[0], uniqueCountries[1]);
    }
});

function updateChart(country1, country2) {
    // Use passed parameters instead of DOM elements
    if (!country1 || !country2) {
        console.error("Missing country values");
        return;
    }

    // Ensure data is sorted by Period (year) before visualization
    const selectedData = data.filter(d => (d.Location === country1 || d.Location === country2))
        .sort((a, b) => a.Period - b.Period);

    const years = [...new Set(selectedData.map(d => d.Period))].sort((a, b) => a - b);

    s_svg.selectAll("*").remove();

    // Compute correct min/max for y-axis
    const minY = d3.min(selectedData, d => Math.min(d.LifeExpectancy || Infinity, d.HealthyLifeExpectancy || Infinity)) - 5;
    const maxY = d3.max(selectedData, d => Math.max(d.LifeExpectancy || -Infinity, d.HealthyLifeExpectancy || -Infinity)) + 5;

    // console.log("Computed Y Scale Domain:", minY, maxY);

    const xScale = d3.scalePoint()
        .domain(years)
        .range([0, s_width]);

    const yScale = d3.scaleLinear()
        .domain([minY, maxY])
        .range([s_height, 0]);
        
    // Draw Axes
    s_svg.append("g")
        .attr("transform", `translate(0,${s_height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).tickSize(-s_height))
        .selectAll("text")
        .style("font-size", "12px");

    s_svg.append("g")
        .call(d3.axisLeft(yScale).tickSize(-s_width))
        .selectAll("text")
        .style("font-size", "12px");

    // Use `curveMonotoneX` for smoother LE lines
    const lineGenerator = d3.line()
        .x(d => xScale(d.Period))
        .y(d => yScale(d.LifeExpectancy))
        .defined(d => d.LifeExpectancy != null) // Skip missing values
        .curve(d3.curveMonotoneX);

    const dashedLineGenerator = d3.line()
        .x(d => xScale(d.Period))
        .y(d => yScale(d.HealthyLifeExpectancy))
        .defined(d => d.HealthyLifeExpectancy != null) // Skip missing values
        .curve(d3.curveMonotoneX);

    const groupedData = d3.groups(selectedData, d => d.Location);

    groupedData.forEach(([location, values], i) => {
        s_svg.append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke", d3.schemeCategory10[i % 10])
            .attr("stroke-width", 2)
            .attr("d", lineGenerator);

        s_svg.append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke", d3.schemeCategory10[i % 10])
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4,4")
            .attr("d", dashedLineGenerator);

        values.forEach(d => {
            if (d.LifeExpectancy !== null) {
                s_svg.append("circle")
                    .attr("cx", xScale(d.Period))
                    .attr("cy", yScale(d.LifeExpectancy))
                    .attr("r", 4)
                    .attr("fill", d3.schemeCategory10[i % 10]);
            }
            if (d.HealthyLifeExpectancy !== null) {
                s_svg.append("circle")
                    .attr("cx", xScale(d.Period))
                    .attr("cy", yScale(d.HealthyLifeExpectancy))
                    .attr("r", 4)
                    .attr("fill", d3.schemeCategory10[i % 10]);
            }
        });
    });

    // Add legend
    const legend = s_svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${s_width + 10}, 20)`); // Position on the right side

    // Add legend entries for countries
    groupedData.forEach(([location, values], i) => {
        const legendGroup = legend.append("g")
            .attr("transform", `translate(0, ${i * 60})`);

        // Country name
        legendGroup.append("text")
            .attr("x", 25)
            .attr("y", 0)
            .text(location)
            .style("font-size", "12px")
            .style("font-weight", "bold");

        // Legend entry for Life Expectancy
        legendGroup.append("line")
            .attr("x1", 0)
            .attr("x2", 20)
            .attr("y1", 15)
            .attr("y2", 15)
            .attr("stroke", d3.schemeCategory10[i % 10])
            .attr("stroke-width", 2);

        legendGroup.append("text")
            .attr("x", 25)
            .attr("y", 20)
            .text("Life Expectancy")
            .style("font-size", "12px");

        // Legend entry for Healthy Life Expectancy
        legendGroup.append("line")
            .attr("x1", 0)
            .attr("x2", 20)
            .attr("y1", 35)
            .attr("y2", 35)
            .attr("stroke", d3.schemeCategory10[i % 10])
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4,4");

        legendGroup.append("text")
            .attr("x", 25)
            .attr("y", 40)
            .text("Healthy Life Expectancy")
            .style("font-size", "12px");
    });
}
