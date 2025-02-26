// Create the Angular module with all required dependencies
var app = angular.module('myApp', ['ngMaterial', 'ngAria', 'ngAnimate', 'ngMessages']);

// Configure Angular Material theme (optional)
app.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('blue')
        .accentPalette('orange');
});

app.controller('FormController', ['$scope', '$http', '$timeout', function ($scope, $http, $timeout) {


$scope.currentNavItem = 'evolution';
$scope.initialized = false;
function initializeView() {
    if (!$scope.initialized) {
        $scope.initialized = true;
        checkElement('globalTrendsChart');
        createTestChart();
    }
}

// Multiple event listeners for initialization
$scope.$on('$viewContentLoaded', function () {
    $timeout(initializeView, 100);
});

// Backup initialization
$timeout(function () {
    if (!$scope.initialized) {
        initializeView();
    }
}, 1000);

// Manual initialization function for testing
window.initView = function () {
    initializeView();
};

// Navigation function
$scope.goto = function (page) {
    $scope.currentNavItem = page;
};

// Check DOM element
function checkElement(id) {
    const element = document.getElementById(id);
    return element;
}

// Direct DOM test function
function directDomTest() {
    const container = checkElement('globalTrendsChart');
    if (container) {
        container.innerHTML = '<div style="background-color: green; color: white; padding: 20px;">Testing direct DOM access</div>';
    }
}

// Make available globally for console testing
window.runDirectTest = directDomTest;

// Simple D3 test chart
function createTestChart() {

    const container = checkElement('globalTrendsChart');
    if (!container) {
        console.error("Cannot create chart - container not found");
        return;
    }

    // Clear any existing chart
    d3.select("#globalTrendsChart").html("");

    // Show loading indicator
    container.innerHTML = '<div style="padding: 20px; text-align: center;">Loading data...</div>';

    // Fetch data from your API
    $http.get('/global')
        .then(function (response) {
            const yearData = response.data.global_avg_le;

            // Convert data to array format for D3
            const chartData = Object.entries(yearData).map(([year, value]) => ({
                year: year,
                lifeExpectancy: value
            }));

            // Set chart dimensions
            const margin = { top: 30, right: 30, bottom: 70, left: 60 };
            const width = container.offsetWidth - margin.left - margin.right;
            const height = 500 - margin.top - margin.bottom;

            // Create SVG
            const svg = d3.select("#globalTrendsChart")
                .html("") // Clear loading message
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            // Create scales
            const x = d3.scaleBand()
                .range([0, width])
                .domain(chartData.map(d => d.year))
                .padding(0.2);

            const y = d3.scaleLinear()
                .domain([65, d3.max(chartData, d => d.lifeExpectancy) + 1])
                .range([height, 0]);

            // Add animation duration constant
            const transitionDuration = 1000;

            // Modify the axes creation to include transitions
            // X axis with animation
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end")
                .style("opacity", 0) // Start invisible
                .transition()
                .duration(transitionDuration)
                .style("opacity", 1); // Fade in

            // Y axis with animation
            svg.append("g")
                .call(d3.axisLeft(y))
                .style("opacity", 0) // Start invisible
                .transition()
                .duration(transitionDuration)
                .style("opacity", 1); // Fade in

            // Animate the bars with modified hover effects
            svg.selectAll("rect")
                .data(chartData)
                .join("rect")
                .attr("x", d => x(d.year))
                .attr("y", height) // Start from bottom
                .attr("width", x.bandwidth())
                .attr("height", 0) // Start with height 0
                .attr("fill", "#69b3a2")
                .transition() // Add transition
                .duration(transitionDuration)
                .delay((d, i) => i * 100) // Stagger the animations
                .attr("y", d => y(d.lifeExpectancy))
                .attr("height", d => height - y(d.lifeExpectancy))
                .on("end", function() { // Add event listeners after transition
                    d3.selectAll("rect")
                        .on("mouseover", function(event, d) {
                            // Only change color
                            d3.select(this)
                                .transition()
                                .duration(200)
                                .attr("fill", "#2E8B57");

                            // Add tooltip
                            let tooltip = svg.append("text")
                                .attr("class", "tooltip")
                                .attr("x", x(d.year) + x.bandwidth() / 2)
                                .attr("y", y(d.lifeExpectancy) - 10)
                                .attr("text-anchor", "middle")
                                .style("opacity", 0)
                                .text(`${d.lifeExpectancy.toFixed(2)} years`);

                            // Fade in tooltip
                            tooltip.transition()
                                .duration(200)
                                .style("opacity", 1);

                            // Auto-remove tooltip after 2 seconds
                            setTimeout(() => {
                                tooltip.transition()
                                    .duration(200)
                                    .style("opacity", 0)
                                    .remove();
                            }, 2000);
                        })
                        .on("mouseout", function() {
                            // Only change color back
                            d3.select(this)
                                .transition()
                                .duration(200)
                                .attr("fill", "#69b3a2");
                        });
                });

            // After the transition, add the hover effects
            svg.selectAll("rect")
                .on("mouseover", function(event, d) {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("fill", "#2E8B57")
                        .attr("transform", "scale(1.05)"); // Slightly enlarge the bar

                    // Add tooltip with animation
                    svg.append("text")
                        .attr("id", "tooltip")
                        .attr("x", x(d.year) + x.bandwidth() / 2)
                        .attr("y", y(d.lifeExpectancy) - 10)
                        .attr("text-anchor", "middle")
                        .style("opacity", 0)
                        .text(`${d.lifeExpectancy.toFixed(2)} years`)
                        .transition()
                        .duration(200)
                        .style("opacity", 1);
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr("fill", "#69b3a2")
                        .attr("transform", "scale(1)"); // Return to original size

                    // Remove tooltip with fade out
                    d3.select("#tooltip")
                        .transition()
                        .duration(200)
                        .style("opacity", 0)
                        .remove();
                });

            // Animate the title and labels
            svg.selectAll("text:not(#tooltip)")
                .style("opacity", 0)
                .transition()
                .duration(transitionDuration)
                .style("opacity", 1);

        })
        .catch(function (error) {
            console.error("API error:", error);
            // Show error in Material design style
            if (container) {
                container.innerHTML = `
                        <md-card>
                            <md-card-content>
                                <p class="md-warn">Error loading data: ${error.message || 'Unknown error'}</p>
                            </md-card-content>
                        </md-card>
                    `;
            }

            // Try to create a fallback chart with dummy data if API fails
            $timeout(function () {
                createFallbackChart();
            }, 1000);
        });
}

// Initialize the charts when the app loads
$scope.$on('$viewContentLoaded', function () {
    checkElement('globalTrendsChart');

    // Try test chart first
    createTestChart();

    // Then try the main chart after a delay
    $timeout(function () {
        createGlobalTrendsChart();
    }, 1000);
});

// Modified chart creation function
function createGlobalTrendsChart() {

    // Show loading state
    const container = document.getElementById('globalTrendsChart');
    if (container) {
        container.innerHTML = '<md-progress-circular md-mode="indeterminate"></md-progress-circular>';
    }

    // Use $timeout to ensure Angular digest cycle is complete
    $timeout(function () {
        $http.get('/global')
            .then(function (response) {
                if (!response.data || !response.data.global_avg_le) {
                    throw new Error("Invalid data format received from API");
                }

                const data = response.data;
                const yearData = data.global_avg_le;

                // Convert the data to an array format for D3
                const chartData = Object.entries(yearData).map(([year, value]) => ({
                    year: year,
                    lifeExpectancy: value
                }));


                // Clear any existing chart
                d3.select("#globalTrendsChart").html("");

                // Set chart dimensions
                const margin = { top: 30, right: 30, bottom: 70, left: 60 };
                const width = 800 - margin.left - margin.right;
                const height = 500 - margin.top - margin.bottom;

                // Create SVG container
                const svg = d3.select("#globalTrendsChart")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .style("border", "1px solid #ccc") // Add border to see if SVG is created
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);


                // X axis
                const x = d3.scaleBand()
                    .range([0, width])
                    .domain(chartData.map(d => d.year))
                    .padding(0.2);

                svg.append("g")
                    .attr("transform", `translate(0,${height})`)
                    .call(d3.axisBottom(x))
                    .selectAll("text")
                    .attr("transform", "translate(-10,0)rotate(-45)")
                    .style("text-anchor", "end");


                // Add X axis label
                svg.append("text")
                    .attr("text-anchor", "middle")
                    .attr("x", width / 2)
                    .attr("y", height + margin.bottom - 10)
                    .text("Year");

                // Y axis
                const y = d3.scaleLinear()
                    .domain([65, d3.max(chartData, d => d.lifeExpectancy) + 1])
                    .range([height, 0]);

                svg.append("g")
                    .call(d3.axisLeft(y));


                // Add Y axis label
                svg.append("text")
                    .attr("text-anchor", "middle")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -margin.left + 15)
                    .attr("x", -height / 2)
                    .text("Life Expectancy (years)");

                // Add title
                svg.append("text")
                    .attr("x", width / 2)
                    .attr("y", -10)
                    .attr("text-anchor", "middle")
                    .style("font-size", "18px")
                    .text("Global Average Life Expectancy (2000-2021)");


                // Bars with modified hover effects
                svg.selectAll("rect")
                    .data(chartData)
                    .join("rect")
                    .attr("x", d => x(d.year))
                    .attr("y", d => y(d.lifeExpectancy))
                    .attr("width", x.bandwidth())
                    .attr("height", d => height - y(d.lifeExpectancy))
                    .attr("fill", "#69b3a2")
                    .on("mouseover", function(event, d) {
                        // Only change color
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .attr("fill", "#2E8B57");

                        // Add tooltip
                        let tooltip = svg.append("text")
                            .attr("class", "tooltip")
                            .attr("x", x(d.year) + x.bandwidth() / 2)
                            .attr("y", y(d.lifeExpectancy) - 10)
                            .attr("text-anchor", "middle")
                            .style("opacity", 0)
                            .text(`${d.lifeExpectancy.toFixed(2)} years`);

                        // Fade in tooltip
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", 1);

                        // Auto-remove tooltip after 2 seconds
                        setTimeout(() => {
                            tooltip.transition()
                                .duration(200)
                                .style("opacity", 0)
                                .remove();
                        }, 2000);
                    })
                    .on("mouseout", function() {
                        // Only change color back
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .attr("fill", "#69b3a2");
                    });

            })
            .catch(function (error) {
                console.error("API error:", error);
                // Show error in Material design style
                if (container) {
                    container.innerHTML = `
                            <md-card>
                                <md-card-content>
                                    <p class="md-warn">Error loading data: ${error.message || 'Unknown error'}</p>
                                </md-card-content>
                            </md-card>
                        `;
                }

                // Try to create a fallback chart with dummy data if API fails
                $timeout(function () {
                    createFallbackChart();
                }, 1000);
            });
    });
}

// Fallback chart with dummy data
function createFallbackChart() {
    // Create dummy data
    const dummyData = [
        { year: "2000", lifeExpectancy: 66.98 },
        { year: "2005", lifeExpectancy: 68.49 },
        { year: "2010", lifeExpectancy: 70.30 },
        { year: "2015", lifeExpectancy: 71.68 },
        { year: "2020", lifeExpectancy: 72.05 }
    ];

    // Clear any existing chart
    d3.select("#globalTrendsChart").html("");
    d3.select("#globalTrendsChart")
        .append("div")
        .style("background-color", "#fff3cd")
        .style("padding", "10px")
        .style("margin-bottom", "10px")
        .style("border", "1px solid #ffeeba")
        .text("Using fallback data (API failed)");

    // Set chart dimensions
    const margin = { top: 30, right: 30, bottom: 70, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3.select("#globalTrendsChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X axis
    const x = d3.scaleBand()
        .range([0, width])
        .domain(dummyData.map(d => d.year))
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Y axis
    const y = d3.scaleLinear()
        .domain([65, d3.max(dummyData, d => d.lifeExpectancy) + 1])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Fallback Chart: Global Average Life Expectancy (Sample Data)");

    // Bars
    svg.selectAll("rect")
        .data(dummyData)
        .join("rect")
        .attr("x", d => x(d.year))
        .attr("y", d => y(d.lifeExpectancy))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.lifeExpectancy))
        .attr("fill", "#ffc107");
}
}]);

// Add a global ready function to test from console
window.testGlobalChart = function () {
    const element = document.getElementById('globalTrendsChart');
    if (element) {
        element.innerHTML = "<p>Testing direct access at " + new Date().toISOString() + "</p>";
    }
};

// Add console test function
window.testChart = function () {
    const element = document.getElementById('globalTrendsChart');
};