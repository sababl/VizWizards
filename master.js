var app = angular.module("myApp", []);

var namecontroller = "saba";

app.controller(namecontroller, function ($scope, $controller) {
  $scope.pageNum = null;
  $scope.tstfunc = function (item) {
    $scope.pageNum = item;

    if (parseInt(item) > 4) {
      $controller("melika", { $scope: $scope });
      $scope.isMelikaActive = true;
    } else {
      $scope.isMelikaActive = false;
    }
  };
  // codaye saba inja bashe
  $scope.name = "saba";
  const colorScales = {
    Oceania: d3.scaleLinear().domain([1, 5]).range(["#c6e5f5", "#08306b"]),
    Africa: d3.scaleLinear().domain([1, 5]).range(["#fdd0a2", "#e6550d"]),
    Europe: d3.scaleLinear().domain([1, 5]).range(["#e5f5e0", "#31a354"]),
    Asia: d3.scaleLinear().domain([1, 5]).range(["#dadaeb", "#54278f"]),
    "North America": d3
      .scaleLinear()
      .domain([1, 5])
      .range(["#fee0d2", "#de2d26"]),
    "South America": d3
      .scaleLinear()
      .domain([1, 5])
      .range(["#fde0ef", "#c51b8a"]),
  };

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
        .domain([
          0,
          d3.max(data, (d) => d["Annual CO₂ emissions (per capita)"]),
        ])
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
        .attr("fill", "blue")
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
        .attr("y", height + margin.bottom - 90)
        .text("Countries");
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
  d3.csv("data_processing/output/continent_summary_1996.csv").then((data) => {
    // Parse the CSV data to the required structure
    const parsedData = data.map((d) => {
      return {
        continent: d.Continent,
        countries: [
          {
            name: d.country_1.split(":")[0].replace(/[{}']/g, "").trim(),
            value: +d.country_1.split(":")[1].replace(/[{}']/g, "").trim(),
          },
          {
            name: d.country_2.split(":")[0].replace(/[{}']/g, "").trim(),
            value: +d.country_2.split(":")[1].replace(/[{}']/g, "").trim(),
          },
          {
            name: d.country_3.split(":")[0].replace(/[{}']/g, "").trim(),
            value: +d.country_3.split(":")[1].replace(/[{}']/g, "").trim(),
          },
          {
            name: d.country_4.split(":")[0].replace(/[{}']/g, "").trim(),
            value: +d.country_4.split(":")[1].replace(/[{}']/g, "").trim(),
          },
          {
            name: d.country_5.split(":")[0].replace(/[{}']/g, "").trim(),
            value: +d.country_5.split(":")[1].replace(/[{}']/g, "").trim(),
          },
          {
            name: d.other.split(",")[0].replace(/[{}']/g, "").trim(),
            value: +d.other.split(",")[1].replace(/[{}']/g, "").trim(),
          },
        ].sort((a, b) => b.value - a.value),
      };
    });

    // Set up x and y scales
    const x = d3
      .scaleBand()
      .domain(parsedData.map((d) => d.continent))
      .range([0, width])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(parsedData, (d) => d3.sum(d.countries, (c) => c.value)),
      ])
      .nice()
      .range([height, 0]);

    // Append axes
    svg_stacked_chart
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    svg_stacked_chart.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

    // Append bars for each continent
    svg_stacked_chart
      .selectAll(".bar")
      .data(parsedData)
      .enter()
      .append("g")
      .attr("class", "bar")
      .attr("transform", (d) => `translate(${x(d.continent)}, 0)`)
      .each(function (d, i) {
        const continentGroup = d3.select(this);
        let yOffset = 0;
        const colorScale =
          colorScales[d.continent] ||
          d3
            .scaleLinear()
            .domain([1, d.countries.length])
            .range(["#d3d3d3", "#696969"]);
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
                  "Country: " + country.name + "<br/>Value: " + country.value
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

  d3.csv("data_processing/output/continent_summary_1996.csv").then(function (
    data
  ) {
    // Process data for each country field
    const countries = [
      "country_1",
      "country_2",
      "country_3",
      "country_4",
      "country_5",
      "other",
    ];
    const processedData = data.map((d) => {
      const continentData = { continent: d.Continent };
      countries.forEach((country) => {
        // Extract the value for each country, assuming the format {'CountryName': value}
        continentData[country] = parseFloat(d[country].match(/\d+\.\d+/)[0]);
      });
      return continentData;
    });

    // Set up the chart dimensions
    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 20, left: 70 };

    // Create scales
    const xScale = d3
      .scaleLinear()
      .domain([0, 150])
      .range([0, width - margin.left - margin.right]);

    const yScale = d3
      .scaleBand()
      .domain(processedData.map((d) => d.continent))
      .range([0, height - margin.top - margin.bottom])
      .padding(0.1);

    // Function to draw a chart
    function drawChart(containerId, dataKey, title) {
      // Create a container for the chart
      const container = d3
        .select("#chart-container")
        .append("div")
        .attr("class", "chart")
        .style("width", `${width}px`);

      // Add title
      container.append("div").attr("class", "chart-title").text(title);

      // Create the SVG container
      const svg_continent = container
        .append("svg")
        .attr("width", width)
        .attr("height", height);

      // Create the chart group
      const chart = svg_continent
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      // Draw the bars
      chart
        .selectAll(".bar")
        .data(processedData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", (d) => yScale(d.continent))
        .attr("height", yScale.bandwidth())
        .attr("width", (d) => xScale(d[dataKey]) * 0.5)
        .attr("fill", (d) => colorScales[d.continent](5));

      // Add x-axis
      chart
        .append("g")
        .attr(
          "transform",
          `translate(0, ${height - margin.top - margin.bottom})`
        )
        .call(d3.axisBottom(xScale));

      // Add y-axis
      chart.append("g").call(d3.axisLeft(yScale));
    }

    // Generate a chart for each country
    countries.forEach((country) => {
      drawChart("#chart-container", country, country);
    });

    drawStackedChart(processedData);

    // Function to draw the stacked bar chart
    function drawStackedChart(data) {
      const stackedWidth = 600;
      const stackedHeight = 400;
      const stackedMargin = { top: 20, right: 20, bottom: 40, left: 100 };

      // Calculate the total for each continent
      data.forEach((d) => {
        d.total = countries.reduce((sum, country) => sum + d[country], 0);
      });

      // Normalize data for stacked chart
      const normalizedData = processedData.map((d) => {
        const total = countries.reduce((sum, country) => sum + d[country], 0);
        let x0 = 0;
        return {
          continent: d.continent,
          categories: countries.map((country, index) => {
            const value = (d[country] / total) * 100; // Convert to percentage
            const obj = {
              country,
              x0,
              x1: x0 + value,
              color: colorScales[d.continent](index + 1), // Apply color scale based on index
            };
            x0 += value;
            return obj;
          }),
        };
      });

      // Define x and y scales
      const xStackedScale = d3
        .scaleLinear()
        .domain([0, 100])
        .range([0, stackedWidth - stackedMargin.left - stackedMargin.right]);
      const yStackedScale = d3
        .scaleBand()
        .domain(data.map((d) => d.continent))
        .range([0, stackedHeight - stackedMargin.top - stackedMargin.bottom])
        .padding(0.1);

      // Create the SVG container for the stacked chart
      const svgStacked = d3
        .select("#stacked-chart")
        .append("svg")
        .attr("width", stackedWidth)
        .attr("height", stackedHeight);

      // Create the chart group
      const chartStacked = svgStacked
        .append("g")
        .attr(
          "transform",
          `translate(${stackedMargin.left}, ${stackedMargin.top})`
        );

      // Draw stacked bars
      normalizedData.forEach((d) => {
        chartStacked
          .selectAll(`.bar-${d.continent}`)
          .data(d.categories)
          .enter()
          .append("rect")
          .attr("class", `bar-${d.continent}`)
          .attr("y", () => yStackedScale(d.continent))
          .attr("height", yStackedScale.bandwidth())
          .attr("x", (d) => xStackedScale(d.x0))
          .attr("width", (d) => xStackedScale(d.x1) - xStackedScale(d.x0))
          .attr("fill", (d) => d.color); // Use custom color for each section
      });

      // Add x-axis
      chartStacked
        .append("g")
        .attr(
          "transform",
          `translate(0, ${
            stackedHeight - stackedMargin.top - stackedMargin.bottom
          })`
        )
        .call(
          d3
            .axisBottom(xStackedScale)
            .ticks(10)
            .tickFormat((d) => d + "%")
        );

      // Add y-axis
      chartStacked.append("g").call(d3.axisLeft(yStackedScale));
    }
  });

  const margin2 = { top: 20, right: 30, bottom: 60, left: 60 };
  const svgWidth = 1280 - margin2.left - margin2.right;
  const svgHeight = 800 - margin2.top - margin2.bottom;

  const svg = d3
    .select("#chart_decade")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin2.left},${margin2.top})`);

  d3.csv("data_processing/output/average_emissions_2001_2010.csv").then(
    (averageData) => {
      averageData = averageData.slice(0, 20);
      averageData.forEach((d) => {
        d["Average CO₂ emissions (2001-2010)"] =
          +d["Average CO₂ emissions (2001-2010)"];
      });

      // Set x and y scales
      const x = d3
        .scaleBand()
        .domain(averageData.map((d) => d.Entity))
        .range([0, svgWidth])
        .padding(0.1);

      const y = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(averageData, (d) => d["Average CO₂ emissions (2001-2010)"]),
        ])
        .nice()
        .range([svgHeight, 0]);
        

      svg
        .append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(0,${svgHeight})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end"); // Align text to the end

      svg.append("g").attr("class", "axis axis--y").call(d3.axisLeft(y));

      // Create bars
      svg
        .selectAll(".bar")
        .data(averageData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.Entity))
        .attr("y", (d) => y(d["Average CO₂ emissions (2001-2010)"]))
        .attr("width", x.bandwidth())
        .attr(
          "height",
          (d) => svgHeight - y(d["Average CO₂ emissions (2001-2010)"])
        )
        .attr("fill", "blue");

        svg
        .append("text")
        .attr("text-anchor", "end")
        .attr("x", -margin.left + 40)
        .attr("y", -50)
        .attr("dy", "1em")
        .attr("transform", "rotate(-90)")
        .text("Average CO₂ Emissions (2001-2010)");

      svg
        .append("text")
        .attr("text-anchor", "end")
        .attr("x", width / 2 + margin.left)
        .attr("y", height + margin.bottom +20)
        .text("Countries"); 
    }
  );
  
});
