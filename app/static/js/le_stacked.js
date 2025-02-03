var app = angular.module('myApp', ['ngMaterial']);

app.controller('FormController', ['$scope', '$http', '$mdToast', function ($scope, $http, $mdToast) {
    $scope.countryName = "Fiji";
    generateStackedAreaChart($scope.countryName);
    function generateStackedAreaChart(countryName) {
        // Define dimensions and margins for the SVG canvas.
        const margin = { top: 50, right: 150, bottom: 50, left: 50 },
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        // Append the SVG canvas to the body.
        const svg = d3.select("#stacked-area-plot").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create a tooltip div (hidden by default).
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "#fff")
            .style("padding", "5px")
            .style("border", "1px solid #ccc")
            .style("border-radius", "4px");

        // This variable will store the combined CSV data.
        let combinedData = [];

        // Function to update the chart based on the selected country.
        function updateChart(countryName) {
            // Normalize the input so that comparisons are case-insensitive.
            countryName = countryName.trim().toLowerCase();
            // Filter the combined data to only include rows for the selected country.
            const filteredData = combinedData.filter(d => d.Location === countryName);
            if (filteredData.length === 0) {
                alert("No data found for country: " + countryName);
                return;
            }

            // Define the four indicators.
            const indicators = [
                "Life expectancy at birth (years)",
                "Life expectancy at age 60 (years)",
                "Healthy life expectancy (HALE) at birth (years)",
                "Healthy life expectancy (HALE) at age 60 (years)"
            ];

            // Group data by year (the Period field).
            const dataByYear = d3.group(filteredData, d => d.Period);
            let processedData = [];
            dataByYear.forEach((values, year) => {
                let yearObj = { year: +year };
                indicators.forEach(ind => {
                    // Filter rows for the current indicator.
                    console.log("values",values);
                    let rows = values.filter(d => d.Indicator === ind.trim().toLowerCase());
                    console.log("rows",rows);
                    let maleVal = null, femaleVal = null;
                    rows.forEach(d => {
                        if (d.Dim1 === "male") {
                            maleVal = d.FactValueNumeric;
                        } else if (d.Dim1 === "female") {
                            femaleVal = d.FactValueNumeric;
                        }
                    });
                    console.log("male , female",maleVal, femaleVal);
                    // Compute the sex ratio as female/male (if both values exist; otherwise, 0).
                    yearObj[ind] = (maleVal && femaleVal) ? (femaleVal / maleVal) : 0;
                });
                processedData.push(yearObj);
            });

            // Sort the processed data by year.
            processedData.sort((a, b) => a.year - b.year);
            console.log(processedData);
            // Remove any previous chart elements.
            svg.selectAll("*").remove();

            // Create the x-scale (years).
            const x = d3.scaleLinear()
                .domain(d3.extent(processedData, d => d.year))
                .range([0, width]);

            // Use the D3 stack layout to prepare the data.
            const stack = d3.stack()
                .keys(indicators)(processedData);

            // Create the y-scale based on the stacked data.
            const y = d3.scaleLinear()
                .domain([0, d3.max(stack, layer => d3.max(layer, d => d[1]))])
                .nice()
                .range([height, 0]);

            // Define a color scale.
            const color = d3.scaleOrdinal()
                .domain(indicators)
                .range(d3.schemeCategory10);

            // Define the area generator.
            const area = d3.area()
                .x(d => x(d.data.year))
                .y0(d => y(d[0]))
                .y1(d => y(d[1]));

            // Append a path for each stacked layer.
            svg.selectAll(".layer")
                .data(stack)
                .enter().append("path")
                .attr("class", "layer")
                .attr("d", area)
                .style("fill", d => color(d.key))
                .on("mouseover", function (event, d) {
                    const [mouseX, mouseY] = d3.pointer(event);
                    const xValue = x.invert(mouseX);
                    const yearData = processedData.find(item => 
                        Math.abs(item.year - xValue) < 0.5
                    );
                    
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    
                    tooltip.html(`
                        Indicator: ${d.key}<br/>
                        Year: ${Math.round(xValue)}<br/>
                        Value: ${yearData ? yearData[d.key].toFixed(2) : "N/A"}
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

            // Append the x-axis.
            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).tickFormat(d3.format("d")));

            // Append the y-axis.
            svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(y));

            // Add X axis and label
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .append("text")
                .attr("x", width / 2)
                .attr("y", 40)
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .text("Years");

            // Add Y axis and label
            svg.append("g")
                .call(d3.axisLeft(y))
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -40)
                .attr("x", -(height / 2))
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .text("Sex Ratio (Female/Male)");

            // Append a legend to the right of the chart.
            const legend = svg.selectAll(".legend")
                .data(indicators)
                .enter().append("g")
                .attr("class", "legend")
                .attr("transform", (d, i) => `translate(${width + 20}, ${i * 20})`);

            legend.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", d => color(d));

            legend.append("text")
                .attr("x", 24)
                .attr("y", 9)
                .attr("dy", ".35em")
                .text(d => d);
        }

        // Load the two CSV files in parallel.
        Promise.all([
            d3.csv("static/data/le.csv"),
            d3.csv("static/data/hle.csv")
        ]).then(function (files) {
            let leData = files[0],
                hleData = files[1];

            // Pre-process the life expectancy data.
            leData.forEach(d => {
                d.FactValueNumeric = +d.FactValueNumeric;
                d.Period = +d.Period;
                d.Indicator = d.Indicator.toLowerCase();
                d.Dim1 = d.Dim1.toLowerCase();
                d.Location = d.Location.toLowerCase();
            });
            // Pre-process the healthy life expectancy data.
            hleData.forEach(d => {
                d.FactValueNumeric = +d.FactValueNumeric;
                d.Period = +d.Period;
                d.Indicator = d.Indicator.toLowerCase();
                d.Dim1 = d.Dim1.toLowerCase();
                d.Location = d.Location.toLowerCase();
            });

            // Combine both datasets.
            combinedData = leData.concat(hleData);

            updateChart("Fiji");
        }).catch(function (error) {
            console.error("Error loading CSV data: ", error);
        });
    }
}]);
