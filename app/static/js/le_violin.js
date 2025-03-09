angular.module('myApp').service('ViolinChartService', ['$q', function ($q) {
    this.createViolinPlot = function (formData) {
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

        function drawChart(dataset) {
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

            // Filter data for the selected year and "Life expectancy at birth (years)"
            let filteredData = dataset.filter(d => d.Period === formData.year);
            if (formData.region.toLowerCase() !== "all") {
                filteredData = filteredData.filter(d => d.ParentLocation === formData.region);
            }
            filteredData = filteredData.filter(d => d.Indicator === "Life expectancy at birth (years)");

            // Group data by ParentLocation if 'all', otherwise by Location
            const groupKey = (formData.region.toLowerCase() === "all") ? "ParentLocation" : "Location";
            const dataGrouped = Array.from(
                d3.group(filteredData, d => d[groupKey]),
                ([key, values]) => ({ key, values })
            );

            // X-scale for groups
            const x = d3.scaleBand()
                .domain(dataGrouped.map(d => d.key))
                .range([0, width])
                .padding(0.05);

            // Collect all numeric values for the Y scale
            const allValues = filteredData.map(d => +d.FactValueNumeric);
            const y = d3.scaleLinear()
                .domain([d3.min(allValues), d3.max(allValues)])
                .range([height, 0])
                .nice();

            // Add axes
            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(y));

            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
              .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-30)");

            // Axis labels
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("x", width / 2)
                .attr("y", height + 70)
                .style("font-size", "16px")
                .text("Regions / Countries");

            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -30)
                .style("font-size", "16px")
                .text("Life Expectancy (Years)");

            // Prepare violin geometry
            const kde = kernelDensityEstimator(kernelEpanechnikov(7), y.ticks(40));
            const tooltip = d3.select("#violin-tooltip");

            // Scale factor for wider violins
            const scaleFactor = 1.2;

            // Compute density, extremes for each group
            dataGrouped.forEach(group => {
                const values = group.values.map(d => +d.FactValueNumeric);
                group.density = kde(values);
                group.lowExtreme = d3.min(group.values, d => +d.FactValueNumericLow);
                group.highExtreme = d3.max(group.values, d => +d.FactValueNumericHigh);
                group.meanVal = d3.mean(values);
                group.medianVal = d3.median(values);
            });

            // Find max density to scale the violin widths
            const maxDensity = d3.max(dataGrouped, g => d3.max(g.density, d => d.y));
            const xNum = d3.scaleLinear()
                .domain([0, maxDensity])
                // Multiply half the band by scaleFactor
                .range([0, (x.bandwidth() / 2) * scaleFactor]);

            // Area generator for the violin shape
            const area = d3.area()
                .curve(d3.curveCatmullRom)
                .x0(d => -xNum(d.y))
                .x1(d => xNum(d.y))
                .y(d => y(d.x));

            // Draw each violin and its two dashed lines
            dataGrouped.forEach(group => {
                const gViolin = svg.append("g")
                    .attr("transform", `translate(${x(group.key) + x.bandwidth() / 2}, 0)`);

                // Draw the violin shape (with fade-in animation)
                const violinPath = gViolin.append("path")
                    .datum(group.density)
                    .attr("fill", "#69b3a2")
                    .attr("stroke", "none")
                    .attr("d", area)
                    .attr("opacity", 0);

                violinPath.transition()
                    .duration(800)
                    .attr("opacity", 1);

                // Draw dashed lines for extremes (also fade them in)
                const lineLow = gViolin.append("line")
                    .attr("x1", -x.bandwidth() * scaleFactor / 2)
                    .attr("x2", x.bandwidth() * scaleFactor / 2)
                    .attr("y1", y(group.lowExtreme))
                    .attr("y2", y(group.lowExtreme))
                    .attr("stroke", "red")
                    .attr("stroke-dasharray", "4,2")
                    .attr("opacity", 0);

                lineLow.transition()
                    .duration(800)
                    .attr("opacity", 1);

                const lineHigh = gViolin.append("line")
                    .attr("x1", -x.bandwidth() * scaleFactor / 2)
                    .attr("x2", x.bandwidth() * scaleFactor / 2)
                    .attr("y1", y(group.highExtreme))
                    .attr("y2", y(group.highExtreme))
                    .attr("stroke", "red")
                    .attr("stroke-dasharray", "4,2")
                    .attr("opacity", 0);

                lineHigh.transition()
                    .duration(800)
                    .attr("opacity", 1);

                // Mouse events on the <g> for tooltip + color change
                gViolin
                    .on("mouseover", (event) => {
                        tooltip.style("opacity", 1);
                        // Change to hover color
                        violinPath.attr("fill", "orange");
                    })
                    .on("mousemove", (event) => {
                        const chartRect = document
                            .getElementById("violin-chart")
                            .getBoundingClientRect();

                        tooltip
                            .html(`
                                <strong>${group.key}</strong><br/>
                                Low Extreme: ${group.lowExtreme}<br/>
                                High Extreme: ${group.highExtreme}<br/>
                                Mean: ${group.meanVal.toFixed(2)}<br/>
                                Median: ${group.medianVal.toFixed(2)}
                              `)
                            .style("left", (event.pageX - chartRect.left + 15) + "px")
                            .style("top", (event.pageY - chartRect.top + 15) + "px");
                    })
                    .on("mouseleave", () => {
                        tooltip.style("opacity", 0);
                        // Revert color on mouse out
                        violinPath.attr("fill", "#69b3a2");
                    });
            });
        }

        // Load or reuse dataset, then draw
        if (window.dataset) {
            drawChart(window.dataset);
            deferred.resolve();
        } else {
            d3.csv("/static/data/le.csv", d => ({
                Indicator: d.Indicator,
                Location: d.Location,
                ParentLocation: d.ParentLocation,
                Period: d.Period,
                FactValueNumeric: +d.FactValueNumeric,
                FactValueNumericLow: +d.FactValueNumericLow,
                FactValueNumericHigh: +d.FactValueNumericHigh
            }))
            .then(function (data) {
                window.dataset = data;
                drawChart(data);
                deferred.resolve();
            })
            .catch(function (error) {
                deferred.reject(error);
            });
        }
        return deferred.promise;
    };
}]);
