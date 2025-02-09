var app = angular.module('myApp', ['ngMaterial', 'ngAnimate', 'ngAria']);

app.controller('FormController', ['$scope', '$http', '$mdToast', function ($scope, $http, $mdToast) {
  // Initialize form data
  $scope.years = [];
  $scope.countries = [];
  $scope.selectedCountries = [];
  $scope.formData = {
    sex: 'male',  // Default value
    year: '2021'  // Default value
  };

  // Custom color palette for up to 10 countries
  const customColors = [
    "#143642", "#741C28", "#E39A47FF", "#9BE243FF", "#533B04FF",
    "#E92949FF", "#506D84", "#D76578FF", "#C5B4A5", "#4872E6FF"
  ];

  // Fetch available countries
  $http.get('/countries').then(function (response) {
    $scope.countries = response.data.countries
      .toString()
      .split(',')
      .map(country => country.trim())
      .filter(country => country.length > 0)
      .sort((a, b) => a.localeCompare(b));  // Sort alphabetically
  });

  $http.get('/years').then(function (response) {
    $scope.years = response.data.years
      .toString()
      .split(',')
      .map(year => year.trim())
      .filter(year => year.length > 0);

    // After loading data, show default chart
    showDefaultChart();
  });

  function showDefaultChart() {
    // Set default countries
    $scope.formData.selectedCountries = ['Somalia', 'Central African Republic', 'Eswatini'];
    $scope.generateSpiderPlot();
  }

  // Helper function to wrap text
  function wrap(text, width) {
    text.each(function() {
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

  function createSpiderChart(data, locations, sex, year) {
    // Clear any existing chart
    d3.select('#radar-chart').selectAll('*').remove();

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
            entry => entry.Indicator === indicator && entry.Sex.toLowerCase() === sex.toLowerCase()
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

    // Chart dimensions
    const width = 500;
    const height = 500;
    const margin = 50;
    const radius = Math.min(width, height) / 2 - margin;

    // Create SVG
    const svg = d3.select('#radar-chart')
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

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
      .style('font-size', '10px')
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

    // Axis labels
    axis.append('text')
      .attr('class', 'legend')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('x', (d, i) => radialScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr('y', (d, i) => radialScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2))
      .text(d => d)
      .style('font-size', '10px')
      .call(wrap, 60);

    // Add tooltip div
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("padding", "8px")
      .style("font-size", "12px")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
      .style("pointer-events", "none");

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${radius + 20}, ${-radius})`);

    // Plot data for each location
    chartDatasets.forEach((dataset, index) => {
      // Plot area
      svg.append('path')
        .datum(dataset.data)
        .attr('d', line)
        .style('fill', 'none')
        .style('stroke', colorScale(index))
        .style('stroke-width', 2);

      // Plot individual data points with tooltips
      svg.selectAll(`.dataPoints-${index}`)
        .data(dataset.data)
        .enter()
        .append('circle')
        .attr('r', 4)
        .attr('cx', (d, i) => radialScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr('cy', (d, i) => radialScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style('fill', colorScale(index))
        .style('stroke', 'white')
        .style('stroke-width', 2)
        .on('mouseover', function(event, d) {
          const circle = d3.select(this);
          // Enlarge the circle
          circle.transition()
            .duration(200)
            .attr('r', 6);
          
          // Show tooltip
          tooltip
            .html(`
              <strong>${dataset.location}</strong><br/>
              <strong>${d.axis}</strong><br/>
              Value: ${d.value.toFixed(2)}
            `)
            .style("visibility", "visible")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on('mousemove', function(event) {
          tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on('mouseout', function() {
          const circle = d3.select(this);
          // Restore circle size
          circle.transition()
            .duration(200)
            .attr('r', 4);
          
          // Hide tooltip
          tooltip.style("visibility", "hidden");
        });

      // Add legend items
      legend.append('rect')
        .attr('x', 0)
        .attr('y', index * 20)
        .attr('width', 10)
        .attr('height', 10)
        .style('fill', colorScale(index));

      legend.append('text')
        .attr('x', 15)
        .attr('y', index * 20 + 10)
        .text(dataset.location)
        .style('font-size', '12px')
        .attr('alignment-baseline', 'middle');
    });

    // Add tooltips to the paths (lines)
    chartDatasets.forEach((dataset, index) => {
      svg.append('path')
        .datum(dataset.data)
        .attr('d', line)
        .style('fill', 'none')
        .style('stroke', colorScale(index))
        .style('stroke-width', 2)
        .style('opacity', 0)
        .style('pointer-events', 'stroke')
        .on('mouseover', function() {
          tooltip
            .html(`<strong>${dataset.location}</strong>`)
            .style("visibility", "visible");
          
          svg.selectAll('path')
            .filter(function() {
              return d3.select(this).style('opacity') !== '0';
            })
            .style('stroke-width', d => d === dataset.data ? 4 : 2)
            .style('opacity', d => d === dataset.data ? 1 : 0.5);
        })
        .on('mousemove', function(event) {
          tooltip
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on('mouseout', function() {
          tooltip.style("visibility", "hidden");
          
          svg.selectAll('path')
            .filter(function() {
              return d3.select(this).style('opacity') !== '0';
            })
            .style('stroke-width', 2)
            .style('opacity', 1);
        });
    });

    // Title
    svg.append('text')
      .attr('x', 0)
      .attr('y', -radius - 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(`Life Expectancy Comparison - ${sex} (${year})`);
  }

  $scope.generateSpiderPlot = function() {
    if (!$scope.formData.sex || !$scope.formData.year || !$scope.formData.selectedCountries || $scope.formData.selectedCountries.length === 0) {
      $mdToast.show(
        $mdToast.simple()
          .textContent('Please select sex, year and at least one country')
          .position('top right')
          .hideDelay(3000)
      );
      return;
    }

    if ($scope.formData.selectedCountries.length > 10) {
      $mdToast.show(
        $mdToast.simple()
          .textContent('Please select maximum 10 countries')
          .position('top right')
          .hideDelay(3000)
      );
      return;
    }

    const promises = $scope.formData.selectedCountries.map(country =>
      $http.get('/life', {
        params: {
          years: $scope.formData.year,
          metric: 'both',
          sex: $scope.formData.sex,
          age: 'both',
          country: country
        }
      })
    );

    Promise.all(promises)
      .then(responses => {
        const data = {};
        responses.forEach((response, index) => {
          data[$scope.formData.selectedCountries[index]] = response.data;
        });
        createSpiderChart(data, $scope.formData.selectedCountries, $scope.formData.sex, $scope.formData.year);
      })
      .catch(error => {
        console.error('Error:', error);
        $mdToast.show(
          $mdToast.simple()
            .textContent('Error generating plot')
            .position('top right')
            .hideDelay(3000)
        );
      });
  };
}]);