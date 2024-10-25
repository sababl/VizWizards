import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Define the dimensions of the chart
const margin = { top: 40, right: 30, bottom: 60, left: 80 },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load the CSV data
async function createChart() {
    const data = await d3.csv("../data/co-emissions-per-capita.csv");

    // Set up the X axis (Countries or regions)
    const x = d3.scaleBand()
        .domain(data.map(d => d.Country)) // Replace "Country" with your actual column name
        .range([0, width])
        .padding(0.1);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Set up the Y axis (Emissions per capita)
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => +d.Emissions)]) // Replace "Emissions" with your actual column name
        .nice()
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y));

    // Set up color scale (for regions or continents)
    const color = d3.scaleOrdinal()
        .domain([...new Set(data.map(d => d.Region))]) // Replace "Region" with your actual column name
        .range(d3.schemeCategory10); // Color scheme for different regions

    // Draw the bars
    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => x(d.Country)) // Replace "Country" with your actual column name
        .attr("y", d => y(d.Emissions)) // Replace "Emissions" with your actual column name
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.Emissions))
        .attr("fill", d => color(d.Region)); // Color based on region
}

// Call the function to draw the chart
createChart();
