// Define color scales for continents
const colorScales = {
  Oceania: d3.scaleLinear().domain([1, 5]).range(["#c6e5f5", "#08306b"]),
  Africa: d3.scaleLinear().domain([1, 5]).range(["#fdd0a2", "#e6550d"]),
  Europe: d3.scaleLinear().domain([1, 5]).range(["#e5f5e0", "#31a354"]),
  Asia: d3.scaleLinear().domain([1, 5]).range(["#dadaeb", "#54278f"]),
  "North America": d3.scaleLinear().domain([1, 5]).range(["#fee0d2", "#de2d26"]),
  "South America": d3.scaleLinear().domain([1, 5]).range(["#fde0ef", "#c51b8a"]),
};

// Dimensions for the top stacked chart
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

// Function to parse a country field value from the CSV (format: "{'CountryName': value}")
function parseCountryField(field) {
  const parts = field.replace(/[{}']/g, "").split(":");
  return {
    name: parts[0].trim(),
    value: +parts[1].trim(),
  };
}

// Draw the initial stacked chart of top countries per continent
function drawInitialStackedChart(parsedData) {
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

  svgStackedMain.append("g").attr("class", "y-axis").call(d3.axisLeft(yScale));

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
          .on("mouseover", function(event) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
              .html(`Country: ${country.name}<br/>Value: ${country.value}`)
              .style("left", event.pageX + "px")
              .style("top", event.pageY - 28 + "px");
          })
          .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
          });

        yOffset += country.value;
      });
    });
}

// Draw individual continent charts for each country key
function drawIndividualCharts(processedData) {
  const smallChartWidth = 500;
  const smallChartHeight = 300;
  const smallChartMargin = { top: 20, right: 20, bottom: 20, left: 70 };
  const chartContainer = d3.select("#chart-container");

  // Determine a common domain for x-scale based on max value in processedData
  const maxVal = d3.max(processedData, d =>
    d3.max(["country_1", "country_2", "country_3", "country_4", "country_5", "other"], key => d[key].value)
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

  // Draw a single chart for a given country key
  function drawChart(containerId, dataKey, title) {
    // Create a container for the chart
    const container = chartContainer
      .append("div")
      .attr("class", "chart")
      .style("width", `${smallChartWidth}px`);

    // Add title
    container.append("div").attr("class", "chart-title").text(title);

    // Create the SVG container
    const svg = container
      .append("svg")
      .attr("width", smallChartWidth)
      .attr("height", smallChartHeight);

    // Create the chart group
    const chart = svg
      .append("g")
      .attr("transform", `translate(${smallChartMargin.left}, ${smallChartMargin.top})`);

    // Draw the bars with tooltip showing country name and value
    chart
      .selectAll(".bar")
      .data(processedData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", d => yScale(d.continent))
      .attr("height", yScale.bandwidth())
      .attr("width", d => xScale(d[dataKey].value) * 0.5)
      .attr("fill", d => colorScales[d.continent](5))
      .on("mouseover", function(event, d) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(`Country: ${d[dataKey].name}<br/>Value: ${d[dataKey].value}`)
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function() {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    // Add x-axis
    chart
      .append("g")
      .attr("transform", `translate(0, ${smallChartHeight - smallChartMargin.top - smallChartMargin.bottom})`)
      .call(d3.axisBottom(xScale));

    // Add y-axis
    chart.append("g").call(d3.axisLeft(yScale));

  }

  // Generate a chart for each country key
  ["country_1", "country_2", "country_3", "country_4", "country_5", "other"].forEach(countryKey => {
    drawChart("#chart-container", countryKey, countryKey);
  });
}

// Draw the normalized stacked chart
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

  // Define x and y scales
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

  // Draw stacked bars with tooltip
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
      .on("mouseover", function(event, seg) {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(`Country: ${seg.country}<br/>Percentage: ${seg.percentage.toFixed(2)}%`)
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function() {
        tooltip.transition().duration(500).style("opacity", 0);
      });
  });

  // Add x-axis
  chartStacked
    .append("g")
    .attr("transform", `translate(0, ${nStackedHeight - nStackedMargin.top - nStackedMargin.bottom})`)
    .call(
      d3
        .axisBottom(xStackedScale)
        .ticks(10)
        .tickFormat(d => d + "%")
    );

  // Add y-axis
  chartStacked.append("g").call(d3.axisLeft(yStackedScale));
}

// Load data and render charts
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
        parseCountryField(d.other.replace(",", ":")), // 'other' field seems to be "otherCountryName,value"
      ].sort((a, b) => b.value - a.value),
    };
  });

  // Draw the initial stacked chart of top countries
  drawInitialStackedChart(parsedData);

  // Prepare processedData with country names and values for each field
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

  // Draw the individual charts
  drawIndividualCharts(processedData);

  // Draw the normalized stacked chart
  drawStackedChart(processedData);
});
