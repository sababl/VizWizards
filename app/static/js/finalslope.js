const margin = { top: 60, right: 120, bottom: 60, left: 80 }; // Reduced margins
const width = 900 - margin.left - margin.right; // Smaller width
const height = 550 - margin.top - margin.bottom; // Smaller height

const svg = d3.select("#slope-chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let data;

// Load JSON Data
d3.json("../static/data/life_expectancy_allyears.json").then(jsonData => {
    data = jsonData.filter(d => d.Dim1 === "Both sexes" && d.Period >= 2015 && d.Period <= 2022);

    console.log("Loaded Data:", jsonData);

    const uniqueCountries = [...new Set(data.map(d => d.Location))].sort();
    console.log("Extracted Countries:", uniqueCountries);

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

    const selectedData = data.filter(d => (d.Location === country1 || d.Location === country2));
    
    const years = [...new Set(selectedData.map(d => d.Period))].sort((a, b) => a - b);

    svg.selectAll("*").remove();

    const xScale = d3.scalePoint()
        .domain(years)
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([d3.min(selectedData, d => d.HealthyLifeExpectancy) - 5, d3.max(selectedData, d => d.LifeExpectancy) + 5])
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

    const lineGenerator = d3.line()
        .x(d => xScale(d.Period))
        .y(d => yScale(d.LifeExpectancy));

    const dashedLineGenerator = d3.line()
        .x(d => xScale(d.Period))
        .y(d => yScale(d.HealthyLifeExpectancy))
        .curve(d3.curveMonotoneX);

    const groupedData = d3.groups(selectedData, d => d.Location);

    groupedData.forEach(([location, values], i) => {
        svg.append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke", d3.schemeCategory10[i % 10])
            .attr("stroke-width", 2) // Thinner lines
            .attr("d", lineGenerator);

        svg.append("path")
            .datum(values)
            .attr("fill", "none")
            .attr("stroke", d3.schemeCategory10[i % 10])
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4,4") // Shorter dashed lines
            .attr("d", dashedLineGenerator);

        values.forEach(d => {
            svg.append("circle")
                .attr("cx", xScale(d.Period))
                .attr("cy", yScale(d.LifeExpectancy))
                .attr("r", 4) // Smaller circles
                .attr("fill", d3.schemeCategory10[i % 10]);

            svg.append("circle")
                .attr("cx", xScale(d.Period))
                .attr("cy", yScale(d.HealthyLifeExpectancy))
                .attr("r", 4)
                .attr("fill", d3.schemeCategory10[i % 10]);
        });

        // Add country labels near the last point on the right
        svg.append("text")
            .attr("x", xScale(values[values.length - 1].Period) + 8)
            .attr("y", yScale(values[values.length - 1].LifeExpectancy))
            .attr("dy", "0.35em")
            .style("font-size", "12px") // Smaller text
            .style("font-weight", "bold")
            .style("fill", d3.schemeCategory10[i % 10])
            .text(location);
    });

    // Labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle")
        .style("font-size", "14px") // Smaller font size
        .text("Year");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -height / 2)
        .style("text-anchor", "middle")
        .style("font-size", "14px") // Smaller font size
        .text("LE & HLE");
}
