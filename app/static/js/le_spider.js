var app = angular.module('myApp', ['ngMaterial', 'ngAnimate', 'ngAria']);

app.controller('FormController', ['$scope', '$http', '$mdToast', function ($scope, $http, $mdToast) {
  // Initialize form data
  $scope.years = [];
  $scope.countries = [];
  $scope.selectedCountries = [];
  $scope.formData = {
    sex: '',
    year: ''
  };

  // Fetch available countries
  $http.get('/countries').then(function (response) {
    $scope.countries = response.data.countries
      .toString()
      .split(',')
      .map(country => country.trim())
      .filter(country => country.length > 0);

  });

  $http.get('/years').then(function (response) {
    $scope.years = response.data.years
      .toString()
      .split(',')
      .map(year => year.trim())
      .filter(year => year.length > 0);
  });

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
    const chartDatasets = locations.map((location, index) => {
      const locationData = indicators.map(indicator => {
        let value = null;

        // Check both life expectancy (le) and healthy life expectancy (hle) datasets

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
    console.log("chartDatasets", chartDatasets);
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

    // Color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Angle slice
    const angleSlice = Math.PI * 2 / indicators.length;

    // Line generator
    const line = d3.lineRadial()
      .radius(d => radialScale(d.value))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);

    // Background circles
    const axisGrid = svg.append('g').attr('class', 'axisWrapper');

    axisGrid.selectAll('.levels')
      .data(d3.range(1, 5).reverse())
      .enter()
      .append('circle')
      .attr('r', d => radius / 5 * d)
      .style('fill', '#CDCDCD')
      .style('stroke', '#CDCDCD')
      .style('fill-opacity', 0.1)
      .style('stroke-opacity', 0.4);

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
      .style('font-size', '10px');

    // Plot data for each location
    chartDatasets.forEach((dataset, index) => {
      // Plot area
      svg.append('path')
        .datum(dataset.data)
        .attr('d', line)
        .style('fill', 'none')
        .style('stroke', colorScale(index))
        .style('stroke-width', 2);

      // Plot individual data points
      svg.selectAll(`.dataPoints-${index}`)
        .data(dataset.data)
        .enter()
        .append('circle')
        .attr('r', 4)
        .attr('cx', (d, i) => radialScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr('cy', (d, i) => radialScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2))
        .style('fill', colorScale(index))
        .style('stroke', 'white')
        .style('stroke-width', 2);
    });

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${radius + 20}, ${-radius})`);

    chartDatasets.forEach((dataset, index) => {
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

    // Title
    svg.append('text')
      .attr('x', 0)
      .attr('y', -radius - 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(`Life Expectancy Comparison - ${sex} (${year})`);
  }


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
  $scope.generateSpiderPlot = function () {
    console.log("data", $scope.formData, $scope.formData.selectedCountries);
    if (!$scope.formData.sex || !$scope.formData.year || $scope.formData.selectedCountries.length === 0) {
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
        console.log("responses", responses);
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