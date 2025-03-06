// Assuming d3 is already included in your project
var app = angular.module('myApp', ['ngMaterial']);

app.controller('FormController', ['$scope', '$http', '$mdToast', function ($scope, $http, $mdToast) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
    $scope.years = Array.from({ length: 2024 - 1895 + 1 }, (_, i) => 1895 + i);

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

    function createLineAndScatterChart(rawData) {
        // console.log('Raw data received:', rawData);
        d3.select("#line-chart").html("");

        const data = Array.isArray(rawData) ? rawData : JSON.parse(rawData);
        // console.log('Parsed data:', data);

        const chartData = data.map(yearData => ({
            year: yearData.year,
            min: yearData.min,
            max: yearData.max,
            avg: yearData.avg
        }));

        const margin = { top: 50, right: 50, bottom: 50, left: 50 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = d3.select("#line-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const xScale = d3.scalePoint()
            .domain(months)
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([
                d3.min(chartData, d => Math.min(...d.min)),
                d3.max(chartData, d => Math.max(...d.max))
            ])
            .nice()
            .range([height, 0]);

        // Add axes
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        svg.append("g")
            .call(d3.axisLeft(yScale));

        const colors = d3.scaleOrdinal(d3.schemeCategory10);

        // Plot min and max lines
        chartData.forEach((d, i) => {
            svg.append("path")
                .datum(d.min.map((value, index) => ({ month: months[index], value })))
                .attr("fill", "none")
                .attr("stroke", colors(i))
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(d => xScale(d.month))
                    .y(d => yScale(d.value))
                );

            svg.append("path")
                .datum(d.max.map((value, index) => ({ month: months[index], value })))
                .attr("fill", "none")
                .attr("stroke", colors(i))
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(d => xScale(d.month))
                    .y(d => yScale(d.value))
                );
        });

        // Plot avg scatter points
        chartData.forEach((d, i) => {
            svg.selectAll(`.avg-points-${i}`)
                .data(d.avg.map((value, index) => ({ month: months[index], value })))
                .enter()
                .append("circle")
                .attr("cx", d => xScale(d.month))
                .attr("cy", d => yScale(d.value))
                .attr("r", 3)
                .attr("fill", colors(i));
        });

        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width - 100},${10})`);

        chartData.forEach((d, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            legendRow.append("line")
                .attr("x1", 0)
                .attr("x2", 20)
                .attr("y1", 10)
                .attr("y2", 10)
                .attr("stroke", colors(i))
                .attr("stroke-width", 1.5);

            legendRow.append("text")
                .attr("x", 25)
                .attr("y", 10)
                .attr("dominant-baseline", "middle")
                .text(d.year);
        });
    }

    $scope.generateLineChart = function () {
        if (!$scope.formData.state || $scope.formData.years.length === 0) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent('Please select both state and years')
                    .position('top right')
                    .hideDelay(3000)
            );
            return;
        }

        Promise.all([
            fetch('/static/data/climdiv-tminst-v1.0.0-20241205').then(res => res.text()),
            fetch('/static/data/climdiv-tmaxst-v1.0.0-20241205').then(res => res.text()),
            fetch('/static/data/climdiv-tmpcst-v1.0.0-20241205').then(res => res.text())
        ]).then(([tminText, tmaxText, avgText]) => {
            const parseData = (text) => text.trim().split('\n').map(row => {
                const fields = row.trim().split(/\s+/);
                return {
                    Year: fields[0].substring(6, 10),
                    StateCode: fields[0].substring(0, 3),
                    Jan: parseFloat(fields[1]) || null,
                    Feb: parseFloat(fields[2]) || null,
                    Mar: parseFloat(fields[3]) || null,
                    Apr: parseFloat(fields[4]) || null,
                    May: parseFloat(fields[5]) || null,
                    Jun: parseFloat(fields[6]) || null,
                    Jul: parseFloat(fields[7]) || null,
                    Aug: parseFloat(fields[8]) || null,
                    Sep: parseFloat(fields[9]) || null,
                    Oct: parseFloat(fields[10]) || null,
                    Nov: parseFloat(fields[11]) || null,
                    Dec: parseFloat(fields[12]) || null
                };
            });

            const tminData = parseData(tminText);
            const tmaxData = parseData(tmaxText);
            const avgData = parseData(avgText);
            // console.log('Parsed data:', tminData);

            const combinedData = $scope.formData.years.map(year => {
                const yearStr = year.toString();
                const stateCode = $scope.formData.state.code;
                // console.log('Processing data for year', year, 'state', stateCode);
                const tminRow = tminData.find(d => d.Year === yearStr && d.StateCode === stateCode);
                const tmaxRow = tmaxData.find(d => d.Year === yearStr && d.StateCode === stateCode);
                const avgRow = avgData.find(d => d.Year === yearStr && d.StateCode === stateCode);

                if (!tminRow || !tmaxRow || !avgRow) {
                    console.error(`Missing data for year ${year}, state ${stateCode}`);
                    return null;
                }

                return {
                    year: year,
                    min: months.map(month => tminRow[month]),
                    max: months.map(month => tmaxRow[month]),
                    avg: months.map(month => avgRow[month])
                };
            }).filter(d => d !== null);
            // console.log('Combined data:', combinedData);
            createLineAndScatterChart(combinedData);
        }).catch(error => {
            console.error('Error fetching or parsing data:', error);
        });
    };
}]);
