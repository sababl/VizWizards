// Set dimensions for the chart to ensure full visibility at 100% zoom
const margin = {top: 20, right: 50, bottom: 50, left: 60};
const width = Math.min(1100, window.innerWidth - margin.left - margin.right);
const height = Math.min(600, window.innerHeight - margin.top - margin.bottom);

const svg = d3.select("#alluvial-chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// ✅ Load data from JSON file
d3.json("../static/data/life_expectancy.json").then(function(data) {
    
    console.log("✅ Data Loaded Successfully:", data);

    if (!data || data.length === 0) {
        throw new Error("❌ Data is empty!");
    }

    // ✅ Filter data to get highest and lowest Life Expectancy per continent
    let filteredData = [];
    let continents = Array.from(new Set(data.map(d => d.ParentLocation)));

    continents.forEach(continent => {
        let continentData = data.filter(d => d.ParentLocation === continent);
        let highestLE = continentData.reduce((prev, curr) => (curr.LifeExpectancy > prev.LifeExpectancy ? curr : prev), continentData[0]);
        let lowestLE = continentData.reduce((prev, curr) => (curr.LifeExpectancy < prev.LifeExpectancy ? curr : prev), continentData[0]);
        filteredData.push(highestLE, lowestLE);
    });

    console.log("✅ Filtered Data:", filteredData);

    // ✅ Extract all unique countries
    let nodes = [];
    let links = [];
    let nodeMap = {};

    // Define color scale for different countries
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    filteredData.forEach((d, i) => {
        let countryNode = { name: d.Location, color: colorScale(i) };
        let lifeExpNode = { name: "LE(years)", color: "#bcbd22" };
        let healthyExpNode = { name: "HLE(years)", color: "#17becf" };

        if (!nodeMap[d.Location]) {
            nodeMap[d.Location] = nodes.length;
            nodes.push(countryNode);
        }
        if (!nodeMap["LE(years)"]) {
            nodeMap["LE(years)"] = nodes.length;
            nodes.push(lifeExpNode);
        }
        if (!nodeMap["HLE(years)"]) {
            nodeMap["HLE(years)"] = nodes.length;
            nodes.push(healthyExpNode);
        }

        links.push({
            source: nodeMap[d.Location],
            target: nodeMap["LE(years)"],
            value: d.LifeExpectancy
        });

        links.push({
            source: nodeMap["LE(years)"],
            target: nodeMap["HLE(years)"],
            value: d.HealthyLifeExpectancy
        });
    });

    console.log("✅ Nodes:", nodes);
    console.log("✅ Links:", links);

    // ✅ Initialize Sankey Layout
    const sankey = d3.sankey()
        .nodeWidth(30)
        .nodePadding(15)
        .size([width * 0.65, height * 0.65]);

    const graph = sankey({ nodes: nodes.map(d => Object.assign({}, d)), links: links });

    console.log("✅ Graph Generated:", graph);

    // ✅ Draw Links (Flows)
    svg.append("g")
        .selectAll(".link")
        .data(graph.links)
        .enter().append("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .style("stroke-width", d => Math.max(1, d.width))
        .style("fill", "none")
        .style("stroke", "rgba(150, 150, 150, 0.5)")
        .style("opacity", 0.6);

    console.log("✅ Links drawn.");

    // ✅ Draw Nodes
    const node = svg.append("g")
        .selectAll(".node")
        .data(graph.nodes)
        .enter().append("g");

    node.append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => d.color);

    node.append("text")
        .attr("x", d => d.x1 + 10)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .text(d => d.name)
        .style("font-size", "10px")
        .style("font-weight", "bold");

    console.log("✅ Alluvial plot should be visible now.");
}).catch(error => {
    console.error("❌ Error loading the data:", error);
});
