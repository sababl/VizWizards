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
    function createRadarChart(data) {
        // Clear previous chart
        d3.select("#radar-chart").html("");
        console.log(data);
        // Make dimensions responsive
        const container = document.getElementById("radar-chart");
        const containerWidth = container.clientWidth;
        const width = Math.min(containerWidth, 600); // Max width of 800px
        const height = width; // Keep it square
        const margin = width * 0.125; // Proportional margin (10% of width)
        const radius = Math.min(width, height) / 2 - margin;

        const svg = d3.select("#radar-chart")
            .append("svg")
            .attr("viewBox", `0 0 ${width} ${height}`) // Add viewBox for responsiveness
            .attr("preserveAspectRatio", "xMidYMid meet")
            .append("g")
            .attr("transform", `translate(${width / 2},${height / 2})`);

        // Update indicators to exactly match API response format
        const indicators = [
            "Life expectancy at age 60 (years)",
            "Life expectancy at birth (years)",
            "Healthy life expectancy (HALE) at birth (years)",
            "Healthy life expectancy (HALE) at age 60 (years)"
        ];
        const angleScale = d3.scalePoint()
            .domain(indicators)
            .range([0, 3 * Math.PI / 2]);

        // Calculate max value for scale
        // Calculate max value for scale
        const allValues = [];
        Object.keys(data).forEach(country => {
            indicators.forEach(indicator => {
                const yearKeyLe = Object.keys(data[country].le || {})[0];
                const yearKeyHle = Object.keys(data[country].hle || {})[0];

                if (yearKeyLe && data[country].le[yearKeyLe]) {
                    const foundLe = data[country].le[yearKeyLe].find(d =>
                        d.Indicator.trim() === indicator.trim()
                    );
                    if (foundLe) allValues.push(foundLe.FactValueNumeric);
                }

                if (yearKeyHle && data[country].hle[yearKeyHle]) {
                    const foundHle = data[country].hle[yearKeyHle].find(d =>
                        d.Indicator.trim() === indicator.trim()
                    );
                    if (foundHle) allValues.push(foundHle.FactValueNumeric);
                }
            });
        });
        console.log("indicators", indicators);
        console.log("allValues", allValues);

        const maxValue = Math.max(...allValues) * 1.1; // Add 10% padding
        const radiusScale = d3.scaleLinear()
            .domain([0, maxValue])
            .range([0, radius]);

        // Draw circular grid lines
        const gridCircles = [0.2, 0.4, 0.6, 0.8, 1];
        gridCircles.forEach(d => {
            svg.append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", radiusScale(maxValue * d))
                .attr("fill", "none")
                .attr("stroke", "#ccc")
                .attr("stroke-dasharray", "4,4");

            svg.append("text")
                .attr("x", 5)
                .attr("y", -radiusScale(maxValue * d))
                .attr("fill", "#666")
                .attr("font-size", "10px")
                .text(Math.round(maxValue * d));
        });

        // Draw axes
        const axes = svg.selectAll(".axis")
            .data(indicators)
            .enter()
            .append("g")
            .attr("class", "axis");

        axes.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", (d) => radiusScale(maxValue) * Math.cos(angleScale(d) - Math.PI / 2))
            .attr("y2", (d) => radiusScale(maxValue) * Math.sin(angleScale(d) - Math.PI / 2))
            .attr("stroke", "#999")
            .attr("stroke-width", 1);

        // Add axis labels with better positioning
        axes.append("text")
            .attr("x", (d) => (radius + 30) * Math.cos(angleScale(d) - Math.PI / 2))
            .attr("y", (d) => (radius + 30) * Math.sin(angleScale(d) - Math.PI / 2))
            .attr("text-anchor", (d) => {
                const angle = angleScale(d);
                if (Math.abs(angle - Math.PI) < 0.1) return "middle";
                return angle > Math.PI ? "end" : "start";
            })
            .attr("dy", (d) => {
                const angle = angleScale(d);
                if (angle < 0.1 || Math.abs(angle - Math.PI) < 0.1) return "-0.5em";
                return "0.35em";
            })
            .text(d => d)
            .attr("font-size", "12px")
            .call(wrap, 120);

        // Line generator
        const line = d3.lineRadial()
            .angle(d => angleScale(d.label) - Math.PI / 2)
            .radius(d => radiusScale(d.value))
            .curve(d3.curveLinearClosed);

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // Draw country polygons
        Object.keys(data).forEach(country => {
            const yearKey = Object.keys(data[country].le)[0];
            const countryData = [];

            // Modification in the data extraction logic
            indicators.forEach(indicator => {
                let value = 0;
                const yearKeyLe = Object.keys(data[country].le || {})[0];
                const yearKeyHle = Object.keys(data[country].hle || {})[0];

                console.log(`Searching for indicator: ${indicator}`);
                console.log('LE Data:', data[country].le ? data[country].le[yearKeyLe] : 'No LE data');
                console.log('HLE Data:', data[country].hle ? data[country].hle[yearKeyHle] : 'No HLE data');

                // Search in both LE and HLE datasets
                if (yearKeyLe && data[country].le[yearKeyLe]) {
                    const foundLe = data[country].le[yearKeyLe].find(d =>
                        d.Indicator.trim() === indicator.trim()
                    );
                    if (foundLe) {
                        value = foundLe.FactValueNumeric;
                        console.log(`Found in LE: ${value}`);
                    }
                }

                if (!value && yearKeyHle && data[country].hle[yearKeyHle]) {
                    const foundHle = data[country].hle[yearKeyHle].find(d =>
                        d.Indicator.trim() === indicator.trim()
                    );
                    if (foundHle) {
                        value = foundHle.FactValueNumeric;
                        console.log(`Found in HLE: ${value}`);
                    }
                }

                console.log(`Final value for ${indicator}: ${value}`);

                countryData.push({
                    label: indicator,
                    value: value || 0
                });
            });
            console.log('Country data:', countryData);

            // Draw polygon
            svg.append("path")
                .datum(countryData)
                .attr("d", line)
                .attr("fill", color(country))
                .attr("stroke", color(country))
                .attr("fill-opacity", 0)
                .attr("stroke-width", 2);
        });

        // Add legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${radius + 30},-${radius})`);

        Object.keys(data).forEach((country, i) => {
            const legendItem = legend.append("g")
                .attr("transform", `translate(0,${i * 20})`);

            legendItem.append("rect")
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", color(country));

            legendItem.append("text")
                .attr("x", 20)
                .attr("y", 12)
                .text(country);
        });
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
        if (!$scope.formData.sex || !$scope.formData.year || $scope.selectedCountries.length === 0) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent('Please select sex, year and at least one country')
                    .position('top right')
                    .hideDelay(3000)
            );
            return;
        }

        if ($scope.selectedCountries.length > 10) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent('Please select maximum 10 countries')
                    .position('top right')
                    .hideDelay(3000)
            );
            return;
        }

        const promises = $scope.selectedCountries.map(country =>
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
                    data[$scope.selectedCountries[index]] = response.data;
                });
                createRadarChart(data);
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