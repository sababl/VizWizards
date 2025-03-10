angular.module('myApp').factory('SpiderChartService', ['$http', '$mdToast', function ($http, $mdToast) {
  // 1) Local helper function for building the chart
  function createSpiderChart(data, locations, sex, year, elementId) {
    // Clear any existing chart
    d3.select(elementId).selectAll('*').remove();

    // Custom color palette for up to 10 countries - more distinct colors
    const customColors = [
      "var(--vis-blue)", "var(--vis-teal)", "var(--vis-orange)", "var(--vis-green)", "var(--vis-purple)", 
      "var(--vis-yellow)", "var(--primary-light)", "var(--secondary)", "var(--sage)", "var(--secondary-dark)"
  ];
    // Helper function to wrap text - improved for better positioning
    function wrap(text, width) {
      text.each(function () {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse();
        let word;
        let line = [];
        let lineNumber = 0;
        const lineHeight = 1.1;
        const y = text.attr("y");
        const x = text.attr("x");
        const dy = parseFloat(text.attr("dy"));
        let tspan = text.text(null).append("tspan")
          .attr("x", x)
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
              .attr("x", x)
              .attr("y", y)
              .attr("dy", ++lineNumber * lineHeight + dy + "em")
              .text(word);
          }
        }
      });
    }

    // Indicators - simplified for better display
    const indicators = [
      "Life exp. 60",
      "Life exp. birth",
      "Healthy exp. birth",
      "Healthy exp. 60"
    ];
    
    // Original indicator mapping for tooltips
    const fullIndicatorNames = {
      "Life exp. 60": "Life expectancy at age 60 (years)",
      "Life exp. birth": "Life expectancy at birth (years)",
      "Healthy exp. birth": "Healthy life expectancy (HALE) at birth (years)",
      "Healthy exp. 60": "Healthy life expectancy (HALE) at age 60 (years)"
    };

    // Process data for multiple locations
    const chartDatasets = locations.sort((a, b) => a.localeCompare(b)).map((location, index) => {
      const locationData = Object.keys(fullIndicatorNames).map(indicator => {
        let value = null;
        const fullName = fullIndicatorNames[indicator];

        ['le', 'hle'].forEach(type => {
          const matchingEntry = data[location][type][year].find(
            entry => entry.Indicator === fullName && entry.Sex.toLowerCase() === sex.toLowerCase().trim()
          );
          if (matchingEntry) {
            value = matchingEntry.FactValueNumeric;
          }
        });

        return {
          axis: indicator,
          fullName: fullName,
          value: value || 0
        };
      });

      return {
        location,
        data: locationData
      };
    });

    // Get the container dimensions
    const container = d3.select(elementId).node();
    const containerWidth = container ? container.getBoundingClientRect().width : 500;
    const containerHeight = container ? container.getBoundingClientRect().height : 400;

    // Chart dimensions - use available space effectively
    const width = containerWidth - 20; // Slight padding
    const height = containerHeight - 60; // Leave room for title
    
    // Calculate optimal center position and radius
    const center = { 
      x: width / 2, 
      y: height / 2 + 20 // Shift down to make room for title
    };
    
    // Adjust margins for better spacing
    const margin = { top: 50, right: 30, bottom: 30, left: 30 };
    const radius = Math.min(width, height) / 2.5 - Math.max(margin.top, margin.right, margin.bottom, margin.left);

    // Create SVG container
    const svg = d3.select(elementId)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .append('g')
      .attr("transform", `translate(${center.x},${center.y})`);

    // Title area
    svg.append("text")
      .attr("x", 0)
      .attr("y", -center.y + 25)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text(`Life Expectancy - ${sex} (${year})`);

    // Find max value for scaling
    const maxValue = d3.max(
      chartDatasets.flatMap(dataset => dataset.data),
      d => d.value
    );
    
    // Round max value up to nearest 5 for better scale
    const roundedMax = Math.ceil(maxValue / 5) * 5;

    // Radial scale with rounded max
    const radialScale = d3.scaleLinear()
      .domain([0, roundedMax])
      .range([0, radius]);

    // Color scale
    const colorScale = d3.scaleOrdinal()
      .domain(locations)
      .range(customColors);

    // Angle slice
    const angleSlice = Math.PI * 2 / indicators.length;

    // Line generator
    const line = d3.lineRadial()
      .radius(d => radialScale(d.value))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    // Create background circles
    const axisGrid = svg.append('g').attr('class', 'axisWrapper');
    // Fewer levels for cleaner look (3 instead of 5)
    const levels = 3;
    const levelStep = roundedMax / levels;

    // Draw the circular grid
    axisGrid.selectAll('.levels')
      .data(d3.range(1, levels + 1).reverse())
      .enter()
      .append('circle')
      .attr('r', d => radius * (d / levels))
      .style('fill', '#f8f8f8')
      .style('stroke', '#ddd')
      .style('stroke-width', 0.5)
      .style('fill-opacity', 0.5);

    // Add axis value labels
    axisGrid.selectAll('.axis-value')
      .data(d3.range(1, levels + 1))
      .enter()
      .append('text')
      .attr('class', 'axis-value')
      .attr('x', 5)
      .attr('y', d => -radialScale(levelStep * d))
      .attr('dy', '0.3em')
      .text(d => Math.round(levelStep * d))
      .style('font-size', '10px')
      .style('fill', '#888')
      .style('text-anchor', 'start');

    // Axis lines
    const axis = svg.selectAll('.axis')
      .data(indicators)
      .enter()
      .append('g')
      .attr('class', 'axis');

    // Draw axis lines
    axis.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (d, i) => radialScale(roundedMax * 1.05) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y2', (d, i) => radialScale(roundedMax * 1.05) * Math.sin(angleSlice * i - Math.PI / 2))
      .style('stroke', '#ddd')
      .style('stroke-width', '1px');

    // Calculate optimal position for axis labels
    function getAxisLabelPosition(i) {
      // Position labels based on their quadrant
      const angle = angleSlice * i - Math.PI / 2;
      const labelRadius = radialScale(roundedMax * 1.2);
      
      return {
        x: labelRadius * Math.cos(angle),
        y: labelRadius * Math.sin(angle),
        anchor: angle > Math.PI / 2 && angle < 3 * Math.PI / 2 ? 'end' : 
                (angle === Math.PI / 2 || angle === 3 * Math.PI / 2) ? 'middle' : 'start'
      };
    }

    // Add axis labels with optimal positioning
    axis.append('text')
      .attr('class', 'axis-label')
      .attr('x', (d, i) => getAxisLabelPosition(i).x)
      .attr('y', (d, i) => getAxisLabelPosition(i).y)
      .attr('text-anchor', (d, i) => getAxisLabelPosition(i).anchor)
      .attr('dy', '0.35em')
      .text(d => d)
      .style('font-size', '11px')
      .style('fill', '#444');

    // Set up tooltip
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
        .style("z-index", "1000")
        .style("pointer-events", "none");
    }

    // Create legend - separate from chart
    const legendContainer = d3.select(elementId)
      .append('div')
      .attr('class', 'spider-legend')
      .style('position', 'absolute')
      .style('top', '10px')
      .style('right', '10px')
      .style('background-color', 'rgba(255,255,255,0.9)')
      .style('border', '1px solid #eee')
      .style('border-radius', '4px')
      .style('padding', '5px 8px')
      .style('font-size', '11px')
      .style('max-width', '120px');

    // Add legend items
    locations.forEach((location, index) => {
      const legendItem = legendContainer.append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('margin', '3px 0')
        .style('cursor', 'pointer')
        .on('mouseover', function() {
          // Highlight the shape
          d3.select(`#shape-${index}`)
            .style('fill-opacity', 0.5)
            .style('stroke-width', 3);
          
          // Dim other shapes
          chartDatasets.forEach((_, i) => {
            if (i !== index) {
              d3.select(`#shape-${i}`)
                .style('fill-opacity', 0.1)
                .style('stroke-opacity', 0.3);
            }
          });
        })
        .on('mouseout', function() {
          // Reset all shapes
          chartDatasets.forEach((_, i) => {
            d3.select(`#shape-${i}`)
              .style('fill-opacity', 0)
              .style('stroke-width', 2)
              .style('stroke-opacity', 1);
          });
        });

      legendItem.append('div')
        .style('width', '10px')
        .style('height', '10px')
        .style('background-color', colorScale(location))
        .style('margin-right', '5px')
        .style('flex-shrink', '0');

      legendItem.append('span')
        .text(location)
        .style('white-space', 'nowrap')
        .style('overflow', 'hidden')
        .style('text-overflow', 'ellipsis')
        .style('max-width', '100px');
    });

    // Plot data for each location
    chartDatasets.forEach((dataset, index) => {
      // Plot area
      svg.append('path')
        .datum(dataset.data)
        .attr('id', `shape-${index}`)
        .attr('d', line)
        .style('fill', colorScale(dataset.location))
        .style('fill-opacity', 0)
        .style('stroke', colorScale(dataset.location))
        .style('stroke-width', 2);

      // Add data points
      svg.selectAll(`.dataPoints-${index}`)
        .data(dataset.data)
        .enter()
        .append('circle')
        .attr('r', 4)
        .attr('cx', (d, i) => radialScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr('cy', (d, i) => radialScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style('fill', colorScale(dataset.location))
        .style('stroke', '#fff')
        .style('stroke-width', 1)
        .on('mouseover', function (event, d) {
          // Enlarge the circle
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 6);

          // Show tooltip
          tooltip
            .html(`<strong>${dataset.location}</strong><br/>
              <strong>${d.fullName}</strong><br/>
              Value: ${d.value.toFixed(1)}`)
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
          // Restore circle size
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 4);

          // Hide tooltip
          tooltip.style("visibility", "hidden");
        });
    });
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