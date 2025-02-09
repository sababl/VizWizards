// Load JSON data
d3.json("/static/data/top_10_co2_cleaned.json").then(function (data) {
    const margin = { top: 50, right: 50, bottom: 100, left: 200 };
    const size = 600 - margin.left - margin.right;

    const svg = d3.select("svg")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const countries = data.map(d => d.Entity);
    const emissionTypes = ["Total CO₂", "Land-use Change", "Fossil Fuels"];

    const maxEmission = d3.max(data, d => d["Annual CO₂ emissions including land-use change"]);
    const colorScale = d3.scaleSequential()
        .domain([maxEmission, 0])
        .interpolator(d3.interpolateRgb("#143642", "#A0C1B8"));

    const xScale = d3.scaleBand()
        .domain(emissionTypes)
        .range([0, size])
        .padding(0.1);

    const yScale = d3.scaleBand()
        .domain(countries)
        .range([0, size])
        .padding(0.1);

    const tooltip = d3.select(".tooltip");

    svg.selectAll("rect")
        .data(data.flatMap(d => [
            { country: d.Entity, type: "Total CO₂", value: d["Annual CO₂ emissions including land-use change"] },
            { country: d.Entity, type: "Land-use Change", value: d["Annual CO₂ emissions from land-use change"] },
            { country: d.Entity, type: "Fossil Fuels", value: d["Annual CO₂ emissions"] }
        ]))
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.type))
        .attr("y", d => yScale(d.country))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.value))
        .on("mouseover", function (event, d) {
            tooltip.style("display", "block")
                .html(`${d.country} - ${d.type}: ${d.value.toLocaleString()}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mousemove", function (event) {
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function () {
            tooltip.style("display", "none");
        });

    // X Axis
    svg.append("g")
        .attr("transform", `translate(0,${size})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Y Axis
    svg.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .attr("class", "axis-label");

    // Legend
    const legendScale = d3.scaleLinear()
        .domain([0, maxEmission])
        .range([0, 300]);

    const legendSvg = d3.select("#legend").append("svg").attr("width", 350).attr("height", 50);

    const legendGradient = legendSvg.append("defs").append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .selectAll("stop")
        .data([
            { offset: "0%", color: "#A0C1B8" },
            { offset: "100%", color: "#143642" }
        ])
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    legendSvg.append("rect")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", 300)
        .attr("height", 20)
        .style("fill", "url(#legend-gradient)");

    legendSvg.append("text").attr("x", 10).attr("y", 45).text("Low Emission");
    legendSvg.append("text").attr("x", 260).attr("y", 45).text("High Emission");
});
