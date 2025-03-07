// ✅ Set dimensions for the chart
const margin = {top: 20, right: 40, bottom: 50, left: 130}; // Adjusted margins for better fit
const width = Math.min(700, window.innerWidth - margin.left - margin.right);
const height = Math.min(400, window.innerHeight - margin.top - margin.bottom);

// ✅ Select the SVG & Add Group Element
const svg = d3.select("#alluvial-chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);


const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "5px 10px")
    .style("border-radius", "5px")
    .style("box-shadow", "0px 2px 5px rgba(0,0,0,0.2)")
    .style("pointer-events", "none")
    .style("opacity", 0);

// ✅ Load Data
Promise.all([
    d3.csv("../static/data/le.csv"),
    d3.csv("../static/data/hle.csv")
]).then(([leData, hleData]) => {

    console.log("✅ Data Loaded Successfully:", leData, hleData);

    if (!leData.length || !hleData.length) {
        throw new Error("❌ Data is empty!");
    }

    // ✅ Filter Data for 2021
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

    console.log("Filtered LE data:", filteredLE);
    console.log("Filtered HLE data:", filteredHLE);

    // ✅ Merge Data
    let mergedData = filteredLE.map(le => {
        let hle = filteredHLE.find(h => h.Location === le.Location);
        let hleValue = hle ? hle.HealthyLifeExpectancy : le.LifeExpectancy;

        // ✅ Ensure HLE is never greater than LE
        if (hleValue > le.LifeExpectancy) {
            console.warn(`⚠️ Adjusting HLE for ${le.Location}: HLE (${hleValue}) > LE (${le.LifeExpectancy})`);
            hleValue = le.LifeExpectancy;
        }

        return {
            Location: le.Location,
            ParentLocation: le.ParentLocation, // Continent
            LifeExpectancy: le.LifeExpectancy,
            HealthyLifeExpectancy: hleValue,
            UnhealthyYears: Math.max((+le.LifeExpectancy ) - (+hleValue ), 0) // Ensure non-negative values
        };
    });


    // Manually set Healthy Life Expectancy for a specific country (e.g., India)
    mergedData.forEach(d => {
        if (d.Location === "Lesotho") {
            d.HealthyLifeExpectancy = 8.95;  // Change this to the desired value
            d.UnhealthyYears = 42.53;
        }
    });

    console.log("✅ Merged Data (After Fixes):", mergedData);

    // ✅ Find Highest & Lowest LE & HLE per Continent
    let finalSelectedData = [];
    let continents = [...new Set(mergedData.map(d => d.ParentLocation))];

    continents.forEach(continent => {
        let continentData = mergedData.filter(d => d.ParentLocation === continent);
        
        // ✅ Find highest and lowest LE and HLE per continent
        let highestLE = continentData.reduce((prev, curr) => (curr.LifeExpectancy > prev.LifeExpectancy ? curr : prev), continentData[0]);
        let lowestLE = continentData.reduce((prev, curr) => (curr.LifeExpectancy < prev.LifeExpectancy ? curr : prev), continentData[0]);
        
        let highestHLE = continentData.reduce((prev, curr) => (curr.HealthyLifeExpectancy > prev.HealthyLifeExpectancy ? curr : prev), continentData[0]);
        let lowestHLE = continentData.reduce((prev, curr) => (curr.HealthyLifeExpectancy < prev.HealthyLifeExpectancy ? curr : prev), continentData[0]);
        
        finalSelectedData.push(highestLE, lowestLE, highestHLE, lowestHLE);
    });

    // ✅ Remove Duplicates & Sort
    finalSelectedData = Array.from(
        new Map(finalSelectedData.filter(Boolean).map(item => [item.Location, item])).values()
    ).sort((a, b) => a.ParentLocation.localeCompare(b.ParentLocation) || b.LifeExpectancy - a.LifeExpectancy);


    // ✅ Define Scales
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(finalSelectedData, d => d.LifeExpectancy) + 5])
        .range([0, width]);

    const yScale = d3.scaleBand()
        .domain(finalSelectedData.map(d => d.Location))
        .range([0, height])
        .padding(0.4);

    console.log("✅ X-Scale Domain:", xScale.domain());
    console.log("✅ Y-Scale Domain:", yScale.domain());

    console.log("✅ Final Data for Chart:", finalSelectedData);

    // ✅ Draw Bars (Total Life Expectancy)
    svg.selectAll(".le-bar")
        .data(finalSelectedData)
        .enter()
        .append("rect")
        .attr("class", "le-bar")
        .attr("x", 0)
        .attr("y", d => yScale(d.Location) + yScale.bandwidth() * 0.5)
        .attr("width", d => xScale(d.LifeExpectancy))
        .attr("height", yScale.bandwidth())
        .attr("fill", "gray")
        .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1).html(`Total Life Expectancy: ${event.LifeExpectancy || 0} years`);
            
        })                
        .on("mousemove", function (event) {
            const barRect = this.getBoundingClientRect();
            tooltip.style("left", `${barRect.x + barRect.width + 10}px`) // Position to the right of the bar
                   .style("top", `${barRect.y + 10}px`); 
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        });

    // ✅ Draw Bars (Healthy Life Expectancy)
    svg.selectAll(".hle-bar")
        .data(finalSelectedData)
        .enter()
        .append("rect")
        .attr("class", "hle-bar")
        .attr("x", 0)
        .attr("y", d => yScale(d.Location) + yScale.bandwidth() * 0.9)
        .attr("width", d => xScale(d.HealthyLifeExpectancy))
        .attr("height", yScale.bandwidth() * 0.6)
        .attr("fill", "green")
        .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1).html(`Healthy Life Expectancy: ${event.HealthyLifeExpectancy|| 0} years`);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        });

    // ✅ Draw Bars (Unhealthy Years)
    svg.selectAll(".unhealthy-bar")
        .data(finalSelectedData)
        .enter()
        .append("rect")
        .attr("class", "unhealthy-bar")
        .attr("x", d => xScale(d.HealthyLifeExpectancy))
        .attr("y", d => yScale(d.Location) + yScale.bandwidth() * 0.9)
        .attr("width", d => xScale(d.UnhealthyYears))
        .attr("height", yScale.bandwidth() * 0.6)
        .attr("fill", "red")
        .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1).html(`Unhealthy Years: ${event.UnhealthyYears|| 0}} years`);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        });

    // ✅ Add Country Names
    svg.selectAll(".country-label")
        .data(finalSelectedData)
        .enter()
        .append("text")
        .attr("class", "country-label")
        .attr("x", -10)
        .attr("y", d => yScale(d.Location) + yScale.bandwidth() / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(d => d.Location);

    // ✅ Add Legend
    const legend = svg.append("g")
    .attr("transform", `translate(${width - 700}, 450)`); // Adjust the position

    // Legend for Total Life Expectancy (Gray)
    legend.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", "gray");

    legend.append("text")
    .attr("x", 30)
    .attr("y", 15)
    .text("Total Life Expectancy")
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");

    // Legend for Healthy Life Expectancy (Green)
    legend.append("rect")
    .attr("x", 0)
    .attr("y", 30)
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", "green");

    legend.append("text")
    .attr("x", 30)
    .attr("y", 45)
    .text("Healthy Life Expectancy")
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");

    // Legend for Unhealthy Years (Red)
    legend.append("rect")
    .attr("x", 0)
    .attr("y", 60)
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", "red");

    legend.append("text")
    .attr("x", 30)
    .attr("y", 75)
    .text("Unhealthy Years")
    .style("font-size", "12px")
    .attr("alignment-baseline", "middle");

    console.log("✅ Bullet Chart Rendered Successfully!");

}).catch(error => {
    console.error("❌ Error loading the data:", error);
});
