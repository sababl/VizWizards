// Set up dimensions for the heatmap
const margin = { top: 50, right: 50, bottom: 100, left: 120 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#heatmap")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Add logging to check data
d3.csv("../static/data/le.csv").then(function(data) {
    // Log unique status values
    console.log("Available status values:", 
        [...new Set(data.map(d => d.Indicator))]
    );

    // Fix status filter with correct field name and value
    let filteredData = data.filter(d => 
        d.Indicator === "Life expectancy at age 60 (years)" && 
        d.Dim1 === "Both sexes"
    );

    // Log filtered results
    console.log("Filtered data length:", filteredData.length);
    console.log("Sample filtered record:", filteredData[0]);

    if (filteredData.length === 0) {
        console.error("No data found after filtering!");
        return;
    }

    // Extract unique continents and years
    const continents = Array.from(new Set(filteredData.map(d => d.ParentLocation)));
    const years = Array.from(new Set(filteredData.map(d => d.Period))).sort();

    // Processed Data
    const processedData = filteredData.map(d => ({
        continent: d.ParentLocation,
        year: d.Period,
        lifeExpectancy: +d.FactValueNumericLow
    })).filter(d => !isNaN(d.lifeExpectancy));

    // Define scales
    const xScale = d3.scaleBand()
        .domain(years)
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleBand()
        .domain(continents)
        .range([0, height])
        .padding(0.1);

    const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
        .domain(d3.extent(processedData, d => d.lifeExpectancy));

    // Draw axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "-0.5em")
        .attr("transform", "rotate(-45)");

    svg.append("g")
        .call(d3.axisLeft(yScale).tickSize(0));

    // Add X-axis label (Years)
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 1.3)
        .attr("y", height + margin.bottom - 10)
        .text("Years");
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 1)
        .attr("y", height + margin.bottom - 79)
        .text("Years");
    // Add Y-axis label (Continents)
    svg.append("text")  
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 30)
        .text("Continents");

    // Draw heatmap
    svg.selectAll("rect")
        .data(processedData)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.year))
        .attr("y", d => yScale(d.continent))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.lifeExpectancy));

    // Create legend
    const legendWidth = 300;
    const legendHeight = 20;

    const legendSvg = svg.append("g")
        .attr("transform", `translate(${width / 3.5}, ${height + 50})`);

    const legendScale = d3.scaleLinear()
        .domain(d3.extent(processedData, d => d.lifeExpectancy))
        
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(5);

    legendSvg.append("g")
        .call(legendAxis)
        .attr("transform", `translate(0, ${legendHeight})`);

    const legendGradient = legendSvg.append("defs")
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

    legendGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(d3.min(processedData, d => d.lifeExpectancy)));

    legendGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(d3.max(processedData, d => d.lifeExpectancy)));

    legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");
}).catch(function(error) {
    console.error("Error loading or processing data:", error);
});



