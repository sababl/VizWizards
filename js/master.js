var app = angular.module("myApp", []);
app.controller("saba", function ($scope) {
  // codaye saba inja bashe
  $scope.name = "saba";

  const margin = { top: 60, right: 50, bottom: 150, left: 100 };
  const width = 1280 - margin.left - margin.right;
  const height = 800 - margin.top - margin.bottom;

  //
  // Create the SVG container
  const svg_one_year = d3
    .select("#chart-one-year")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("pointer-events", "none");

  // Load the CSV data
  d3.csv("data_processing/output/sorted_emissions_one_year.csv").then(
    (data) => {
      // Parse the data to convert numeric fields
      data = data.slice(0, 20);
      data.forEach((d) => {
        d["Annual CO₂ emissions (per capita)"] =
          +d["Annual CO₂ emissions (per capita)"];
      });

      const x = d3
        .scaleBand()
        .domain(data.map((d) => d.Entity))
        .range([0, width])
        .padding(0.2);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d["Annual CO₂ emissions (per capita)"])])
        .nice()
        .range([height, 0]);

      svg_one_year
        .append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end");

      svg_one_year.append("g").call(d3.axisLeft(y));

      svg_one_year
        .selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.Entity))
        .attr("y", (d) => y(d["Annual CO₂ emissions (per capita)"]))
        .attr("width", x.bandwidth())
        .attr(
          "height",
          (d) => height - y(d["Annual CO₂ emissions (per capita)"])
        )
        .attr("fill", "steelblue")
        .on("mouseover", function (event, d) {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip
            .html(
              "Country: " +
                d.Entity +
                "<br/>Value: " +
                d["Annual CO₂ emissions (per capita)"]
            )
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", function (event, d) {
          tooltip.transition().duration(500).style("opacity", 0);
        });

      svg_one_year
        .append("text")
        .attr("text-anchor", "end")
        .attr("x", -margin.left + 40)
        .attr("y", -50)
        .attr("dy", "1em")
        .attr("transform", "rotate(-90)")
        .text("Annual CO₂ emissions (per capita)");

      svg_one_year
        .append("text")
        .attr("text-anchor", "end")
        .attr("x", width / 2 + margin.left)
        .attr("y", height + margin.bottom - 10)
        .text("Country");
    }
  );

// Create an SVG container
const svg_stacked_chart = d3
  .select("#chart-stacked")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load the CSV data
d3.csv("data_processing/output/continent_summary_1996.csv").then(data => {
  // Parse the CSV data to the required structure
  const parsedData = data.map(d => {
    return {
      continent: d.Continent,
      countries: [
        { name: d.country_1.split(':')[0].replace(/[{}']/g, '').trim(), value: +d.country_1.split(':')[1].replace(/[{}']/g, '').trim() },
        { name: d.country_2.split(':')[0].replace(/[{}']/g, '').trim(), value: +d.country_2.split(':')[1].replace(/[{}']/g, '').trim() },
        { name: d.country_3.split(':')[0].replace(/[{}']/g, '').trim(), value: +d.country_3.split(':')[1].replace(/[{}']/g, '').trim() },
        { name: d.country_4.split(':')[0].replace(/[{}']/g, '').trim(), value: +d.country_4.split(':')[1].replace(/[{}']/g, '').trim() },
        { name: d.country_5.split(':')[0].replace(/[{}']/g, '').trim(), value: +d.country_5.split(':')[1].replace(/[{}']/g, '').trim() }
      ].sort((a, b) => b.value - a.value)
    };
  });

  // Set color scales for continents
  const colorScales = {
    Oceania: d3.scaleLinear().domain([1, 5]).range(["#c6e5f5", "#08306b"]),
    Africa: d3.scaleLinear().domain([1, 5]).range(["#fdd0a2", "#e6550d"]),
    Europe: d3.scaleLinear().domain([1, 5]).range(["#e5f5e0", "#31a354"]),
    Asia: d3.scaleLinear().domain([1, 5]).range(["#dadaeb", "#54278f"]),
    "North America": d3.scaleLinear().domain([1, 5]).range(["#fee0d2", "#de2d26"]),
    "South America": d3.scaleLinear().domain([1, 5]).range(["#fde0ef", "#c51b8a"])
  };

  // Set up x and y scales
  const x = d3
    .scaleBand()
    .domain(parsedData.map(d => d.continent))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear().domain([0, d3.max(parsedData, d => d3.sum(d.countries, c => c.value))]).nice().range([height, 0]);

  // Append axes
  svg_stacked_chart
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg_stacked_chart
    .append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

  // Append bars for each continent
  svg_stacked_chart
    .selectAll(".bar")
    .data(parsedData)
    .enter()
    .append("g")
    .attr("class", "bar")
    .attr("transform", d => `translate(${x(d.continent)}, 0)`)
    .each(function (d, i) {
      const continentGroup = d3.select(this);
      let yOffset = 0;
      const colorScale = colorScales[d.continent] || d3.scaleLinear().domain([1, d.countries.length]).range(["#d3d3d3", "#696969"]);
      d.countries.forEach((country, index) => {
        continentGroup
          .append("rect")
          .attr("x", 0)
          .attr("y", y(yOffset + country.value))
          .attr("width", x.bandwidth())
          .attr("height", height - y(country.value))
          .attr("fill", colorScale(index + 1))
          .on("mouseover", function (event) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip
              .html(
                "Continent: " + d.continent + "<br/>Country: " + country.name + "<br/>Value: " + country.value
              )
              .style("left", event.pageX + "px")
              .style("top", event.pageY - 28 + "px");
          })
          .on("mouseout", function () {
            tooltip.transition().duration(500).style("opacity", 0);
          });
        yOffset += country.value;
      });
    });
});

});

app.controller("melika", function ($scope) {
  // codaye melika inja bashe
  $scope.name = "melika";
});

app.controller("romena", function ($scope) {
  // codaye romena inja bashe
  $scope.name = "romena";
});