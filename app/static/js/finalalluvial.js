// ✅ Set dimensions for the chart to ensure full visibility at 100% zoom
const margin = {top: 20, right: 80, bottom: 50, left: 150};
const width = Math.min(1100, window.innerWidth - margin.left - margin.right);
const height = Math.min(600, window.innerHeight - margin.top - margin.bottom);

const svg = d3.select("#bullet-chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// ✅ Load data from CSV files
Promise.all([
    d3.csv("../static/data/le.csv"),
    d3.csv("../static/data/hle.csv")
]).then(([leData, hleData]) => {
    
    // console.log("✅ Data Loaded Successfully:", leData, hleData);

    if (!leData.length || !hleData.length) {
        throw new Error("❌ Data is empty!");
    }

    // ✅ Filter data to include only 2021 data
    const filteredLE = leData.filter(d => +d.Period === 2021).map(d => ({
        Location: d.Location,
        LifeExpectancy: +d.FactValueNumeric
    }));

    const filteredHLE = hleData.filter(d => +d.Period === 2021).map(d => ({
        Location: d.Location,
        HealthyLifeExpectancy: +d.FactValueNumeric
    }));

    // ✅ Merge Life Expectancy & Healthy Life Expectancy Data
    let mergedData = filteredLE.map(le => {
        let hle = filteredHLE.find(h => h.Location === le.Location);
        return {
            Location: le.Location,
            LifeExpectancy: le.LifeExpectancy,
            HealthyLifeExpectancy: hle ? hle.HealthyLifeExpectancy : 0,
            UnhealthyYears: le.LifeExpectancy - (hle ? hle.HealthyLifeExpectancy : 0)
        };
    });

    // ✅ Sort by Life Expectancy for better visualization
    mergedData.sort((a, b) => b.LifeExpectancy - a.LifeExpectancy);

    // console.log("✅ Filtered & Merged Data:", mergedData);

    // ✅ Define Scales
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(mergedData, d => d.LifeExpectancy) + 5])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(mergedData.map(d => d.Location))
        .range([0, height])
        .padding(0.4);

    // ✅ Draw Bars (Total Life Expectancy)
    svg.selectAll(".le-bar")
        .data(mergedData)
        .enter()
        .append("rect")
        .attr("class", "le-bar")
        .attr("x", 0)
        .attr("y", d => yScale(d.Location))
        .attr("width", d => xScale(d.LifeExpectancy))
        .attr("height", yScale.bandwidth())
        .attr("fill", "gray");  // Total Life Expectancy

    // ✅ Draw Bars (Healthy Life Expectancy)
    svg.selectAll(".hle-bar")
        .data(mergedData)
        .enter()
        .append("rect")
        .attr("class", "hle-bar")
        .attr("x", 0)
        .attr("y", d => yScale(d.Location) + yScale.bandwidth() * 0.2)
        .attr("width", d => xScale(d.HealthyLifeExpectancy))
        .attr("height", yScale.bandwidth() * 0.6)
        .attr("fill", "green");  // Healthy Life Expectancy

    // ✅ Draw Bars (Unhealthy Years)
    svg.selectAll(".unhealthy-bar")
        .data(mergedData)
        .enter()
        .append("rect")
        .attr("class", "unhealthy-bar")
        .attr("x", d => xScale(d.HealthyLifeExpectancy))
        .attr("y", d => yScale(d.Location) + yScale.bandwidth() * 0.2)
        .attr("width", d => xScale(d.UnhealthyYears))
        .attr("height", yScale.bandwidth() * 0.6)
        .attr("fill", "red");  // Unhealthy Years

    // ✅ Add Y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale));

    // ✅ Add X-axis
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    // ✅ Add Title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .text("Life Expectancy vs. Healthy Life Expectancy (2021)");

    // ✅ Add Legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 150}, 20)`);

    const legendItems = [
        { color: "gray", label: "Total Life Expectancy" },
        { color: "green", label: "Healthy Life Expectancy" },
        { color: "red", label: "Unhealthy Years" }
    ];

    legend.selectAll(".legend-rect")
        .data(legendItems)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => d.color);

    legend.selectAll(".legend-text")
        .data(legendItems)
        .enter()
        .append("text")
        .attr("x", 20)
        .attr("y", (d, i) => i * 20 + 12)
        .style("font-size", "12px")
        .text(d => d.label);

    // console.log("✅ Bullet Chart rendered successfully!");

}).catch(error => {
    console.error("❌ Error loading the data:", error);
});
