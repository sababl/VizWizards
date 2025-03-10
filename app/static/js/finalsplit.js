// Load CSV data
d3.csv("../static/data/hle.csv").then(data => {
    console.log(" Raw Data Loaded:", data);

    // Ensure numeric conversion
    data.forEach(d => {
        d.factValueNumeric = parseFloat(d["FactValueNumeric"]?.toString().replace(",", ".").trim());
    });

    // Filter for HALE at birth for Males in 2010 & 2021
    let filteredData = data.filter(d =>
        d.Indicator === "Healthy life expectancy (HALE) at birth (years)" &&
        d.Dim1 === "Male" &&
        (d.Period === "2010" || d.Period === "2021") &&
        !isNaN(d.factValueNumeric)
    );

    // console.log(" Filtered Data:", filteredData);

    if (filteredData.length === 0) {
        console.error("No matching data found!");
        return;
    }

    // Process data
    let processedData = filteredData.map(d => ({
        continent: d["ParentLocation"],
        country: d["Location"],
        year: d["Period"],
        hale: d.factValueNumeric
    }));

    //  Calculate the average HALE for each country in 2010 and 2021
    const avgHALEByCountry = d3.rollups(
        processedData,
        v => ({
            avgHALE2010: d3.mean(v.filter(d => d.year === "2010"), d => d.hale) || 0,
            avgHALE2021: d3.mean(v.filter(d => d.year === "2021"), d => d.hale) || 0
        }),
        d => d.country
    ).map(([country, values]) => ({
        country,
        avgHALE2010: values.avgHALE2010,
        avgHALE2021: values.avgHALE2021,
        continent: processedData.find(d => d.country === country)?.continent || "Unknown"
    }));

    console.log(" Average HALE by Country:", avgHALEByCountry);

    //  Find min and max HALE countries for each continent based on **average HALE**
    const minMaxHALEByContinent = d3.rollups(
        avgHALEByCountry,
        v => ({
            minHALECountry: v.reduce((a, b) => (a.avgHALE2010 + a.avgHALE2021 < b.avgHALE2010 + b.avgHALE2021 ? a : b)),
            maxHALECountry: v.reduce((a, b) => (a.avgHALE2010 + a.avgHALE2021 > b.avgHALE2010 + b.avgHALE2021 ? a : b))
        }),
        d => d.continent
    ).map(([continent, values]) => ({
        continent,
        countryMin2010: values.minHALECountry.country,
        countryMax2010: values.maxHALECountry.country,
        countryMin2021: values.minHALECountry.country,
        countryMax2021: values.maxHALECountry.country,
        minHALE2010: values.minHALECountry.avgHALE2010,
        maxHALE2010: values.maxHALECountry.avgHALE2010,
        minHALE2021: values.minHALECountry.avgHALE2021,
        maxHALE2021: values.maxHALECountry.avgHALE2021
    }));

    console.log(" Min and Max HALE by Continent:", minMaxHALEByContinent);

    //  Prepare data for visualization (NO CHANGES HERE)
    let visualData = [];
    minMaxHALEByContinent.forEach(d => {
        visualData.push({ country: d.countryMin2010, year: "2010", hale: d.minHALE2010 });
        visualData.push({ country: d.countryMax2010, year: "2010", hale: d.maxHALE2010 });
        visualData.push({ country: d.countryMin2021, year: "2021", hale: d.minHALE2021 });
        visualData.push({ country: d.countryMax2021, year: "2021", hale: d.maxHALE2021 });
    });

    console.log(" Processed Data for Plot:", visualData);

    drawChart(visualData);
});

// Function to draw the chart (UNCHANGED)
function drawChart(visualData) {
    const barWidth = 32;  // Even smaller bars to fit more data
    const margin = { top: 30, right: 30, bottom: 100, left: 70 }; // Reduced bottom space
    const width = visualData.length * barWidth + 100; // Ensure enough width
    const height = 200;  // Further reduced height

    // Ensure scrolling by setting the correct width
    document.getElementById("chart-container").style.width = (width + 50) + "px";
    document.getElementById("chart").setAttribute("width", width + margin.left + margin.right);
    document.getElementById("chart").setAttribute("height", height + margin.top + margin.bottom);

    const svg = d3.select("#chart")
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Set up scales
    const xScale = d3.scaleBand()
        .domain(visualData.map(d => d.country))
        .range([0, width])
        .padding(0.2); // Smaller padding

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(visualData, d => d.hale)])
        .nice()
        .range([height, 0]);

    const xSubgroup = d3.scaleBand()
        .domain(["2010", "2021"])
        .range([0, xScale.bandwidth()])
        .padding(0.05); // Reduced padding

    const color = d3.scaleOrdinal()
        .domain(["2010", "2021"])
        .range(["#3498db", "#e74c3c"]); 

    // Add X-axis with rotated labels
    const xAxis = svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    xAxis.selectAll("text")
        .attr("transform", "rotate(-15)")  // Less rotation
        .attr("dy", "0.5em")  // Move text slightly lower
        .attr("dx", "-0.3em")  
        .style("text-anchor", "end")  
        .style("font-size", "9px")  // Smaller text
        .style("fill", "#000");

    svg.append("g").call(d3.axisLeft(yScale));

    // Draw grouped bars
    svg.selectAll("g.bar-group")
        .data(visualData)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${xScale(d.country)}, 0)`)
        .selectAll("rect")
        .data(d => [
            { year: "2010", value: d.year === "2010" ? d.hale : null },
            { year: "2021", value: d.year === "2021" ? d.hale : null }
        ])
        .enter()
        .append("rect")
        .attr("x", d => xSubgroup(d.year))
        .attr("y", d => yScale(d.value))
        .attr("width", xSubgroup.bandwidth())
        .attr("height", d => height - yScale(d.value))
        .attr("fill", d => color(d.year));

    console.log(" Chart is now smaller and properly displayed");
}
