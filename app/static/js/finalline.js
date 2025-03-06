d3.csv("/static/data/finalline_females_life_expectancy.csv").then(function(data) {
    data.forEach(d => {
        d.Period = +d.Period;
        d.LifeExpectancy = +d.LifeExpectancy;
    });

    let countries = Array.from(new Set(data.map(d => d.Location)));
    let select = d3.select("#country-select");
    select.selectAll("option")
        .data(countries)
        .enter()
        .append("option")
        .text(d => d)
        .attr("value", d => d);

    let svg = d3.select("#line-chart"),
        margin = {top: 50, right: 50, bottom: 50, left: 50},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    let x = d3.scaleLinear().domain([2000, 2021]).range([0, width]);
    let y = d3.scaleLinear().range([height, 0]);

    let xAxis = d3.axisBottom(x).tickFormat(d3.format("d")).tickValues(d3.range(2000, 2022, 1));
    let yAxis = d3.axisLeft(y);

    g.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`).call(xAxis);
    g.append("g").attr("class", "y-axis").call(yAxis);
    
    g.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle")
        .text("Years");

    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .style("text-anchor", "middle")
        .text("Life Expectancy");

    let line = d3.line()
        .x(d => x(d.Period))
        .y(d => y(d.LifeExpectancy));

    let tooltip = d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("background", "lightgray")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("display", "none");

    function update(country) {
        let filteredData = data.filter(d => d.Location === country);
        y.domain([d3.min(filteredData, d => d.LifeExpectancy) - 1, d3.max(filteredData, d => d.LifeExpectancy) + 1]);
        g.select(".y-axis").transition().duration(1000).call(yAxis);

        let path = g.selectAll(".line").data([filteredData]);

        path.enter().append("path")
            .attr("class", "line")
            .merge(path)
            .transition().duration(1000)
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2);

        path.exit().remove();

        let circles = g.selectAll("circle").data(filteredData);

        circles.enter().append("circle")
            .merge(circles)
            .attr("cx", d => x(d.Period))
            .attr("cy", d => y(d.LifeExpectancy))
            .attr("r", 4)
            .attr("fill", "darkgreen")
            .on("mouseover", (event, d) => {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px")
                    .style("display", "block")
                    .html(`Year: ${d.Period} <br> Life Expectancy: ${d.LifeExpectancy.toFixed(1)}`);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", () => tooltip.style("display", "none"));

        circles.exit().remove();
    }

    select.on("change", function(event) {
        update(event.target.value);
    });

    update(countries[0]);
});
