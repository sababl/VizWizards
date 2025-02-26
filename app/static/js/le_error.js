function createErrorChart(formData) {
    if (!formData.year || !formData.region) {
        return; // Don't create chart if data is incomplete
    }

    // Clear existing chart
    d3.select("#error-chart").select("svg").remove();
    d3.select(".tooltip").remove();

    // Use ChartConfig for dimensions and styling
    const config = ChartConfig;
    const dims = config.utils.getChartDimensions('error-chart');
    const width = dims.width;
    const height = dims.height;
    const margin = dims.margin;

    // Create SVG
    const svg = d3.select("#error-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create tooltip using ChartConfig
    const tooltip = config.utils.createTooltip('error-chart');

    // Build API query parameters
    const params = {
        years: formData.year,
        metric: 'le',
        sex: 'both',
        age: 'birth',
        continent: formData.region
    };

    // Fetch life expectancy data from the API
    $http.get('/life', { params: params }).then(function(response) {
        var lifeData = response.data.le[formData.year];
        console.log("Life expectancy data:", lifeData);
        // (Optional) Filter data to include only those entries that match the selected ParentLocation (case-insensitive)
        lifeData = lifeData.filter(function(d) {
            return d.ParentLocation.toLowerCase() === formData.region.toLowerCase();
        });

        // Create the x scale: one band per country (using the Location property)
        var x = d3.scaleBand()
            .domain(lifeData.map(function(d) { return d.Location; }))
            .range([0, width])
            .padding(0.4);

        // Create the y scale: include the full error range
        var yMin = d3.min(lifeData, function(d) { return d.FactValueNumericLow; }) - 1,
            yMax = d3.max(lifeData, function(d) { return d.FactValueNumericHigh; }) + 1;
        var y = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([height, 0]);

        // Add the x-axis and rotate the labels for better readability
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Add the y-axis
        svg.append("g")
            .call(d3.axisLeft(y));

        // Add descriptive axis labels.
        // X-axis label: Countries.
        svg.append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 20)
            .text("Countries");

        // Y-axis label: Life expectancy.
        svg.append("text")
            .attr("class", "y-axis-label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 20)
            .text("Life Expectancy at Birth (Years)");

        // Draw vertical error bars for each data point
        svg.selectAll(".error-bar")
            .data(lifeData)
            .enter()
            .append("line")
            .attr("class", "error-bar")
            .attr("x1", function(d) { return x(d.Location) + x.bandwidth() / 2; })
            .attr("x2", function(d) { return x(d.Location) + x.bandwidth() / 2; })
            .attr("y1", function(d) { return y(d.FactValueNumericLow); })
            .attr("y2", function(d) { return y(d.FactValueNumericHigh); })
            .style("stroke", "black")
            .style("stroke-width", 1);

        // Add horizontal caps at the top and bottom of each error bar
        var capWidth = 10;
        // Lower cap
        svg.selectAll(".error-cap-low")
            .data(lifeData)
            .enter()
            .append("line")
            .attr("class", "error-cap")
            .attr("x1", function(d) { return x(d.Location) + x.bandwidth() / 2 - capWidth / 2; })
            .attr("x2", function(d) { return x(d.Location) + x.bandwidth() / 2 + capWidth / 2; })
            .attr("y1", function(d) { return y(d.FactValueNumericLow); })
            .attr("y2", function(d) { return y(d.FactValueNumericLow); })
            .style("stroke", "black")
            .style("stroke-width", 1);

        // Upper cap
        svg.selectAll(".error-cap-high")
            .data(lifeData)
            .enter()
            .append("line")
            .attr("class", "error-cap")
            .attr("x1", function(d) { return x(d.Location) + x.bandwidth() / 2 - capWidth / 2; })
            .attr("x2", function(d) { return x(d.Location) + x.bandwidth() / 2 + capWidth / 2; })
            .attr("y1", function(d) { return y(d.FactValueNumericHigh); })
            .attr("y2", function(d) { return y(d.FactValueNumericHigh); })
            .style("stroke", "black")
            .style("stroke-width", 1);

        // Mark the mean life expectancy with a red circle for each country.
        // Later, these dots will be connected by a line.
        var meanMarkers = svg.selectAll(".mean-marker")
            .data(lifeData)
            .enter()
            .append("circle")
            .attr("class", "mean-marker")
            .attr("cx", function(d) { return x(d.Location) + x.bandwidth() / 2; })
            .attr("cy", function(d) { return y(d.FactValueNumeric); })
            .attr("r", 4)
            .style("fill", "red");

        // Connect the dots with a line.
        var lineGenerator = d3.line()
            .x(function(d) { return x(d.Location) + x.bandwidth() / 2; })
            .y(function(d) { return y(d.FactValueNumeric); });

        svg.append("path")
            .datum(lifeData)
            .attr("class", "mean-line")
            .attr("fill", "none")
            .attr("stroke", "blue")
            .attr("stroke-width", 2)
            .attr("d", lineGenerator);

        // Add interactive highlighting and a textual label on hover.
        meanMarkers
            .on("mouseover", function(event, d) {
                // Highlight the dot.
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 8)
                    .style("fill", "orange");

                // Show tooltip near the mouse pointer.
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html("Mean: " + d.FactValueNumeric)
                       .style("left", (event.pageX + 5) + "px")
                       .style("top", (event.pageY - 28) + "px");

                // Append a textual label next to the highlighted dot.
                svg.append("text")
                    .attr("class", "temp-label")
                    .attr("x", x(d.Location) + x.bandwidth() / 2 + 5)
                    .attr("y", y(d.FactValueNumeric) - 10)
                    .text(d.FactValueNumeric)
                    .attr("fill", "black")
                    .attr("font-size", "12px")
                    .attr("font-weight", "bold");
            })
            .on("mouseout", function(event, d) {
                // Remove the highlight.
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 4)
                    .style("fill", "red");

                // Hide the tooltip.
                tooltip.transition().duration(500).style("opacity", 0);

                // Remove the temporary text label.
                svg.selectAll(".temp-label").remove();
            });

    }).catch(function(error) {
        console.error("Error fetching life expectancy data:", error);
        $mdToast.show(
            $mdToast.simple()
                .textContent('Error fetching data.')
                .position('top right')
                .hideDelay(3000)
        );
    });
}
