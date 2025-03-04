// ✅ Set dimensions for the chart
const margin = {top: 20, right: 80, bottom: 50, left: 200}; // Adjusted left margin for labels
const width = Math.min(1100, window.innerWidth - margin.left - margin.right);
const height = Math.min(600, window.innerHeight - margin.top - margin.bottom);

// ✅ Select the SVG & Add Group Element
const svg = d3.select("#alluvial-chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

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
        let hleValue = hle ? hle.HealthyLifeExpectancy : 0;

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
            UnhealthyYears: Math.max(le.LifeExpectancy - hleValue, 0) // Ensure non-negative values
        };
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

    console.log("✅ Final Data for Chart:", finalSelectedData);

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

    // ✅ Draw Bars (Total Life Expectancy)
    svg.selectAll(".le-bar")
        .data(finalSelectedData)
        .enter()
        .append("rect")
        .attr("class", "le-bar")
        .attr("x", 0)
        .attr("y", d => yScale(d.Location))
        .attr("width", d => xScale(d.LifeExpectancy))
        .attr("height", yScale.bandwidth())
        .attr("fill", "gray");

    // ✅ Draw Bars (Healthy Life Expectancy)
    svg.selectAll(".hle-bar")
        .data(finalSelectedData)
        .enter()
        .append("rect")
        .attr("class", "hle-bar")
        .attr("x", 0)
        .attr("y", d => yScale(d.Location) + yScale.bandwidth() * 0.2)
        .attr("width", d => xScale(d.HealthyLifeExpectancy))
        .attr("height", yScale.bandwidth() * 0.6)
        .attr("fill", "green");

    // ✅ Draw Bars (Unhealthy Years)
    svg.selectAll(".unhealthy-bar")
        .data(finalSelectedData)
        .enter()
        .append("rect")
        .attr("class", "unhealthy-bar")
        .attr("x", d => xScale(d.HealthyLifeExpectancy))
        .attr("y", d => yScale(d.Location) + yScale.bandwidth() * 0.2)
        .attr("width", d => xScale(d.UnhealthyYears))
        .attr("height", yScale.bandwidth() * 0.6)
        .attr("fill", "red");

    // ✅ Add Y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale));

    // ✅ Add X-axis
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    console.log("✅ Bullet Chart Rendered Successfully!");

}).catch(error => {
    console.error("❌ Error loading the data:", error);
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("fill", "red")
        .text("Error loading data. Check console for details.");
});
