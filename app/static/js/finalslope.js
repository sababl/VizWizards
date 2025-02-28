const margin = { top: 60, right: 220, bottom: 60, left: 80 }; // Increased right margin for legend
const width = 900 - margin.left - margin.right; // Smaller width
const height = 550 - margin.top - margin.bottom; // Smaller height

const svg = d3.select("#slope-chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let data;

// Modify the data loading section to use both CSVs
Promise.all([
    d3.csv("../static/data/le.csv"),
    d3.csv("../static/data/hle.csv")
]).then(([leData, hleData]) => {
    // Filter LE data for years 2015-2021 and Both sexes
    const filteredLE = leData.filter(d => 
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
    console.log("Filtered LE Data:", filteredLE);
    console.log("Filtered HLE Data:", filteredHLE);
    console.log("Merged Data:", data);

    // Check specific countries for debugging
    const testCountries = ["Italy", "USA", "Germany"];
    testCountries.forEach(country => {
        console.log(`Data for ${country}:`, data.filter(d => d.Location === country));
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
});

function updateChart() {
    const country1 = document.getElementById("country1").value;
    const country2 = document.getElementById("country2").value;

    if (!country1 || !country2) {
        alert("Please select two countries to generate the plot.");
        return;
    }

    // Ensure data is sorted by Period (year) before visualization
    const selectedData = data.filter(d => (d.Location === country1 || d.Location === country2))
        .sort((a, b) => a.Period - b.Period);

    const years = [...new Set(selectedData.map(d => d.Period))].sort((a, b) => a - b);

    svg.selectAll("*").remove();

    // Compute correct min/max for y-axis
    const minY = d3.min(selectedData, d => Math.min(d.LifeExpectancy || Infinity, d.HealthyLifeExpectancy || Infinity)) - 5;
    const maxY = d3.max(selectedData, d => Math.max(d.LifeExpectancy || -Infinity, d.HealthyLifeExpectancy || -Infinity)) + 5;

    console.log("Computed Y Scale Domain:", minY, maxY);

    const xScale = d3.scalePoint()
        .domain(years)
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([minY, maxY])
        .range([height, 0]);

    // Draw Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")).tickSize(-height))
        .selectAll("text")
        .style("font-size", "12px");

    svg.append("g")
        .call(d3.axisLeft(yScale).tickSize(-width))
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
        svg.append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke", d3.schemeCategory10[i % 10])
            .attr("stroke-width", 2)
            .attr("d", lineGenerator);

        svg.append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke", d3.schemeCategory10[i % 10])
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4,4")
            .attr("d", dashedLineGenerator);

        values.forEach(d => {
            if (d.LifeExpectancy !== null) {
                svg.append("circle")
                    .attr("cx", xScale(d.Period))
                    .attr("cy", yScale(d.LifeExpectancy))
                    .attr("r", 4)
                    .attr("fill", d3.schemeCategory10[i % 10]);
            }
            if (d.HealthyLifeExpectancy !== null) {
                svg.append("circle")
                    .attr("cx", xScale(d.Period))
                    .attr("cy", yScale(d.HealthyLifeExpectancy))
                    .attr("r", 4)
                    .attr("fill", d3.schemeCategory10[i % 10]);
            }
        });
    });

    // Add legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 10}, 20)`); // Position on the right side

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
