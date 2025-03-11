//  Set dimensions for the chart
const alluvialMargin = { top: 20, right: 40, bottom: 50, left: 130 };
const alluvialWidth = Math.min(700, window.innerWidth - alluvialMargin.left - alluvialMargin.right);
const alluvialHeight = Math.min(550, window.innerHeight - alluvialMargin.top - alluvialMargin.bottom);

//  Select the SVG & Add Group Element
const alluvialSvg = d3.select("#alluvial-chart")
    .append("svg")
    .attr("width", alluvialWidth + alluvialMargin.left + alluvialMargin.right)
    .attr("height", alluvialHeight + alluvialMargin.top + alluvialMargin.bottom)
    .append("g")
    .attr("transform", `translate(${alluvialMargin.left},${alluvialMargin.top})`);


const alluvialTooltip = d3.select("body")
    .append("div")
    .attr("class", "chart-tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "5px 10px")
    .style("border-radius", "5px")
    .style("box-shadow", "0px 2px 5px rgba(0,0,0,0.2)")
    .style("pointer-events", "none")
    .style("opacity", 0);

Promise.all([
    d3.csv("../static/data/le.csv"),
    d3.csv("../static/data/hle.csv")
]).then(([leData, hleData]) => {

    // // console.log(" Data Loaded Successfully:", leData, hleData);

    if (!leData.length || !hleData.length) {
        throw new Error("Data is empty!");
    }

    //  Filter Data for 2021
    const filteredLE = leData.filter(d =>
        d.Indicator === "Life expectancy at birth (years)" &&
        d.Dim1 === "Both sexes" &&
        +d.Period === 2021).map(d => ({
            Location: d.Location,
            ParentLocation: d.ParentLocation, // Continent
            LifeExpectancy: +d.FactValueNumeric || 0
        }));

    const filteredHLE = hleData.filter(d =>
        d.Indicator === "Healthy life expectancy (HALE) at birth (years)" &&
        d.Dim1 === "Both sexes" &&
        +d.Period === 2021).map(d => ({
            Location: d.Location,
            ParentLocation: d.ParentLocation, // Continent
            HealthyLifeExpectancy: +d.FactValueNumeric || 0
        }));

    // console.log("Filtered LE data:", filteredLE);
    // console.log("Filtered HLE data:", filteredHLE);

    //  Merge Data and filter out locations without HLE data
    let mergedData = filteredLE.map(le => {
        let hle = filteredHLE.find(h => h.Location === le.Location);
        // Skip locations without HLE data
        if (!hle) return null;
        
        let hleValue = hle.HealthyLifeExpectancy;
    
        // Ensure HLE is never greater than LE
        if (hleValue > le.LifeExpectancy) {
            console.warn(` Adjusting HLE for ${le.Location}: HLE (${hleValue}) > LE (${le.LifeExpectancy})`);
            hleValue = le.LifeExpectancy;
        }
        
        return {
            Location: le.Location,
            ParentLocation: le.ParentLocation,
            LifeExpectancy: le.LifeExpectancy,
            HealthyLifeExpectancy: hleValue,
            UnhealthyYears: Math.max((+le.LifeExpectancy) - (+hleValue), 0)
        };
    }).filter(item => item !== null); // Remove null entries

    // console.log("Merged Data (After Fixes):", mergedData);

    //  Find Highest & Lowest LE & HLE per Continent
    let finalSelectedData = [];
    let continents = [...new Set(mergedData.map(d => d.ParentLocation))];

    continents.forEach(continent => {
        let continentData = mergedData.filter(d => d.ParentLocation === continent);

        //  Find highest and lowest LE and HLE per continent
        let highestLE = continentData.reduce((prev, curr) => (curr.LifeExpectancy > prev.LifeExpectancy ? curr : prev), continentData[0]);
        let lowestLE = continentData.reduce((prev, curr) => (curr.LifeExpectancy < prev.LifeExpectancy ? curr : prev), continentData[0]);

        let highestHLE = continentData.reduce((prev, curr) => (curr.HealthyLifeExpectancy > prev.HealthyLifeExpectancy ? curr : prev), continentData[0]);
        let lowestHLE = continentData.reduce((prev, curr) => (curr.HealthyLifeExpectancy < prev.HealthyLifeExpectancy ? curr : prev), continentData[0]);

        finalSelectedData.push(highestLE, lowestLE, highestHLE, lowestHLE);
    });

    //  Remove Duplicates & Sort
    finalSelectedData = Array.from(
        new Map(finalSelectedData.filter(Boolean).map(item => [item.Location, item])).values()
    ).sort((a, b) => a.ParentLocation.localeCompare(b.ParentLocation) || b.LifeExpectancy - a.LifeExpectancy);


    //  Define Scales
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(finalSelectedData, d => d.LifeExpectancy) + 5])
        .range([0, alluvialWidth]);

    const yScale = d3.scaleBand()
        .domain(finalSelectedData.map(d => d.Location))
        .range([0, alluvialHeight])
        .padding(0.4);

    // console.log(" X-Scale Domain:", xScale.domain());
    // console.log(" Y-Scale Domain:", yScale.domain());

    // console.log(" Final Data for Chart:", finalSelectedData);

    //  Draw Bars (Total Life Expectancy)
    alluvialSvg.selectAll(".le-bar")
        .data(finalSelectedData)
        .enter()
        .append("rect")
        .attr("class", "le-bar")
        .attr("x", 0)
        .attr("y", d => yScale(d.Location) + yScale.bandwidth() * 0.5)
        .attr("width", d => xScale(d.LifeExpectancy))
        .attr("height", yScale.bandwidth())
        .attr("fill", "var(--dark-gray)") // Using neutral gray color
        .on("mouseover", function (event, d) {
            alluvialTooltip.style("opacity", 1)
                .html(`Total Life Expectancy: ${d.LifeExpectancy.toFixed(1)} years`);
        })
        .on("mousemove", function (event) {
            const barRect = this.getBoundingClientRect();
            alluvialTooltip.style("left", `${barRect.x + barRect.width + 10}px`) // Position to the right of the bar
                .style("top", `${barRect.y + 10}px`);
        })
        .on("mouseout", function () {
            alluvialTooltip.style("opacity", 0);
        });

    //  Draw Bars (Healthy Life Expectancy)
    alluvialSvg.selectAll(".hle-bar")
        .data(finalSelectedData)
        .enter()
        .append("rect")
        .attr("class", "hle-bar")
        .attr("x", 0)
        .attr("y", d => yScale(d.Location) + yScale.bandwidth() * 0.9)
        .attr("width", d => xScale(d.HealthyLifeExpectancy))
        .attr("height", yScale.bandwidth() * 0.6)
        .attr("fill", "var(--primary-light)") // Using visualization green
        .on("mouseover", function (event, d) {
            alluvialTooltip.style("opacity", 1)
                .html(`Healthy Life Expectancy: ${d.HealthyLifeExpectancy.toFixed(1)} years`);
        })
        .on("mousemove", function (event) {
            alluvialTooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            alluvialTooltip.style("opacity", 0);
        });

    //  Draw Bars (Unhealthy Years)
    alluvialSvg.selectAll(".unhealthy-bar")
        .data(finalSelectedData)
        .enter()
        .append("rect")
        .attr("class", "unhealthy-bar")
        .attr("x", d => xScale(d.HealthyLifeExpectancy))
        .attr("y", d => yScale(d.Location) + yScale.bandwidth() * 0.9)
        .attr("width", d => xScale(d.UnhealthyYears))
        .attr("height", yScale.bandwidth() * 0.6)
        .attr("fill", "var(--secondary-light)") // Using visualization orange
        .on("mouseover", function (event, d) {
            alluvialTooltip.style("opacity", 1)
                .html(`Unhealthy Years: ${d.UnhealthyYears.toFixed(1)} years`);
        })
        .on("mousemove", function (event) {
            alluvialTooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            alluvialTooltip.style("opacity", 0);
        });

    // Add X-axis
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d => d + " years");

    alluvialSvg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${alluvialHeight})`)
        .call(xAxis);

    // Add Y-axis
    const yAxis = d3.axisLeft(yScale);

    alluvialSvg.append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .selectAll("text")
        .style("text-anchor", "end");

    // Add X-axis label
    alluvialSvg.append("text")
        .attr("class", "axis-label")
        .attr("x", alluvialWidth / 2)
        .attr("y", alluvialHeight + 40)
        .style("text-anchor", "middle")
        .text("Years");

    // Remove country labels since we now have Y-axis
    alluvialSvg.selectAll(".country-label").remove();

    // Move legend to right side and adjust position
    const legend = alluvialSvg.append("g")
        .attr("transform", `translate(${alluvialWidth + 20}, 20)`); // Move to right side

    // Update legend styling for better alignment
    const legendSpacing = 30;

    // Legend for Total Life Expectancy (Gray)
    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "var(--dark-gray)");

    legend.append("text")
        .attr("x", 30)
        .attr("y", 10)
        .text("Total Life Expectancy")
        .style("font-size", "12px")
        .attr("dominant-baseline", "middle");

    // Legend for Healthy Life Expectancy (Green)
    legend.append("rect")
        .attr("x", 0)
        .attr("y", legendSpacing)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "var(--primary-light)");

    legend.append("text")
        .attr("x", 30)
        .attr("y", legendSpacing + 10)
        .text("Healthy Life Expectancy")
        .style("font-size", "12px")
        .attr("dominant-baseline", "middle");

    // Legend for Unhealthy Years (Red)
    legend.append("rect")
        .attr("x", 0)
        .attr("y", legendSpacing * 2)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "var(--secondary-light)");

    legend.append("text")
        .attr("x", 30)
        .attr("y", legendSpacing * 2 + 10)
        .text("Unhealthy Years")
        .style("font-size", "12px")
        .attr("dominant-baseline", "middle");

    // console.log(" Bullet Chart Rendered Successfully!");

}).catch(error => {
    console.error("Error loading the data:", error);
});
