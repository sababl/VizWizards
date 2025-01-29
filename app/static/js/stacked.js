// ============================
// 1) Define color scales
//    -- Note: Updated domain to [1,6] if you have 6 categories (5 countries + 'other')
// ============================
const colorScales = {
  Oceania: d3.scaleLinear().domain([1, 6]).range(["#c6e5f5", "#08306b"]),
  Africa: d3.scaleLinear().domain([1, 6]).range(["#fdd0a2", "#e6550d"]),
  Europe: d3.scaleLinear().domain([1, 6]).range(["#e5f5e0", "#31a354"]),
  Asia: d3.scaleLinear().domain([1, 6]).range(["#dadaeb", "#54278f"]),
  "North America": d3.scaleLinear().domain([1, 6]).range(["#fee0d2", "#de2d26"]),
  "South America": d3.scaleLinear().domain([1, 6]).range(["#fde0ef", "#c51b8a"]),
};

// ============================
// 2) Dimensions for the top stacked chart
// ============================
const stackedMargin = { top: 60, right: 50, bottom: 150, left: 100 };
const stackedWidth = 1000 - stackedMargin.left - stackedMargin.right;
const stackedHeight = 800 - stackedMargin.top - stackedMargin.bottom;

// Create a tooltip for hover interactions
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("pointer-events", "none");

// Create SVG container for the initial stacked chart
const svgStackedMain = d3
  .select("#chart-stacked")
  .append("svg")
  .attr("width", stackedWidth + stackedMargin.left + stackedMargin.right)
  .attr("height", stackedHeight + stackedMargin.top + stackedMargin.bottom)
  .append("g")
  .attr("transform", `translate(${stackedMargin.left},${stackedMargin.top})`);

// Add a main title for clarity
svgStackedMain
  .append("text")
  .attr("x", stackedWidth / 2)
  .attr("y", -20) // slightly above the top margin
  .attr("text-anchor", "middle")
  .style("font-size", "18px")
  .text("Annual CO₂ Emissions (per capita) by Continent – 1996");

// Function to parse a country field value from the CSV (format: "{'CountryName': value}")
function parseCountryField(field) {
  const parts = field.replace(/[{}']/g, "").split(":");
  return {
    name: parts[0].trim(),
    value: +parts[1].trim(),
  };
}

// ============================
// 3) Draw the initial stacked chart
//    -- Added y-axis label, legend, optional sort
// ============================
function drawInitialStackedChart(parsedData) {
  // OPTIONAL: sort by largest total so bars appear from largest to smallest
  parsedData.sort(
    (a, b) => d3.sum(b.countries, c => c.value) - d3.sum(a.countries, c => c.value)
  );

  // Create scales
  const xScale = d3
    .scaleBand()
    .domain(parsedData.map(d => d.continent))
    .range([0, stackedWidth])
    .padding(0.2);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(parsedData, d => d3.sum(d.countries, c => c.value))])
    .nice()
    .range([stackedHeight, 0]);

  // Append axes
  svgStackedMain
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${stackedHeight})`)
    .call(d3.axisBottom(xScale));

  const yAxis = svgStackedMain
    .append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(yScale));

  // Add a y-axis label
  svgStackedMain
    .append("text")
    .attr("class", "y-axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", -stackedMargin.left + 20)
    .attr("x", -stackedHeight / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("CO₂ Emissions (tonnes per capita)");

  // Draw stacked bars
  svgStackedMain
    .selectAll(".bar-group")
    .data(parsedData)
    .enter()
    .append("g")
    .attr("class", "bar-group")
    .attr("transform", d => `translate(${xScale(d.continent)}, 0)`)
    .each(function (d) {
      const continentGroup = d3.select(this);
      let yOffset = 0;
      const continent = d.continent;
      const continentColorScale =
        colorScales[continent] ||
        d3.scaleLinear().domain([1, d.countries.length]).range(["#d3d3d3", "#696969"]);

      d.countries.forEach((country, index) => {
        continentGroup
          .append("rect")
          .attr("x", 0)
          .attr("y", yScale(yOffset + country.value))
          .attr("width", xScale.bandwidth())
          .attr("height", stackedHeight - yScale(country.value))
          .attr("fill", continentColorScale(index + 1))
          .on("mouseover", function (event) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
              .html(`Country: ${country.name}<br/>Value: ${country.value}`)
              .style("left", event.pageX + "px")
              .style("top", event.pageY - 28 + "px");
          })
          .on("mouseout", function () {
            tooltip.transition().duration(500).style("opacity", 0);
          });

        yOffset += country.value;
      });
    });

  // =========================
  // 4) Add a simple legend to clarify the color index => "top countries" mapping
  //    You may want a more robust legend that uses actual country names. 
  //    Below is a generic example for 6 segments:
  // =========================
  const legendContainer = svgStackedMain.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${stackedWidth - 120}, 20)`);

  const legendLabels = ["1st highest", "2nd highest", "3rd", "4th", "5th", "Other"];
  
  legendLabels.forEach((label, i) => {
    legendContainer
      .append("rect")
      .attr("x", 0)
      .attr("y", i * 20)
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", colorScales["Asia"](i + 1)); 
      // ^ Example only: picks one continent’s scale. 
      // If you want a single “universal” scale, 
      // define it above or show each continent’s color scale separately.

    legendContainer
      .append("text")
      .attr("x", 20)
      .attr("y", i * 20 + 12)
      .style("font-size", "12px")
      .text(label);
  });
}

// ============================
// Draw individual continent charts for each country key
// (minimal changes here—just ensure axis labels, etc. are clear)
// ============================
function drawIndividualCharts(processedData) {
  const smallChartWidth = 500;
  const smallChartHeight = 300;
  const smallChartMargin = { top: 20, right: 20, bottom: 20, left: 70 };
  const chartContainer = d3.select("#chart-container");

  // Determine a common domain for x-scale based on max value in processedData
  const maxVal = d3.max(processedData, d =>
    d3.max(["country_1", "country_2", "country_3", "country_4", "country_5", "other"], 
           key => d[key].value)
  );

  const xScale = d3
    .scaleLinear()
    .domain([0, maxVal])
    .range([0, smallChartWidth - smallChartMargin.left - smallChartMargin.right]);

  const yScale = d3
    .scaleBand()
    .domain(processedData.map(d => d.continent))
    .range([0, smallChartHeight - smallChartMargin.top - smallChartMargin.bottom])
    .padding(0.1);

  function drawChart(containerId, dataKey, title) {
    const container = chartContainer
      .append("div")
      .attr("class", "chart")
      .style("width", `${smallChartWidth}px`);

    // Add chart title
    container.append("div").attr("class", "chart-title").text(title);

    // Create the SVG container
    const svg = container
      .append("svg")
      .attr("width", smallChartWidth)
      .attr("height", smallChartHeight);

    const chart = svg
      .append("g")
      .attr("transform", `translate(${smallChartMargin.left}, ${smallChartMargin.top})`);

    // Draw bars
    chart
      .selectAll(".bar")
      .data(processedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", d => yScale(d.continent))
      .attr("height", yScale.bandwidth())
      .attr("width", d => xScale(d[dataKey].value) * 0.5) // scale factor
      .attr("fill", d => colorScales[d.continent](6)) // pick a darker shade for each continent
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(`Country: ${d[dataKey].name}<br/>Value: ${d[dataKey].value}`)
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    // Add x-axis
    chart
      .append("g")
      .attr("transform", `translate(0, ${smallChartHeight - smallChartMargin.top - smallChartMargin.bottom})`)
      .call(d3.axisBottom(xScale));

    // (Optional) Add label for x-axis or a note to show "tonnes/capita"
    chart.append("text")
      .attr("class", "x-axis-label")
      .attr("x", (smallChartWidth - smallChartMargin.left - smallChartMargin.right) / 2)
      .attr("y", smallChartHeight - smallChartMargin.bottom + 15)
      .style("text-anchor", "middle")
      .text("CO₂ Emissions (tonnes/capita)");

    // Add y-axis
    chart.append("g").call(d3.axisLeft(yScale));
  }

  // Generate a chart for each country key
  ["country_1", "country_2", "country_3", "country_4", "country_5", "other"].forEach(countryKey => {
    drawChart("#chart-container", countryKey, countryKey);
  });
}

// ============================
// Draw the normalized stacked chart
//    -- Add axis labels for clarity, e.g., "Percentage (%)" on x-axis
// ============================
function drawStackedChart(processedData) {
  const countries = ["country_1", "country_2", "country_3", "country_4", "country_5", "other"];
  const nStackedWidth = 600;
  const nStackedHeight = 400;
  const nStackedMargin = { top: 20, right: 20, bottom: 40, left: 100 };

  // Calculate the total for each continent
  processedData.forEach(d => {
    d.total = countries.reduce((sum, c) => sum + d[c].value, 0);
  });

  // Normalize data for stacked chart
  const normalizedData = processedData.map(d => {
    let x0 = 0;
    return {
      continent: d.continent,
      categories: countries.map((cKey, index) => {
        const value = (d[cKey].value / d.total) * 100; // Convert to percentage
        const seg = {
          country: d[cKey].name,
          x0: x0,
          x1: x0 + value,
          color: colorScales[d.continent](index + 1),
          percentage: value,
        };
        x0 += value;
        return seg;
      }),
    };
  });

  const xStackedScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([0, nStackedWidth - nStackedMargin.left - nStackedMargin.right]);

  const yStackedScale = d3
    .scaleBand()
    .domain(processedData.map(d => d.continent))
    .range([0, nStackedHeight - nStackedMargin.top - nStackedMargin.bottom])
    .padding(0.1);

  // Create the SVG container for the stacked chart
  const svgStacked = d3
    .select("#stacked-chart")
    .append("svg")
    .attr("width", nStackedWidth)
    .attr("height", nStackedHeight);

  // Create the chart group
  const chartStacked = svgStacked
    .append("g")
    .attr("transform", `translate(${nStackedMargin.left}, ${nStackedMargin.top})`);

  // Draw stacked bars
  normalizedData.forEach(d => {
    chartStacked
      .selectAll(`.bar-${d.continent}`)
      .data(d.categories)
      .enter()
      .append("rect")
      .attr("class", `bar-${d.continent}`)
      .attr("y", () => yStackedScale(d.continent))
      .attr("height", yStackedScale.bandwidth())
      .attr("x", seg => xStackedScale(seg.x0))
      .attr("width", seg => xStackedScale(seg.x1) - xStackedScale(seg.x0))
      .attr("fill", seg => seg.color)
      .on("mouseover", function (event, seg) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(`Country: ${seg.country}<br/>Percentage: ${seg.percentage.toFixed(2)}%`)
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(500).style("opacity", 0);
      });
  });

  // Add x-axis with percentage label
  chartStacked
    .append("g")
    .attr("transform", `translate(0, ${nStackedHeight - nStackedMargin.top - nStackedMargin.bottom})`)
    .call(
      d3
        .axisBottom(xStackedScale)
        .ticks(10)
        .tickFormat(d => d + "%")
    );

  // Label for x-axis
  chartStacked
    .append("text")
    .attr("class", "x-axis-label")
    .attr("x", (nStackedWidth - nStackedMargin.left - nStackedMargin.right) / 2)
    .attr("y", nStackedHeight - nStackedMargin.top - nStackedMargin.bottom + 35)
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Percentage of Total Emissions (%)");

  // Add y-axis with "continent" label
  chartStacked.append("g").call(d3.axisLeft(yStackedScale));
  chartStacked
    .append("text")
    .attr("class", "y-axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", -nStackedMargin.left + 20)
    .attr("x", - (nStackedHeight - nStackedMargin.top - nStackedMargin.bottom) / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Continent");
}

// ============================
// Load data and render charts
// ============================
d3.csv("/static/data/continent_summary_1996.csv").then(data => {
  // Parse countries to include names and values
  const parsedData = data.map(d => {
    return {
      continent: d.Continent,
      countries: [
        parseCountryField(d.country_1),
        parseCountryField(d.country_2),
        parseCountryField(d.country_3),
        parseCountryField(d.country_4),
        parseCountryField(d.country_5),
        // 'other' field seems to be "otherCountryName,value" => we replace comma with colon
        parseCountryField(d.other.replace(",", ":")),
      ].sort((a, b) => b.value - a.value),
    };
  });

  // 1) Draw the initial stacked chart
  drawInitialStackedChart(parsedData);

  // Prepare processedData for the other charts
  const processedData = data.map(d => {
    return {
      continent: d.Continent,
      country_1: parseCountryField(d.country_1),
      country_2: parseCountryField(d.country_2),
      country_3: parseCountryField(d.country_3),
      country_4: parseCountryField(d.country_4),
      country_5: parseCountryField(d.country_5),
      other: parseCountryField(d.other.replace(",", ":")),
    };
  });

  // 2) Draw the individual charts
  drawIndividualCharts(processedData);

  // 3) Draw the normalized stacked chart
  drawStackedChart(processedData);
});
