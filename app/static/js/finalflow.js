const width = 1000;
const height = 400;

const svg = d3.select("#flow-map")
    .attr("width", width)
    .attr("height", height)
    .append("g");

// Define fixed X positions for WHO regions in a row
const regionPositions = {
    "Africa": 100,
    "Americas": 300,
    "Asia": 500,
    "Europe": 700,
    "Oceania": 900
};

// Define color scale for HALE differences
const colorScale = d3.scaleSequential(d3.interpolateRdYlGn) // Red-Yellow-Green scale
    .domain([-10, 10]); // Negative values (red), Positive values (green)

// Load JSON data
d3.json("../static/data/life_expectancy_allyears.json").then(data => {
    if (!data || data.length === 0) {
        console.error("❌ ERROR: No data loaded!");
        return;
    }
    console.log("✅ Loaded Data Successfully:", data);

    // Filter for 2015 and "Both sexes"
    const filteredData = data.filter(d => d.Period === 2015 && d.Dim1 === "Both sexes");
    console.log("✅ Filtered Data for 2015:", filteredData);

    if (filteredData.length === 0) {
        console.error("❌ ERROR: No data available for 2015!");
        return;
    }

    // Compute Average HALE for Each Region
    let regionAvgHALE = {};
    let regionGroups = d3.groups(filteredData, d => d.ParentLocation);

    regionGroups.forEach(([region, values]) => {
        regionAvgHALE[region] = d3.mean(values, d => d.HealthyLifeExpectancy);
    });

    console.log("✅ Average HALE per Region:", regionAvgHALE);

    // Identify HALE differences between regions
    let flows = [];
    Object.keys(regionPositions).forEach(region => {
        Object.keys(regionPositions).forEach(otherRegion => {
            if (region !== otherRegion) {
                let haleDiff = regionAvgHALE[otherRegion] - regionAvgHALE[region];

                flows.push({
                    from: region,
                    to: otherRegion,
                    haleDiff: haleDiff
                });
            }
        });
    });

    console.log("✅ HALE Flow Connections:", flows);

    // Draw Region Bars
    svg.append("g").selectAll(".region-bar")
        .data(Object.keys(regionPositions))
        .enter()
        .append("rect")
        .attr("class", "region-bar")
        .attr("x", d => regionPositions[d] - 20)
        .attr("y", height / 2 - 40)
        .attr("width", 40)
        .attr("height", 80)
        .attr("fill", "green")
        .attr("stroke", "black");

    console.log("✅ Bars Drawn Successfully!");

    // Add Region Labels
    svg.append("g").selectAll(".region-label")
        .data(Object.keys(regionPositions))
        .enter()
        .append("text")
        .attr("x", d => regionPositions[d])
        .attr("y", height / 2 + 60)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text(d => d);

    console.log("✅ Region Labels Added!");

    // Draw Flow Paths
    svg.append("g").selectAll("path")
        .data(flows)
        .enter()
        .append("path")
        .attr("d", d => {
            if (!regionPositions[d.from] || !regionPositions[d.to]) {
                console.warn(`⚠ Skipping flow due to missing position: ${d.from} → ${d.to}`);
                return "";
            }

            // Get start and end positions
            const startX = regionPositions[d.from];
            const endX = regionPositions[d.to];
            const baseY = height / 2;

            // Adjust curve height based on HALE difference
            let curveHeight = d.haleDiff > 0 ? -Math.abs(d.haleDiff) * 5 : Math.abs(d.haleDiff) * 5;
            let controlX = (startX + endX) / 2;
            let controlY = baseY + curveHeight;

            console.log(`✅ Drawing flow: ${d.from} → ${d.to} (HALE Diff: ${d.haleDiff})`);

            return `M ${startX},${baseY} 
                    Q ${controlX},${controlY} ${endX},${baseY}`;
        })
        .attr("stroke", d => colorScale(d.haleDiff))
        .attr("stroke-width", d => Math.abs(d.haleDiff) / 0.5) // Thicker for larger differences
        .attr("fill", "none")
        .attr("opacity", 0.8);

    console.log("✅ Flow Paths Drawn Successfully!");
});
