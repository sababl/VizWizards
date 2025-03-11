document.addEventListener('DOMContentLoaded', () => {

const container = d3.select("#map");
const containerWidth = container.node().getBoundingClientRect().width;
const containerHeight = window.innerHeight * 0.6; // 60% of viewport height

// Create responsive SVG that fits the container
const svg = container
    .append("svg")
    .attr("width", "100%")
    .attr("height", containerHeight)
    .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

// Adjust projection scale and translation
const projection = d3.geoNaturalEarth1()
    .scale((containerWidth / 6.2) * Math.min(containerWidth/1000, 1))
    .translate([containerWidth / 2, containerHeight / 2]);

const path = d3.geoPath().projection(projection);

// Define color scale
const colorScale = d3.scaleSequential(d3.interpolatePurples)
    .domain([0.5, 1.5]);

const tooltip = d3.select("body").append("div")
    .attr("class", "chart-tooltip")
    .style("opacity", 0);

// Load data
Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.csv("/static/data/Updated_Country_Names_in_Data.csv")
]).then(([geoData, csvData]) => {
    let dataByYear = {};
    let years = new Set();

    csvData.forEach(d => {
        if (!dataByYear[d.Period]) {
            dataByYear[d.Period] = {};
        }
        dataByYear[d.Period][d.Location] = +d.SexRatio;
        years.add(d.Period);
    });
    // console.log('Processed data by year:', dataByYear);

    // Populate year selector
    const yearSelector = d3.select("#yearSelector");
    Array.from(years).sort().forEach(year => {
        yearSelector.append("option").attr("value", year).text(year);
    });

    yearSelector.on("change", function () {
        updateMap(this.value);
    });

    function updateMap(year) {
        let dataMap = dataByYear[year] || {};

        svg.selectAll(".country")
            .data(geoData.features)
            .join("path")
            .attr("class", "country")
            .attr("d", path)
            .attr("fill", d => {
                const value = dataMap[d.properties.name];
                return value ? colorScale(value) : "#ccc";
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                tooltip.html(`Country: ${d.properties.name}<br/>Value: ${dataMap[d.properties.name] || 'No data'}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .append("title")
            .text(d => `${d.properties.name}: ${dataMap[d.properties.name] || 'No data'}`);
    }

    // Initialize with the first available year
    updateMap(yearSelector.property("value"));

    // Add legend
    const legend = d3.select("#legend");
    legend.append("div").attr("class", "no-data")
        .html("<svg width='20' height='10'><rect width='20' height='10' fill='#ccc' stroke='#999' stroke-dasharray='4'></rect></svg> No data");

    // Update the legend dimensions
    const legendWidth = 20;
    const legendHeight = 200;

    // Create legend with new dimensions
    const legendSvg = legend.append("svg")
        .attr("width", 60)  // Increased width to accommodate labels
        .attr("height", legendHeight + 30);  // Added space for labels

    // Update gradient for vertical orientation
    const legendGradient = legendSvg.append("defs")
        .append("linearGradient")
        .attr("id", "legendGradient")
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "0%")
        .attr("y2", "100%");  // Changed to vertical orientation

    // Update gradient stops
    legendGradient.selectAll("stop")
        .data([
            { offset: "0%", color: colorScale(1.5) },    // Reversed order for vertical
            { offset: "100%", color: colorScale(0.5) }
        ])
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    // Update rectangle for vertical orientation
    legendSvg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legendGradient)");

    // Update text labels for vertical orientation
    legendSvg.append("text")
        .attr("x", legendWidth + 5)
        .attr("y", 10)
        .text("1.5");

    legendSvg.append("text")
        .attr("x", legendWidth + 5)
        .attr("y", legendHeight)
        .text("0.5");

    // Update the no-data indicator position
    legend.select(".no-data")
        .style("margin-top", "10px");
});
});