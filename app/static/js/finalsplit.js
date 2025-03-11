// Load CSV data
d3.csv("../static/data/hle.csv").then(data => {
    // console.log(" Raw Data Loaded:", data);

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

    // // console.log(" Filtered Data:", filteredData);

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

    // console.log(" Average HALE by Country:", avgHALEByCountry);

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

    // console.log(" Min and Max HALE by Continent:", minMaxHALEByContinent);

    //  Prepare data for visualization (NO CHANGES HERE)
    let visualData = [];
    minMaxHALEByContinent.forEach(d => {
        visualData.push({ country: d.countryMin2010, year: "2010", hale: d.minHALE2010 });
        visualData.push({ country: d.countryMax2010, year: "2010", hale: d.maxHALE2010 });
        visualData.push({ country: d.countryMin2021, year: "2021", hale: d.minHALE2021 });
        visualData.push({ country: d.countryMax2021, year: "2021", hale: d.maxHALE2021 });
    });

    // console.log(" Processed Data for Plot:", visualData);

    drawChart(visualData);
});

// Function to draw the chart (UNCHANGED)
function drawChart(visualData) {
    // Update the width and margin calculations
    const barWidth = 25;  // Decreased bar width
    const margin = { 
        top: 30, 
        right: 120,  // Decreased right margin
        bottom: 100, 
        left: 70 
    };
    const width = visualData.length * barWidth + 50;
    const height = 200;

    // Ensure scrolling by setting the correct width
    document.getElementById("chart-container").style.width = (width + 50) + "px";
    document.getElementById("chart").setAttribute("width", width + margin.left + margin.right);
    document.getElementById("chart").setAttribute("height", height + margin.top + margin.bottom);

    const svg = d3.select("#chart")
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const tooltip = d3.select("body").append("div")
        .attr("class", "chart-tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "4px")
        .style("padding", "8px")
        .style("pointer-events", "none")
        .style("font-size", "12px")
        .style("box-shadow", "2px 2px 6px rgba(0,0,0,0.3)");

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
        .range(['var(--primary-light)', 'var(--secondary-light)']); 

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
            { year: "2010", value: d.year === "2010" ? d.hale : 0 },
            { year: "2021", value: d.year === "2021" ? d.hale : 0 }
        ].filter(item => item.value > 0)) // Filter out zero values
        .enter()
        .append("rect")
        .attr("x", d => xSubgroup(d.year))
        .attr("y", d => yScale(d.value))
        .attr("width", xSubgroup.bandwidth())
        .attr("height", d => {
            const h = height - yScale(d.value);
            return isNaN(h) ? 0 : h; // Ensure we never return NaN
        })
        .attr("fill", d => color(d.year))
        .on("mouseover", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .style("opacity", 0.7);
                
            tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            
            tooltip.html(`
                <strong>${d.year}</strong><br/>
                Country: ${this.parentNode.__data__.country}<br/>
                HALE: ${d.value.toFixed(1)} years
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .transition()
                .duration(200)
                .style("opacity", 1);
                
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add legend after drawing the bars
    // Update legend position
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 10}, 10)`); // Moved legend closer to chart

    // Update legend item spacing and position
    const years = ["2010", "2021"];
    years.forEach((year, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`); // Reduced vertical spacing
            
        legendRow.append("rect")
            .attr("width", 12)  // Slightly smaller rectangle
            .attr("height", 12)
            .attr("fill", color(year));
            
        legendRow.append("text")
            .attr("x", 20)  // Reduced space between rect and text
            .attr("y", 10)
            .style("font-size", "11px")  // Slightly smaller font
            .style("font-weight", "normal")
            .text(year);
    });

    // Add Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("HALE (years)");

    // console.log(" Chart is now smaller and properly displayed");
}
