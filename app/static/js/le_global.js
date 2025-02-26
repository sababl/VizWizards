// Create Angular service for chart functions
angular.module('myApp').service('GlobalChartsService', ['$http', function($http) {
    
    this.createGlobalTrendsChart = function() {
        const container = document.getElementById('globalTrendsChart');
        if (!container) return;

        // Show loading state
        container.innerHTML = '<md-progress-circular md-mode="indeterminate"></md-progress-circular>';

        // Get chart dimensions from config
        const dims = ChartConfig.utils.getChartDimensions('globalTrendsChart');
        if (!dims) {
            console.error('Could not get chart dimensions');
            return;
        }

        const width = dims.width;
        const height = dims.height;
        const margin = dims.margin;

        // Create tooltip using config utility
        const tooltip = ChartConfig.utils.createTooltip('globalTrendsChart');

        // Fetch data using Angular's $http
        return $http.get('/global')
            .then(function(response) {
                if (!response.data || !response.data.global_avg_le) {
                    throw new Error("Invalid data format received from API");
                }

                // Process data
                const data = response.data;
                const chartData = Object.entries(data.global_avg_le).map(([year, value]) => ({
                    year: year,
                    lifeExpectancy: value
                }));

                // Clear existing chart
                d3.select("#globalTrendsChart").html("");

                // Create SVG container
                const svg = d3.select("#globalTrendsChart")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

                // Scales
                const x = d3.scaleBand()
                    .range([0, width])
                    .domain(chartData.map(d => d.year))
                    .padding(0.2);

                const y = d3.scaleLinear()
                    .domain([65, d3.max(chartData, d => d.lifeExpectancy) + 1])
                    .range([height, 0]);

                // Axes
                svg.append("g")
                    .attr("transform", `translate(0,${height})`)
                    .call(d3.axisBottom(x))
                    .selectAll("text")
                    .attr("transform", "translate(-10,0)rotate(-45)")
                    .style("text-anchor", "end")
                    .style("font-size", ChartConfig.styling.fontSize.axis)
                    .style("font-family", ChartConfig.styling.fontFamily);

                svg.append("g")
                    .call(d3.axisLeft(y))
                    .style("font-size", ChartConfig.styling.fontSize.axis)
                    .style("font-family", ChartConfig.styling.fontFamily);

                // Axis labels
                svg.append("text")
                    .attr("text-anchor", "middle")
                    .attr("x", width / 2)
                    .attr("y", height + margin.bottom - 10)
                    .text("Year")
                    .style("font-size", ChartConfig.styling.fontSize.labels)
                    .style("font-family", ChartConfig.styling.fontFamily);

                svg.append("text")
                    .attr("text-anchor", "middle")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -margin.left + 15)
                    .attr("x", -height / 2)
                    .text("Life Expectancy (years)")
                    .style("font-size", ChartConfig.styling.fontSize.labels)
                    .style("font-family", ChartConfig.styling.fontFamily);

                // Title
                svg.append("text")
                    .attr("x", width / 2)
                    .attr("y", -10)
                    .attr("text-anchor", "middle")
                    .style("font-size", ChartConfig.styling.fontSize.title)
                    .style("font-family", ChartConfig.styling.fontFamily)
                    .text("Global Average Life Expectancy (2000-2021)");

                // Bars with transitions
                svg.selectAll("rect")
                    .data(chartData)
                    .join("rect")
                    .attr("x", d => x(d.year))
                    .attr("width", x.bandwidth())
                    .attr("y", height)
                    .attr("height", 0)
                    .attr("fill", ChartConfig.colors.primary.main)
                    .transition(ChartConfig.utils.transition())
                    .attr("y", d => y(d.lifeExpectancy))
                    .attr("height", d => height - y(d.lifeExpectancy));

                // Add interactions
                svg.selectAll("rect")
                    .on("mouseover", function(event, d) {
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .attr("fill", ChartConfig.colors.secondary.main);

                        tooltip.transition()
                            .duration(200)
                            .style("opacity", 0.9);
                        tooltip.html(`${d.lifeExpectancy.toFixed(2)} years`)
                            .style("left", (event.pageX + 5) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .attr("fill", ChartConfig.colors.primary.main);

                        tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });

            })
            .catch(function(error) {
                console.error("API error:", error);
                container.innerHTML = `
                    <md-card>
                        <md-card-content>
                            <p class="md-warn">Error loading data: ${error.message || 'Unknown error'}</p>
                        </md-card-content>
                    </md-card>
                `;
            });
    };
}]);

// Update the FormController to use the service
angular.module('myApp').controller('FormController', ['$scope', '$http', 'GlobalChartsService', '$timeout', '$location', '$anchorScroll', '$mdToast',
function($scope, $http, GlobalChartsService, $timeout, $location, $anchorScroll, $mdToast) {
    // ... existing controller code ...

    // Initialize charts when controller loads
    GlobalChartsService.createGlobalTrendsChart();

    // Add window resize handler
    let resizeTimeout;
    window.addEventListener('resize', function() {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            GlobalChartsService.createGlobalTrendsChart();
        }, 500);
    });
}]);