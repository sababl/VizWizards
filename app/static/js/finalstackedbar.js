d3.csv("/static/data/bar-hle_avg_filtered.csv").then(function (data) {
    const margin = { top: 50, right: 70, bottom: 120, left: 100 }, // Increased bottom margin
        width = 900 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    const svg = d3.select("#bar-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    data.forEach(d => {
        d.Period = +d.Period;
        d.FactValueNumeric = +d.FactValueNumeric;
    });

    const years = Array.from(new Set(data.map(d => d.Period))).sort();
    const dropdown = d3.select("#year");
    dropdown.selectAll("option")
        .data(years)
        .enter().append("option")
        .text(d => d)
        .attr("value", d => d);

    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .range([height, 0]);

    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`);
    const yAxis = svg.append("g");
    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -60)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("class", "axis-label")
        .text("Years");

    const colorScale = d3.scaleOrdinal()
        .domain(["Africa", "Eastern Mediterranean", "Western Pacific", "Americas", "South-East Asia", "Europe"])
        .range(["#143642", "#741C28", "#877765", "#E7DECD", "#A1A8BE", "#BB8C94"]);

    const tooltip = d3.select("body").append("div")
        .attr("class", "chart-tooltip")
        .style("opacity", 0);

    function update(year) {
        const filteredData = data.filter(d => d.Period === year);

        x.domain(filteredData.map(d => d.ParentLocation));
        y.domain([0, d3.max(filteredData, d => d.FactValueNumeric)]);

        xAxis.call(d3.axisBottom(x).tickSize(0))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .attr("y", 20)        // Increased y offset
            .attr("x", -8)      
            .style("text-anchor", "end")
            .style("font-size", "12px");

        yAxis.call(d3.axisLeft(y));

        const bars = svg.selectAll(".bar")
            .data(filteredData, d => d.ParentLocation);


        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.ParentLocation))
            .attr("y", d => y(d.FactValueNumeric))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.FactValueNumeric))
            .attr("fill", d => colorScale(d.ParentLocation))
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                tooltip.html(`Value: ${d.FactValueNumeric.toFixed(1)} years`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });


        // Update selection (for existing bars)
        bars.merge(bars)
            .transition()
            .duration(500)
            .attr("x", d => x(d.ParentLocation))
            .attr("y", d => y(d.FactValueNumeric))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.FactValueNumeric))
            .attr("fill", d => colorScale(d.ParentLocation));

        bars.exit().remove();

        // Add padding to the bottom of the chart container
        d3.select("#bar-chart-container")
            .style("padding-bottom", "40px");
    }

    dropdown.on("change", function () {
        update(+this.value);
    });

    update(years[0]);
});