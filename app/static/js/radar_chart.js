
var app = angular.module('myApp', ['ngMaterial']);

app.controller('FormController', ['$scope', '$http', '$mdToast', function ($scope, $http, $mdToast) {

    $scope.states = {
        "001": "Alabama",
        "002": "Arizona",
        "003": "Arkansas",
        "004": "California",
        "005": "Colorado",
        "006": "Connecticut",
        "007": "Delaware",
        "008": "Florida",
        "009": "Georgia",
        "010": "Idaho",
        "011": "Illinois",
        "012": "Indiana",
        "013": "Iowa",
        "014": "Kansas",
        "015": "Kentucky",
        "016": "Louisiana",
        "017": "Maine",
        "018": "Maryland",
        "019": "Massachusetts",
        "020": "Michigan",
        "021": "Minnesota",
        "022": "Mississippi",
        "023": "Missouri",
        "024": "Montana",
        "025": "Nebraska",
        "026": "Nevada",
        "027": "New Hampshire",
        "028": "New Jersey",
        "029": "New Mexico",
        "030": "New York",
        "031": "North Carolina",
        "032": "North Dakota",
        "033": "Ohio",
        "034": "Oklahoma",
        "035": "Oregon",
        "036": "Pennsylvania",
        "037": "Rhode Island",
        "038": "South Carolina",
        "039": "South Dakota",
        "040": "Tennessee",
        "041": "Texas",
        "042": "Utah",
        "043": "Vermont",
        "044": "Virginia",
        "045": "Washington",
        "046": "West Virginia",
        "047": "Wisconsin",
        "048": "Wyoming",
        "050": "Alaska",
        "101": "Northeast Region",
        "102": "East North Central Region",
        "103": "Central Region",
        "104": "Southeast Region",
        "105": "West North Central Region",
        "106": "South Region",
        "107": "Southwest Region",
        "108": "Northwest Region",
        "109": "West Region",
        "110": "National (contiguous 48 States)"
    };

    $scope.stateList = Object.entries($scope.states).map(([code, name]) => ({ code, name }));
    // Filter out invalid or empty states
    $scope.years = Array.from({ length: 2024 - 1895 + 1 }, (_, i) => 1895 + i); // Generate years from 1895 to 2024

    $scope.formData = {
        state: '',
        years: [],
    };


    $scope.validateYearSelection = function () {
        if ($scope.formData.years.length > 10) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent('Please select up to 10 years only')
                    .position('top right')
                    .hideDelay(3000)
            );
            $scope.formData.years = $scope.formData.years.slice(0, 10);
        }
    };

    function createRadarChart(rawData) {
        // console.log('Raw data received:', rawData);
        d3.select("#radar-chart").html("");

        const data = Array.isArray(rawData) ? rawData : JSON.parse(rawData);
        // console.log('Parsed data:', data);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const chartData = data.map(yearData => ({
            year: yearData[0],
            values: yearData.slice(1).map((temp, i) => ({
                axis: months[i],
                value: parseFloat(temp)
            }))
        }));

        // console.log('Transformed chart data:', chartData);

        const margin = { top: 100, right: 200, bottom: 100, left: 100 };
        const width = 800 - margin.left - margin.right;
        const height = 800 - margin.top - margin.bottom;
        const radius = Math.min(width / 2, height / 2);

        // Ensure we have valid temperature values
        const allTemps = chartData.flatMap(d => d.values.map(v => v.value));
        const tempRange = [Math.min(...allTemps), Math.max(...allTemps)];
        // console.log('Temperature range:', tempRange);

        const rScale = d3.scaleLinear()
            .domain([0, tempRange[1]])
            .range([0, radius]);

        const svg = d3.select("#radar-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${width / 2 + margin.left},${height / 2 + margin.top})`);

        // Draw axes
        const angleSlice = Math.PI * 2 / months.length;
        months.forEach((month, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            // Draw axis line
            svg.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", radius * Math.cos(angle))
                .attr("y2", radius * Math.sin(angle))
                .attr("stroke", "#999")
                .attr("stroke-width", 1);

            // Add month label
            svg.append("text")
                .attr("x", (radius + 20) * Math.cos(angle))
                .attr("y", (radius + 20) * Math.sin(angle))
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .text(month);
        });

        // Draw circles for the grid
        const circles = Array.from({ length: Math.floor((tempRange[1]) / 20) + 1 }, (_, i) => i * 20);
        circles.forEach(temp => {
            const r = rScale(temp);
            svg.append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("r", r)
                .attr("fill", "none")
                .attr("stroke", "#ccc")
                .attr("stroke-dasharray", "4,4");
            svg.append("text")
                .attr("x", 5)
                .attr("y", -r)
                .attr("dy", "0.35em")
                .text(temp + "°F")
                .style("font-size", "10px");
        });

        const colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];

        // Create path generator
        chartData.forEach((yearData, i) => {
            // Create points for a complete circle
            const points = yearData.values.map((d, j) => {
                const angle = angleSlice * j - Math.PI / 2;
                return {
                    x: rScale(d.value) * Math.cos(angle),
                    y: rScale(d.value) * Math.sin(angle)
                };
            });

            // Create line generator
            const lineGenerator = d3.line()
                .x(d => d.x)
                .y(d => d.y)
                .curve(d3.curveLinearClosed);

            // Draw the path
            svg.append("path")
                .datum(points)
                .attr("d", lineGenerator)
                .attr("stroke", colors[i])
                .attr("stroke-width", 2)
                .attr("fill", "none")
                .attr("opacity", 0.75);
        });

        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${radius + 30}, ${-radius + 20})`);

        chartData.forEach((d, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            legendRow.append("line")
                .attr("x1", 0)
                .attr("x2", 20)
                .attr("y1", 10)
                .attr("y2", 10)
                .attr("stroke", colors[i])
                .attr("stroke-width", 2);

            legendRow.append("text")
                .attr("x", 25)
                .attr("y", 10)
                .attr("dominant-baseline", "middle")
                .text(d.year);
        });
    }

    $scope.generateSpiderPlot = function() {
        if (!$scope.formData.state || $scope.formData.years.length === 0) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent('Please select both state and years')
                    .position('top right')
                    .hideDelay(3000)
            );
            return;
        }

        $http.get('/temperature', {
            params: {
                state_code: $scope.formData.state.code,
                years: $scope.formData.years.join(',')
            }
        }).then(function(response) {
            // console.log('API response:', response.data);
            createRadarChart(response.data);
        }).catch(function(error) {
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