// Set up dimensions
const margin = { top: 50, right: 50, bottom: 100, left: 140 }; // Increased left margin for Y-axis label
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create SVG
const svg = d3.select("#chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Load JSON data
const dataPath = "../static/data/life_expectancy_allyears.json";

d3.json(dataPath).then(data => {
    console.log("✅ Raw Data Loaded:", data);

    // 🔍 Check available Status values in the dataset
    console.log("🔍 Unique Status values:", [...new Set(data.map(d => d.Status))]);

    // Filter for HALE at birth for Males in 2010 & 2021
    let filteredData = data.filter(d =>
        d.Dim1 === "Male" &&
        d.Status === "Life expectancy at birth (years)" &&  // ✅ Ensure we select HALE at birth
        (d.Period === 2010 || d.Period === 2021)
    );

    console.log("✅ Filtered Data:", filteredData);

    if (filteredData.length === 0) {
        console.error("❌ No matching data found! Check if 'Status' and 'Period' exist in the dataset.");
        return;
    }

    // Group data by continent
    let dataByContinent = d3.group(filteredData, d => d.ParentLocation);

    let processedData = [];

    dataByContinent.forEach((values, continent) => {
        let yearData = { 2010: [], 2021: [] };

        values.forEach(d => {
            let value = parseFloat(d.HealthyLifeExpectancy?.toString().replace(",", ".").trim()); // ✅ Extract from correct field
            if (!isNaN(value)) {
                yearData[d.Period].push(value);
            }
        });

        console.log(`📌 Continent: ${continent}`);
        console.log(`  🔹 HALE Values 2010:`, yearData[2010]);
        console.log(`  🔹 HALE Values 2021:`, yearData[2021]);

        // Compute average HALE for 2010 and 2021
        let avg2010 = d3.mean(yearData[2010]) || NaN;
        let avg2021 = d3.mean(yearData[2021]) || NaN;

        console.log(`  🔸 Average HALE 2010: ${avg2010}`);
        console.log(`  🔸 Average HALE 2021: ${avg2021}`);

        // Store processed data if both values are valid
        if (!isNaN(avg2010) && !isNaN(avg2021)) {
            processedData.push({ continent, year: "2010", hale: avg2010 });
            processedData.push({ continent, year: "2021", hale: avg2021 });
        } else {
            console.warn(`⚠️ Missing valid HALE data for ${continent}`);
        }
    });

    console.log("✅ Processed Data for Plot:", processedData);

    // If no valid data, stop execution
    if (processedData.length === 0) {
        console.error("❌ No valid HALE data found! Check dataset.");
        return;
    }

    // Extract unique continents and years
    const continents = Array.from(new Set(processedData.map(d => d.continent)));
    const years = ["2010", "2021"];

    // Set up scales
    const xScale = d3.scaleBand()
        .domain(continents)
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => d.hale)])
        .nice()
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(years)
        .range(["#3498db", "#e74c3c"]); // Blue for 2010, Red for 2021

    // Create grouped X scale
    const xSubgroup = d3.scaleBand()
        .domain(years)
        .range([0, xScale.bandwidth()])
        .padding(0.05);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g").call(d3.axisLeft(yScale));

    // Draw grouped bars
    svg.selectAll("g.bar-group")
        .data(continents)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${xScale(d)}, 0)`)
        .selectAll("rect")
        .data(d => processedData.filter(p => p.continent === d))
        .enter()
        .append("rect")
        .attr("x", d => xSubgroup(d.year))
        .attr("y", d => yScale(d.hale))
        .attr("width", xSubgroup.bandwidth())
        .attr("height", d => height - yScale(d.hale))
        .attr("fill", d => colorScale(d.year));

    console.log("✅ Chart Rendered Successfully");

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Healthy Life Expectancy at Birth for Males (2010 vs 2021)");

    // **Add Y-Axis Label**
    svg.append("text")
        .attr("transform", "rotate(-90)")  // Rotate text to align with Y-axis
        .attr("x", -height / 2)
        .attr("y", -margin.left + 70)  // Adjust to position properly
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Healthy Life Expectancy at Birth (Years)");

}).catch(error => {
    console.error("❌ Error loading data:", error);
});
