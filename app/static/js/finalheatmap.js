// Set up dimensions for the heatmap
const h_margin = { top: 50, right: 50, bottom: 100, left: 120 };
const h_width = 800 - h_margin.left - h_margin.right;
const h_height = 500 - h_margin.top - h_margin.bottom;

const h_svg = d3.select("#heatmap-container")
    .append("svg")
    .attr("width", h_width + h_margin.left + h_margin.right)
    .attr("height", h_height + h_margin.top + h_margin.bottom)
    .append("g")
    .attr("transform", `translate(${h_margin.left}, ${h_margin.top})`);
    
// Create a tooltip div that is hidden by default:
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

d3.csv("/static/data/le.csv").then(function (data) {
    // Log unique status values
    // console.log("Available status values:",
    //     [...new Set(data.map(d => d.Indicator))]
    // );

    // Filter data for life expectancy at age 60 for Females
    let filteredData = data.filter(d =>
        d.Indicator === "Life expectancy at age 60 (years)" &&
        d.Dim1 === "Female"
    );

    // console.log("Filtered data length:", filteredData.length);
    // console.log("Sample filtered record:", filteredData[0]);

    if (filteredData.length === 0) {
        console.error("No data found after filtering!");
        return;
    }

    // Process data: convert life expectancy to number and remove NaNs
    const processedData = filteredData.map(d => ({
        continent: d.ParentLocation,
        year: d.Period,
        lifeExpectancy: +d.FactValueNumeric
    })).filter(d => !isNaN(d.lifeExpectancy));
    // console.log("Sample record:", filteredData[0]);

    // Group data by continent and year, then compute the average life expectancy
    const averageData = Array.from(
        d3.group(processedData, d => d.continent, d => d.year),
        ([continent, yearMap]) => {
            return Array.from(yearMap, ([year, values]) => {
                const avgLE = d3.mean(values, d => d.lifeExpectancy);
                return { continent, year, avgLE };
            });
        }
    ).flat();

    // console.log("Average Data:", averageData);

    // Extract unique continents and years from the aggregated data
    const continents = Array.from(new Set(averageData.map(d => d.continent)));
    const years = Array.from(new Set(averageData.map(d => d.year))).sort();

    // Define scales using averageData
    const xScale = d3.scaleBand()
        .domain(years)
        .range([0, h_width])
        .padding(0.1);

    const yScale = d3.scaleBand()
        .domain(continents)
        .range([0, h_height])
        .padding(0.1);

    // Get the original extent of average life expectancy
    const dataExtent = d3.extent(averageData, d => d.avgLE);
    // Extend the domain by subtracting 5 from the minimum and adding 5 to the maximum
    const extendedDomain = [dataExtent[0] - 5, dataExtent[1] + 5];

    // Use the extended domain for the color scale
    const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
        .domain(extendedDomain);

    // Draw axes
    h_svg.append("g")
        .attr("transform", `translate(0, ${h_height})`)
        .call(d3.axisBottom(xScale).tickSize(0))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "-0.5em")
        .attr("transform", "rotate(-45)");

    h_svg.append("g")
        .call(d3.axisLeft(yScale).tickSize(0));

    // Add axis labels
    h_svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", h_width / 1.3)
        .attr("y", h_height + h_margin.bottom + 20)
        .text("Years");

    h_svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", h_width / 1)
        .attr("y", h_height + h_margin.bottom - 79)
        .text("Years");

    h_svg.append("text")
        .attr("class", "axis-label")

        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -h_height / 2)
        .attr("y", -h_margin.left + 30)
        .text("Continents");

    // Draw heatmap rectangles using averageData
    h_svg.selectAll("rect")
        .data(averageData)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.year))
        .attr("y", d => yScale(d.continent))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.avgLE))
        .on("mouseover", function (event, d) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html("Avg LE: " + d.avgLE.toFixed(2))
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", function (event) {
            tooltip.style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Create legend using the extended domain
    const legendWidth = 500;
    const legendHeight = 20;

    const legendSvg = h_svg.append("g")
        .attr("transform", `translate(${h_width / 3.5 - 100}, ${h_height + 50})`);

    const legendScale = d3.scaleLinear()
        .domain(extendedDomain)
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale).ticks(10);

    legendSvg.append("g")
        .call(legendAxis)
        .attr("transform", `translate(0, ${legendHeight})`);

    // Create a legend gradient with multiple stops based on the extended domain
    const legendGradient = legendSvg.append("defs")
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

    const [minExtended, maxExtended] = extendedDomain;
    const tickValues = legendScale.ticks(5);
    tickValues.forEach(t => {
        const offset = ((t - minExtended) / (maxExtended - minExtended)) * 100;
        legendGradient.append("stop")
            .attr("offset", offset + "%")
            .attr("stop-color", colorScale(t));
    });

    legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");

}).catch(function (error) {
    console.error("Error loading or processing data:", error);
});
