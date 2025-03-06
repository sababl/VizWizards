angular.module('myApp').service('ViolinChartService', ['$http', function($http) {
    
    function kernelDensityEstimator(kernel, X) {
        return function(V) {
            return X.map(function(x) {
                return [x, d3.mean(V, function(v) { return kernel(x - v); })];
            });
        };
    }

    function kernelEpanechnikov(k) {
        return function(v) {
            return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
        };
    }

    this.createViolinPlot = function(formData) {
        return new Promise((resolve, reject) => {
            $http.get('/static/data/le.csv').then(function(response) {
                const data = d3.csvParse(response.data);
                
                // Clear previous chart
                d3.select("#violin-chart").select("svg").remove();

                // Setup dimensions using ChartConfig
                const dims = ChartConfig.utils.getChartDimensions('violin-chart');
                const margin = dims.margin;
                const width = dims.width;
                const height = dims.height;

                // Create SVG
                const svg = d3.select("#violin-chart")
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", `translate(${margin.left},${margin.top})`);

                // Filter data based on formData
                let filteredData = data;
                if (formData.region !== 'all') {
                    filteredData = data.filter(d => d.region === formData.region);
                }
                filteredData = filteredData.filter(d => d.year === formData.year);

                // Process data for violin plot
                const lifeExp = filteredData.map(d => +d.life_expectancy);
                const y = d3.scaleLinear()
                    .domain([d3.min(lifeExp), d3.max(lifeExp)])
                    .range([height, 0]);

                // Compute kernel density estimation
                const kde = kernelDensityEstimator(kernelEpanechnikov(7), y.ticks(50));
                const density = kde(lifeExp);

                // Create x scale for density
                const x = d3.scaleLinear()
                    .domain([0, d3.max(density, d => d[1])])
                    .range([0, width/2]);

                // Draw violin shape
                svg.append("path")
                    .datum(density)
                    .style("fill", ChartConfig.colors.primary.main)
                    .style("opacity", 0.8)
                    .attr("d", d3.line()
                        .curve(d3.curveBasis)
                        .x(d => x(d[1]))
                        .y(d => y(d[0]))
                    );

                // Mirror the violin
                svg.append("path")
                    .datum(density)
                    .style("fill", ChartConfig.colors.primary.main)
                    .style("opacity", 0.8)
                    .attr("d", d3.line()
                        .curve(d3.curveBasis)
                        .x(d => -x(d[1]))
                        .y(d => y(d[0]))
                    );

                // Add Y axis
                svg.append("g")
                    .attr("class", "y-axis")
                    .call(d3.axisLeft(y))
                    .style("font-size", ChartConfig.styling.fontSize.axis)
                    .style("font-family", ChartConfig.styling.fontFamily);

                // Add title
                svg.append("text")
                    .attr("x", width/2)
                    .attr("y", -margin.top/2)
                    .attr("text-anchor", "middle")
                    .style("font-size", ChartConfig.styling.fontSize.title)
                    .style("font-family", ChartConfig.styling.fontFamily)
                    .text(`Life Expectancy Distribution (${formData.year})`);

                resolve();
            }).catch(error => {
                reject(error);
            });
        });
    };
}]);