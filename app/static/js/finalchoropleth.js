document.addEventListener('DOMContentLoaded', () => {

const container = d3.select("#map");
const width = container.node().getBoundingClientRect().width;
const height = Math.min(600, width * 0.6);

const svg = container
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

const projection = d3.geoNaturalEarth1()
    .scale(225)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Define color scale
const colorScale = d3.scaleSequential(d3.interpolatePurples)
    .domain([0.5, 1.5]);

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
            .append("title")
            .text(d => `${d.properties.name}: ${dataMap[d.properties.name] || 'No data'}`);
    }

    // Initialize with the first available year
    updateMap(yearSelector.property("value"));

    // Add legend
    const legend = d3.select("#legend");
    legend.append("div").attr("class", "no-data")
        .html("<svg width='20' height='10'><rect width='20' height='10' fill='#ccc' stroke='#999' stroke-dasharray='4'></rect></svg> No data");

    const legendSvg = legend.append("svg").attr("width", 200).attr("height", 30);
    const legendGradient = legendSvg.append("defs").append("linearGradient")
        .attr("id", "legendGradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

    legendGradient.selectAll("stop")
        .data([
            { offset: "0%", color: colorScale(0.5) },
            { offset: "100%", color: colorScale(1.5) }
        ])
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    legendSvg.append("rect")
        .attr("x", 0)
        .attr("y", 5)
        .attr("width", 150)
        .attr("height", 10)
        .style("fill", "url(#legendGradient)");

    legendSvg.append("text").attr("x", 0).attr("y", 25).text("0.5");
    legendSvg.append("text").attr("x", 140).attr("y", 25).text("1.5");
});
});