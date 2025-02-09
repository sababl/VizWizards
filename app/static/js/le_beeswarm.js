var app = angular.module('myApp', ['ngMaterial']);

const PARENT_LOCATION_COLORS = {
  "Africa": "#143642",
  "Eastern Mediterranean": "#741C28",
  "Western Pacific": "#877765",
  "Americas": "#E7DECD",
  "South-East Asia": "#A1A8BE",
  "Europe": "#BB8C94"
};

app.controller('FormController', ['$scope', '$http', '$mdToast', function ($scope, $http, $mdToast) {

  $scope.years = Array.from({ length: 22 }, (_, i) => i + 2000);
  $scope.formData = {
    year: 2015 // default year
  };
  $scope.generateBeeswarmChart = function () {
    // Clear existing chart
    d3.select("#chart-beeswarm").selectAll("*").remove();

    // Call chart generation with selected year
    generateBeeswarmChart(
      '/static/data/le.csv',
      '/static/data/population.csv',
      $scope.formData.year
    );
  };
  function generateBeeswarmChart(lifeExpCsvPath, populationCsvPath, year) {
    // Load both CSV files concurrently.
    Promise.all([
      d3.csv(lifeExpCsvPath),
      d3.csv(populationCsvPath)
    ]).then(function (files) {
      let lifeExpData = files[0];
      let popData = files[1];

      // ===================================================
      // 1. Process Life Expectancy Data (Filtering by Indicator)
      // ===================================================
      // Keep only rows for the selected year and with the desired Indicator.
      lifeExpData = lifeExpData.filter(d =>
        +d["Period"] === year &&
        d.Indicator.trim() === "Life expectancy at birth (years)"
      );
      console.log(lifeExpData);
      let pivotData = {};
      lifeExpData.forEach(d => {
        const location = d.Location;
        if (!pivotData[location]) {
          pivotData[location] = {
            Location: location,
            ParentLocation: d.ParentLocation,
            male: null,
            female: null
          };
        }
        const sex = d["Dim1"].trim().toLowerCase();
        if (sex === "male") {
          pivotData[location].male = +d.FactValueNumeric;
        } else if (sex === "female") {
          pivotData[location].female = +d.FactValueNumeric;
        }
      });

      // Convert pivot data to an array and filter out any countries missing a male or female value.
      let finalData = Object.values(pivotData).filter(d => d.male !== null && d.female !== null);

      // ===================================================
      // 2. Process Population Data and Merge
      // ===================================================
      // The population CSV is in a wide format with year columns.
      let popLookup = {};
      popData.forEach(d => {
        // Use the selected year (as a string) to retrieve the population.
        const popVal = +d[String(year)];
        if (!isNaN(popVal)) {
          // We assume the life expectancy "Location" matches the population CSV's "Country Name"
          popLookup[d["Country Name"]] = popVal;
        }
      });

      // Merge population data into the life expectancy records.
      finalData.forEach(d => {
        d.population = popLookup[d.Location] || 0;
      });

      // Optionally filter out countries with no population data.
      finalData = finalData.filter(d => d.population > 0);

      // ===================================================
      // 3. Create the Beeswarm Chart
      // ===================================================
      // Get the container width dynamically
      function getChartDimensions() {
        const container = document.getElementById("chart-beeswarm");
        const width = container ? container.clientWidth : 800; // Default width if undefined
        const height = window.innerHeight * 0.6; // Use 60% of the viewport height dynamically

        return { width, height };
      }

      // Define margins
      const margin = { top: 50, right: 50, bottom: 50, left: 50 };

      // Get dynamic width and height
      let { width, height } = getChartDimensions();
      width -= margin.left + margin.right;
      height -= margin.top + margin.bottom;

      // Define legend position dynamically
      // const legendX = width * 0.85; // Adjust dynamically instead of using a fixed value
      // const legendY = 20;

      // Function to resize chart on window resize
      window.addEventListener("resize", () => {
        let { width, height } = getChartDimensions();
        width -= margin.left + margin.right;
        height -= margin.top + margin.bottom;

        d3.select("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom);
      });

      // Append the SVG container.
      const svg = d3.select("#chart-beeswarm")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // Create scales:
      // xScale: maps female life expectancy.
      const xExtent = d3.extent(finalData, d => d.female);
      const xScale = d3.scaleLinear()
        .domain([xExtent[0] - 1, xExtent[1] + 1])
        .range([0, width]);

      // yScale: maps male life expectancy.
      const yExtent = d3.extent(finalData, d => d.male);
      const yScale = d3.scaleLinear()
        .domain([yExtent[0] - 1, yExtent[1] + 1])
        .range([height, 0]);

      // radiusScale: maps population to circle radius (using a square-root scale so area is roughly proportional).
      const popExtent = d3.extent(finalData, d => d.population);
      const radiusScale = d3.scaleSqrt()
        .domain(popExtent)
        .range([3, 20]);

      // colorScale: assigns colors based on ParentLocation.
      const parentLocations = Array.from(new Set(finalData.map(d => d.ParentLocation)));
      const colorScale = d3.scaleOrdinal()
        .domain(parentLocations)
        .range(parentLocations.map(loc => PARENT_LOCATION_COLORS[loc] || '#cccccc'));

      // Set initial positions for each data point.
      finalData.forEach(d => {
        d.x = xScale(d.female);
        d.y = yScale(d.male);
      });

      // Create a force simulation to prevent overlapping circles.
      const simulation = d3.forceSimulation(finalData)
        .force("x", d3.forceX(d => xScale(d.female)).strength(2)) // Increase strength
        .force("y", d3.forceY(d => yScale(d.male)).strength(2)) // Increase strength
        .force("collide", d3.forceCollide(d => radiusScale(d.population) + 2).iterations(6)) // Increase iterations
        .stop();

      // Run the simulation for a fixed number of ticks.
      for (let i = 0; i < 300; ++i) simulation.tick();

      // ===================================================
      // 4. Add Grid Lines
      // ===================================================
      // Create x-axis grid lines.
      const xAxisGrid = d3.axisBottom(xScale)
        .ticks(10)
        .tickSize(-height)
        .tickFormat("");
      svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)
        .call(xAxisGrid)
        .selectAll("line")
        .style("stroke", "#ccc")
        .style("stroke-dasharray", "2,2");


      // Create y-axis grid lines.
      const yAxisGrid = d3.axisLeft(yScale)
        .ticks(10)
        .tickSize(-width)
        .tickFormat("");

      svg.append("g")
        .attr("class", "grid")
        .call(yAxisGrid)
        .selectAll("line")
        .style("stroke", "#ccc")
        .style("stroke-dasharray", "2,2");

      // ===================================================
      // 5. Draw Axes
      // ===================================================
      const xAxis = d3.axisBottom(xScale).ticks(10).tickSize(-height);
      const yAxis = d3.axisLeft(yScale).ticks(10).tickSize(-width);

      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("font-size", "14px");

      svg.append("g")
        .call(yAxis)
        .selectAll("text")
        .style("font-size", "14px");
      // Add axis labels.
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Life Expectancy (Women)");
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .text("Life Expectancy (Men)");

      // ===================================================
      // 6. Draw Circles for the Data Points
      // ===================================================
      svg.selectAll("circle")
        .data(finalData)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => radiusScale(d.population))
        .attr("fill", d => colorScale(d.ParentLocation))
        .attr("stroke", "#333")
        .attr("stroke-width", 1);
      // Create tooltip div
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(255, 255, 255, 0.9)")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("box-shadow", "2px 2px 5px rgba(0,0,0,0.3)")
        .style("pointer-events", "none")
        .style("display", "none");

      svg.selectAll("circle")
        .on("mouseover", function (event, d) {
          tooltip.style("display", "block")
            .html(`
      <strong>${d.Location}</strong><br>
      Population: ${d.population.toLocaleString()}<br>
      Male LE: ${d.male}<br>
      Female LE: ${d.female}
    `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => tooltip.style("display", "none"));

      // ===================================================
      // 7. Add Country Labels for High Population (> 100 Million)
      // ===================================================
      svg.selectAll(".country-label")
        .data(finalData.filter(d => d.population > 100000000))
        .enter()
        .append("text")
        .attr("class", "country-label")
        .attr("x", d => d.x + radiusScale(d.population) + 4)
        .attr("y", d => d.y + 3)
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#000")
        .style("stroke", "#fff")
        .style("stroke-width", "0.5px")
        .text(d => d.Location);


      // Add legend for color of ParentLocation
      const legendGroup = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width / 2 - 300}, -50)`);
      
        let categories = Object.keys(PARENT_LOCATION_COLORS);
        categories.forEach((cat, i) => {
          legendGroup.append("rect")
            .attr("x", i * 100)
            .attr("y", 0)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", PARENT_LOCATION_COLORS[cat]);
          legendGroup.append("text")
            .attr("x", i * 100 + 20)
            .attr("y", 12)
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(cat);
        });

        

    }).catch(function (error) {
      console.error("Error loading data:", error);
    });
  }

}]);