var app = angular.module('myApp', ['ngMaterial', 'ngAnimate', 'ngAria']);

app.controller('FormController', ['$scope', '$http', '$mdToast', function ($scope, $http, $mdToast) {
    // Initialize form data
    $scope.years = [];
    $scope.regions = [];
    $scope.formData = {
        region: '',
        year: ''
    };

    // Fetch available countries
    $http.get('/regions').then(function (response) {
        $scope.regions = response.data.regions
            .toString()
            .split(',')
            .map(region => region.trim())
            .filter(region => region.length > 0);
        $scope.regions.unshift('All');
    });
    

    $http.get('/years').then(function (response) {
        $scope.years = response.data.years
            .toString()
            .split(',')
            .map(year => year.trim())
            .filter(year => year.length > 0);

    });
    // Load the CSV dataset using d3.csv
    d3.csv("/static/data/le.csv", function (d) {
        return {
            Indicator: d.Indicator,
            Location: d.Location,
            ParentLocation: d.ParentLocation,
            Period: d.Period,
            FactValueNumeric: +d.FactValueNumeric,
            FactValueNumericLow: +d.FactValueNumericLow,
            FactValueNumericHigh: +d.FactValueNumericHigh
        };
    }).then(function (data) {
        window.dataset = data;
    });

    // Helper functions for kernel density estimation
    function kernelDensityEstimator(kernel, X) {
        return function (V) {
            return X.map(function (x) {
                return { x: x, y: d3.mean(V, function (v) { return kernel(x - v); }) };
            });
        };
    }

    function kernelEpanechnikov(bandwidth) {
        return function (u) {
            u = u / bandwidth;
            return Math.abs(u) <= 1 ? 0.75 * (1 - u * u) / bandwidth : 0;
        };
    }

    function createViolinChart(formData) {
        // Remove any previous SVG in case of re-draw
        d3.select("#violin-chart").select("svg").remove();

        // Set margins and dimensions
        var margin = { top: 20, right: 30, bottom: 50, left: 40 },
            width = 800 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        // Create the SVG canvas
        var svg = d3.select("#violin-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Filter data by the selected year
        var filteredData = dataset.filter(function (d) {
            return d.Period === formData.year;
        });
        // If a specific region is selected (other than "all"), filter by ParentLocation
        if (formData.region.toLowerCase() !== "all") {
            filteredData = filteredData.filter(function (d) {
                return d.ParentLocation === formData.region;
            });
        }
        filteredData = filteredData.filter(function (d) {
            return d.Indicator === "Life expectancy at birth (years)";
        });
        // Determine grouping:
        // If "all" regions are selected, group by ParentLocation.
        // Otherwise, group by country (Location).
        var groupKey = (formData.region.toLowerCase() === "all") ? "ParentLocation" : "Location";

        var dataGrouped = Array.from(d3.group(filteredData, d => d[groupKey]), ([key, values]) => ({ key, values }));

        // Create the x-scale for groups; each group will be assigned a band
        var x = d3.scaleBand()
            .domain(dataGrouped.map(function (d) { return d.key; }))
            .range([0, width])
            .padding(0.05);

        // Determine global y-scale based on life expectancy (FactValueNumeric)
        var allValues = filteredData.map(function (d) { return +d.FactValueNumeric; });
        var y = d3.scaleLinear()
            .domain([d3.min(allValues), d3.max(allValues)])
            .range([height, 0])
            .nice();

        // Add the y-axis
        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        // Add the x-axis
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-45)");
        // Maximum width for a violin (based on the band size)
        var maxViolinWidth = x.bandwidth();

        // Define the kernel density estimator using Epanechnikov kernel.
        // Adjust the bandwidth value (e.g. 7) and number of ticks as needed.
        var kde = kernelDensityEstimator(kernelEpanechnikov(7), y.ticks(40));

        // Compute density and extreme values for each group
        dataGrouped.forEach(function (group) {
            // Extract the life expectancy values for this group
            var values = group.values.map(function (d) { return +d.FactValueNumeric; });
            group.density = kde(values);

            // Determine the minimum and maximum extreme values from the confidence intervals
            group.lowExtreme = d3.min(group.values, function (d) { return +d.FactValueNumericLow; });
            group.highExtreme = d3.max(group.values, function (d) { return +d.FactValueNumericHigh; });
        });

        // Find the maximum density across all groups for scaling the violin widths
        var maxDensity = d3.max(dataGrouped, function (group) {
            return d3.max(group.density, function (d) { return d.y; });
        });

        // Create a scale to convert density to a horizontal offset (half width on each side)
        var xNum = d3.scaleLinear()
            .domain([0, maxDensity])
            .range([0, maxViolinWidth / 2]);

        // For each group, draw the violin shape and add markers for the extreme values
        dataGrouped.forEach(function (group) {
            // Create a group element for each violin, centered at the group's x position
            var g = svg.append("g")
                .attr("transform", "translate(" + (x(group.key) + x.bandwidth() / 2) + ",0)");

            // Create an area generator for the violin shape.
            // The area is defined symmetrically using x0 and x1 for the left and right boundaries.
            var area = d3.area()
                .curve(d3.curveCatmullRom)
                .x0(function (d) { return -xNum(d.y); })
                .x1(function (d) { return xNum(d.y); })
                .y(function (d) { return y(d.x); });

            // Append the violin shape path
            g.append("path")
                .datum(group.density)
                .attr("fill", "#69b3a2")
                .attr("stroke", "none")
                .attr("d", area);

            // Add a dashed horizontal line at the low extreme value
            g.append("line")
                .attr("x1", -maxViolinWidth / 2)
                .attr("x2", maxViolinWidth / 2)
                .attr("y1", y(group.lowExtreme))
                .attr("y2", y(group.lowExtreme))
                .attr("stroke", "red")
                .attr("stroke-dasharray", "4,2");

            // Add a dashed horizontal line at the high extreme value
            g.append("line")
                .attr("x1", -maxViolinWidth / 2)
                .attr("x2", maxViolinWidth / 2)
                .attr("y1", y(group.highExtreme))
                .attr("y2", y(group.highExtreme))
                .attr("stroke", "red")
                .attr("stroke-dasharray", "4,2");
        });
    }


    $scope.generateViolinPlot = function () {
        if (!$scope.formData.year || !$scope.formData.region) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent('Please select year and region')
                    .position('top right')
                    .hideDelay(3000)
            );
            return;
        }
        $scope.formData.region = $scope.formData.region || 'all';
        createViolinChart($scope.formData);
    };

}]);