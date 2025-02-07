// D3.js bar chart to visualize life expectancy at age 60 by region and year

// Update chart dimensions
const margin = { top: 50, right: 200, bottom: 100, left: 120 },
    width = 800 - margin.left - margin.right,  // Reduced width
    height = 600 - margin.top - margin.bottom;

// Update SVG container
const svg = d3.select(".chart-container")
    .append("svg")
    .attr("width", "150%")  // Make SVG responsive
    .attr("height", height + margin.top + margin.bottom)
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load the processed CSV data
d3.csv("/static/data/hle_processed_bar.csv").then(function (data) {

  // Convert numeric values and handle missing data
  data.forEach(d => {
    d.Period = +d.Period;
    d.FactValueNumeric = +d.FactValueNumeric || 0; // Handle missing values
  });

  console.log("Processed data:", data); // Check if data is loaded

  // Define all regions
  const allRegions = ["Africa", "Americas", "Eastern Mediterranean", "Europe", "South-East Asia", "Western Pacific"];
  const years = Array.from(new Set(data.map(d => d.Period)));

  // Transform data for stacked chart
  let transformedData = {};
  data.forEach(d => {
    if (!transformedData[d.Period]) transformedData[d.Period] = {};
    transformedData[d.Period][d.ParentLocation] = d.FactValueNumeric;
  });
  const finalData = years.map(year => ({ Period: year, ...transformedData[year] }));

  // Set up scales
  const x = d3.scaleBand()
  .domain(years)
  .range([0, width - 10]) // Prevent overflow
  .padding(0.1);  // Balance between spacing and width

  const y = d3.scaleLinear().domain([0, d3.max(finalData, d => d3.sum(allRegions, key => d[key] || 0))]).nice().range([height, 0]);
  const colorPalette = ["#143642", "#741C28", "#877765", "#E7DECD", "#A1A8BE", "#BB8C94"];
  const color = d3.scaleOrdinal(colorPalette).domain(allRegions);

  // Stack the data
  const stack = d3.stack().keys(allRegions);
  const stackedData = stack(finalData);

  console.log("Stacked Data:", stackedData);

  // Add X axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-0.8em")
    .attr("dy", "0.15em")
    .attr("transform", "rotate(-45)");
    // Add Y axis with a proper class and ensure it's visible
svg.append("g")
.attr("class", "y-axis")  // Add a class for easy debugging
.call(d3.axisLeft(y))
.attr("transform", `translate(0, 0)`)  // Ensure correct positioning
.style("font-size", "14px");  // Adjust font size if needed


  // Add X axis label
  svg.append("text")
    .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 20})`)
    .style("text-anchor", "middle")
    .text("Years");

  // Add Y axis
  svg.append("text")
    .attr("class", "y-axis-label")
    .attr("transform", "rotate(-90)")  // Rotate for Y-axis
    .attr("y", -margin.left + 30)  // Adjusted to bring it closer
    .attr("x", -height / 2)  // Center the label
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "#174c3c")
    .text("Life Expectancy (Years)");



  // Tooltip
  const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("background", "lightgray")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("display", "none");

  // Create stacked bars
  svg.selectAll(".layer")
    .data(stackedData)
    .enter()
    .append("g")
    .attr("class", "layer")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter()
    .append("rect")
    .attr("x", d => x(d.data.Period))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))  // Adjust height properly
    .attr("width", x.bandwidth())
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block")
        .html(`Year: ${d.data.Period}<br>Value: ${d[1] - d[0]}`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"));

  // Add legend
  const legend = svg.selectAll(".legend")
    .data(allRegions)
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(${width + 50},${i * 20})`);

  legend.append("rect")
    .attr("x", 0)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", color);

  legend.append("text")
    .attr("x", 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "start")
    .text(d => d);

}).catch(error => console.error("Error loading CSV data:", error));

