angular.module('myApp').service('ViolinChartService', ['$q', function($q) {
    this.createViolinPlot = function(formData) {
        const deferred = $q.defer();
        const container = document.getElementById('violin-chart');
        
        if (!container || !formData.year || !formData.region) {
            deferred.reject(new Error('Missing required parameters'));
            return deferred.promise;
        }
        // Convert year to string for consistent comparison
        formData.year = formData.year.toString();
        // Remove any previous SVG (for re-draw)
        d3.select("#violin-chart").select("svg").remove();

        // Helper functions for kernel density estimation
        function kernelDensityEstimator(kernel, X) {
            return function(V) {
                return X.map(function(x) {
                    return { x: x, y: d3.mean(V, function(v) { return kernel(x - v); }) };
                });
            };
        }
        
        function kernelEpanechnikov(bandwidth) {
            return function(u) {
                u = u / bandwidth;
                return Math.abs(u) <= 1 ? 0.75 * (1 - u * u) / bandwidth : 0;
            };
        }
        
        // Function to actually draw the violin chart using the dataset
        function drawChart(dataset) {
            const containerWidth = container.clientWidth;
            const margin = { top: 20, right: 30, bottom: 80, left: 50 },
                  width = 800 - margin.left - margin.right,
                  height = 500 - margin.top - margin.bottom;
            
            // Create the SVG canvas
            const svg = d3.select("#violin-chart")
                .append("svg")
                .attr("width", "100%") // responsive
                .attr("height", height + margin.top + margin.bottom)
                .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
            
            // Filter data for the selected year and indicator
            let filteredData = dataset.filter(d => d.Period === formData.year);
            if (formData.region.toLowerCase() !== "all") {
                filteredData = filteredData.filter(d => d.ParentLocation === formData.region);
            }
            filteredData = filteredData.filter(d => d.Indicator === "Life expectancy at birth (years)");
            
            // Group data: if "all" regions, group by ParentLocation; otherwise by Location.
            const groupKey = (formData.region.toLowerCase() === "all") ? "ParentLocation" : "Location";
            const dataGrouped = Array.from(d3.group(filteredData, d => d[groupKey]), ([key, values]) => ({ key, values }));
            console.log(formData);  
            console.log(dataGrouped);
            // X-scale for groups
            const x = d3.scaleBand()
                .domain(dataGrouped.map(d => d.key))
                .range([0, width])
                .padding(0.05);
            
            // Global y-scale based on life expectancy values
            const allValues = filteredData.map(d => +d.FactValueNumeric);
            const y = d3.scaleLinear()
                .domain([d3.min(allValues), d3.max(allValues)])
                .range([height, 0])
                .nice();
            
            // Add y-axis
            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(y));
            
            // Add x-axis with rotated labels for readability
            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-30)");
            
            // X-axis label
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("x", width / 2)
                .attr("y", height + 70)
                .style("font-size", "16px")
                .text("Regions / Countries");
            
            // Y-axis label
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -30)
                .style("font-size", "16px")
                .text("Life Expectancy (Years)");
            
            // Maximum width for a violin (based on the band size)
            const maxViolinWidth = x.bandwidth();
            const kde = kernelDensityEstimator(kernelEpanechnikov(7), y.ticks(40));
            
            // Compute density and extreme values for each group
            dataGrouped.forEach(group => {
                const values = group.values.map(d => +d.FactValueNumeric);
                group.density = kde(values);
                group.lowExtreme = d3.min(group.values, d => +d.FactValueNumericLow);
                group.highExtreme = d3.max(group.values, d => +d.FactValueNumericHigh);
            });
            
            // Find the maximum density for scaling
            const maxDensity = d3.max(dataGrouped, group => d3.max(group.density, d => d.y));
            const xNum = d3.scaleLinear()
                .domain([0, maxDensity])
                .range([0, maxViolinWidth / 2]);
            
            // Draw the violin shapes and extreme value markers for each group
            dataGrouped.forEach(group => {
                const g = svg.append("g")
                    .attr("transform", "translate(" + (x(group.key) + x.bandwidth() / 2) + ",0)");
                
                const area = d3.area()
                    .curve(d3.curveCatmullRom)
                    .x0(d => -xNum(d.y))
                    .x1(d => xNum(d.y))
                    .y(d => y(d.x));
                
                g.append("path")
                    .datum(group.density)
                    .attr("fill", "#69b3a2")
                    .attr("stroke", "none")
                    .attr("d", area);
                
                // Dashed lines at the extreme values
                g.append("line")
                    .attr("x1", -maxViolinWidth / 2)
                    .attr("x2", maxViolinWidth / 2)
                    .attr("y1", y(group.lowExtreme))
                    .attr("y2", y(group.lowExtreme))
                    .attr("stroke", "red")
                    .attr("stroke-dasharray", "4,2");
                
                g.append("line")
                    .attr("x1", -maxViolinWidth / 2)
                    .attr("x2", maxViolinWidth / 2)
                    .attr("y1", y(group.highExtreme))
                    .attr("y2", y(group.highExtreme))
                    .attr("stroke", "red")
                    .attr("stroke-dasharray", "4,2");
            });
        }
        
        // Check if the dataset is already loaded; if not, load it from CSV
        if (window.dataset) {
            drawChart(window.dataset);
            deferred.resolve();
        } else {
            d3.csv("/static/data/le.csv", function(d) {
                return {
                    Indicator: d.Indicator,
                    Location: d.Location,
                    ParentLocation: d.ParentLocation,
                    Period: d.Period,
                    FactValueNumeric: +d.FactValueNumeric,
                    FactValueNumericLow: +d.FactValueNumericLow,
                    FactValueNumericHigh: +d.FactValueNumericHigh
                };
            }).then(function(data) {
                window.dataset = data;
                drawChart(data);
                deferred.resolve();
            }).catch(function(error) {
                deferred.reject(error);
            });
        }
        
        return deferred.promise;
    };
}]);
