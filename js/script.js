// Define the dimensions of the chart
const margin = { top: 40, right: 30, bottom: 60, left: 80 }
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create the SVG container
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Load the CSV data
d3.csv("../data_processing/output/sorted_emissions_one_year.csv").then(data => {
    // Parse the data to convert numeric fields
    data.forEach(d => {
        d["Annual CO₂ emissions (per capita)"] = +d["Annual CO₂ emissions (per capita)"];
    });

    const x = d3.scaleBand()
        .domain(data.map(d => d.Entity))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d["Annual CO₂ emissions (per capita)"])])
        .nice()
        .range([height, 0]);

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.Entity))
        .attr("y", d => y(d["Annual CO₂ emissions (per capita)"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d["Annual CO₂ emissions (per capita)"]))
        .attr("fill", "steelblue");

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", -margin.left + 20)
        .attr("y", -20)
        .attr("dy", "1em")
        .attr("transform", "rotate(-90)")
        .text("Annual CO₂ emissions (per capita)");

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width / 2 + margin.left)
        .attr("y", height + margin.bottom - 10)
        .text("Country");
    });