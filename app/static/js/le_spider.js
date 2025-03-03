angular.module('myApp').factory('SpiderChartService', ['$http', '$mdToast', function ($http, $mdToast) {
  // 1) Local helper function for building the chart
  function createSpiderChart(data, locations, sex, year, elementId) {
    // Clear any existing chart
    d3.select(elementId).selectAll('*').remove();

    // Custom color palette for up to 10 countries
    const customColors = [
      "#143642", "#741C28", "#E39A47FF", "#9BE243FF", "#533B04FF",
      "#E92949FF", "#506D84", "#D76578FF", "#C5B4A5", "#4872E6FF"
    ];

    // Helper function to wrap text
    function wrap(text, width) {
      text.each(function () {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse();
        let word;
        let line = [];
        let lineNumber = 0;
        const lineHeight = 1.1;
        const y = text.attr("y");
        const dy = parseFloat(text.attr("dy"));
        let tspan = text.text(null).append("tspan")
          .attr("x", text.attr("x"))
          .attr("y", y)
          .attr("dy", dy + "em");

        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan")
              .attr("x", text.attr("x"))
              .attr("y", y)
              .attr("dy", ++lineNumber * lineHeight + dy + "em")
              .text(word);
          }
        }
      });
    }

    // Indicators in the order they'll be displayed
    const indicators = [
      "Life expectancy at age 60 (years)",
      "Life expectancy at birth (years)",
      "Healthy life expectancy (HALE) at birth (years)",
      "Healthy life expectancy (HALE) at age 60 (years)"
    ];

    // Process data for multiple locations
    const chartDatasets = locations.sort((a, b) => a.localeCompare(b)).map((location, index) => {
      const locationData = indicators.map(indicator => {
        let value = null;

        ['le', 'hle'].forEach(type => {
          const matchingEntry = data[location][type][year].find(
            entry => entry.Indicator === indicator && entry.Sex.toLowerCase() === sex.toLowerCase().trim()
          );
          if (matchingEntry) {
            value = matchingEntry.FactValueNumeric;
          }
        });

        return {
          axis: indicator,
          value: value || 0
        };
      });

      return {
        location,
        data: locationData
      };
    });

    // Get the container width for responsive sizing
    const container = d3.select(elementId).node();
    const containerWidth = container ? container.getBoundingClientRect().width : 500;

    // Chart dimensions - make it responsive
    const width = Math.min(containerWidth, 700);
    const height = width;

    const margin = { top: 60, right: 60, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const radius = Math.min(innerWidth, innerHeight) / 2;

    // Create SVG
    const svg = d3.select(elementId)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .append('g')
      .attr("transform", `translate(${margin.left + innerWidth / 2},${margin.top + innerHeight / 2})`);

    // Find max value for scaling
    const maxValue = d3.max(
      chartDatasets.flatMap(dataset => dataset.data),
      d => d.value
    );

    // Radial scale
    const radialScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, radius]);

    // Color scale using custom colors
    const colorScale = d3.scaleOrdinal()
      .domain(d3.range(10))
      .range(customColors);

    // Angle slice
    const angleSlice = Math.PI * 2 / indicators.length;

    // Line generator
    const line = d3.lineRadial()
      .radius(d => radialScale(d.value))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    // Background circles with values
    const axisGrid = svg.append('g').attr('class', 'axisWrapper');
    const levels = 5;

    axisGrid.selectAll('.levels')
      .data(d3.range(1, levels + 1).reverse())
      .enter()
      .append('circle')
      .attr('r', d => radius / levels * d)
      .style('fill', '#CDCDCD')
      .style('stroke', '#CDCDCD')
      .style('fill-opacity', 0.1)
      .style('stroke-opacity', 0.4);

    // Add axis value labels
    axisGrid.selectAll('.axis-value')
      .data(d3.range(1, levels + 1))
      .enter()
      .append('text')
      .attr('class', 'axis-value')
      .attr('x', 5)
      .attr('y', d => -radius / levels * d)
      .text(d => Math.round(maxValue / levels * d))
      .style('font-size', `${Math.max(8, width / 50)}px`)
      .style('fill', '#737373');

    // Axis lines
    const axis = svg.selectAll('.axis')
      .data(indicators)
      .enter()
      .append('g')
      .attr('class', 'axis');

    axis.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (d, i) => radialScale(maxValue) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (d, i) => radialScale(maxValue) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr('class', 'line')
      .style('stroke', 'grey')
      .style('stroke-width', '1px');

    axis.append('text')
      .attr('class', 'legend')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('x', (d, i) => radialScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (d, i) => radialScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
      .text(d => d)
      .style('font-size', `${Math.max(8, width / 70)}px`)
      .call(wrap, radius / 2);

    // Add tooltip div if it doesn't exist
    let tooltip = d3.select("body").select(".spider-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body").append("div")
        .attr("class", "tooltip spider-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("border", "1px solid #ddd")
        .style("border-radius", "4px")
        .style("padding", "8px")
        .style("font-size", "12px")
        .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
        .style("pointer-events", "none");
    }

    // Legend with responsive positioning
    const legendX = radius + 40;
    const legendY = -(radius * 0.8);
    
    const legend = svg.append("g")
    .attr("transform", `translate(${-innerWidth / 2 + 20}, ${-innerHeight / 2 + 20})`);
  

    // Plot data for each location
    chartDatasets.forEach((dataset, index) => {
      // Plot area
      svg.append('path')
        .datum(dataset.data)
        .attr('d', line)
        .style('fill', colorScale(index))
        .style('fill-opacity', 0)
        .style('stroke', colorScale(index))
        .style('stroke-width', 2);

      // Plot individual data points with tooltips
      svg.selectAll(`.dataPoints-${index}`)
        .data(dataset.data)
        .enter()
        .append('circle')
        .attr('r', width / 100)
        .attr('cx', (d, i) => radialScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr('cy', (d, i) => radialScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style('fill', colorScale(index))
        .style('stroke', 'white')
        .style('stroke-width', 2)
        .on('mouseover', function (event, d) {
          const circle = d3.select(this);
          // Enlarge the circle
          circle.transition()
            .duration(200)
            .attr('r', width / 80);

          // Show tooltip
          tooltip
            .html(`\n              <strong>${dataset.location}</strong><br/>\n              <strong>${d.axis}</strong><br/>\n              Value: ${d.value.toFixed(2)}\n            `)
            .style("visibility", "visible")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on('mousemove', function (event) {
          tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on('mouseout', function () {
          const circle = d3.select(this);
          // Restore circle size
          circle.transition()
            .duration(200)
            .attr('r', width / 100);

          // Hide tooltip
          tooltip.style("visibility", "hidden");
        });

      // Add legend items - make it responsive
      const legendFontSize = Math.max(10, width / 40);
      legend.append('rect')
        .attr('x', 0)
        .attr('y', index * (legendFontSize + 5))
        .attr('width', legendFontSize)
        .attr('height', legendFontSize)
        .style('fill', colorScale(index));

      legend.append('text')
        .attr('x', legendFontSize * 1.5)
        .attr('y', index * (legendFontSize + 5) + legendFontSize / 2)
        .text(dataset.location)
        .style('font-size', `${legendFontSize}px`)
        .attr('alignment-baseline', 'middle');
    });

    // svg.append("text")
    // .attr("x", 0)
    // .attr("y", -radius - 20)
    // .attr("text-anchor", "middle")
    // .style("font-size", "16px")
    // .text(`Life Expectancy Comparison - ${sex} (${year})`);
 
  }

  // 2) Return the publicly accessible methods
  return {
    // Called from chart_config.js
    createRadarChart: function (countries, sex, year) {
      // Return a promise so chart_config.js can handle success/failure
      return new Promise((resolve, reject) => {
        if (!countries || countries.length === 0) {
          reject(new Error('No countries selected'));
          return;
        }

        const requests = countries.map((country) =>
          $http.get('/life', {
            params: {
              years: year,
              metric: 'both',
              sex: sex,
              age: 'both',
              country: country
            }
          })
        );

        Promise.all(requests)
          .then((responses) => {
            const data = {};
            responses.forEach((response, index) => {
              data[countries[index]] = response.data;
            });
            createSpiderChart(data, countries, sex, year, '#radar-chart');
            resolve();
          })
          .catch((error) => {
            console.error('Error:', error);
            reject(error);
          });
      });
    },

    // Optionally expose a helper to set default data
    setDefaults: function ($scope) {
      if (!$scope.spiderFormData) {
        $scope.spiderFormData = {};
      }

      $scope.spiderFormData.sex = $scope.spiderFormData.sex || 'Male';
      $scope.spiderFormData.year = $scope.spiderFormData.year || '2021';

      if (
        $scope.countries &&
        $scope.countries.length > 0 &&
        (!$scope.spiderFormData.selectedCountries ||
          $scope.spiderFormData.selectedCountries.length === 0)
      ) {
        $scope.spiderFormData.selectedCountries = [
          'Somalia',
          'Central African Republic',
          'Eswatini'
        ];
      }
    }
  };
}]);
