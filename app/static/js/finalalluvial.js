console.log("D3 script loaded!");

// ✅ Load Data from JSON File
d3.json("../static/data/life_expectancy.json").then(function(data) {
    
    console.log("Data Loaded Successfully:", data);

    if (!data || data.length === 0) {
        throw new Error("Data is empty!");
    }

    // ✅ Verify individual elements
    console.log("First Data Entry:", data[0]);

    if (!data[0].Location || !data[0].LifeExpectancy || !data[0].HealthyLifeExpectancy) {
        throw new Error("Data format issue: Missing required fields.");
    }

    const margin = {top: 20, right: 30, bottom: 30, left: 200},
          width = 900 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // ✅ Convert Data into an Alluvial Format
    let nodes = [];
    let links = [];
    let nodeMap = {};

    data.forEach(d => {
        let leNode = { name: d.Location + "_LE", label: d.Location, category: "Life Expectancy", value: d.LifeExpectancy };
        let hleNode = { name: d.Location + "_HLE", label: d.Location, category: "Healthy Life Expectancy", value: d.HealthyLifeExpectancy };

        if (!nodeMap[leNode.name]) {
            nodeMap[leNode.name] = nodes.length;
            nodes.push(leNode);
        }
        if (!nodeMap[hleNode.name]) {
            nodeMap[hleNode.name] = nodes.length;
            nodes.push(hleNode);
        }

        links.push({
            source: nodeMap[leNode.name],
            target: nodeMap[hleNode.name],
            value: d.LifeExpectancy - d.HealthyLifeExpectancy
        });
    });

    // ✅ Initialize the Sankey Layout (Modified for Alluvial)
    const sankey = d3.sankey()
        .nodeWidth(30)  // Wider nodes for better flow visibility
        .nodePadding(15) // More space between nodes
        .size([width, height])
        .nodeAlign(d3.sankeyCenter); // Ensures nodes align properly

    const graph = sankey({ nodes: nodes.map(d => Object.assign({}, d)), links: links });

    // ✅ Draw Links (Flows)
    svg.append("g")
        .selectAll(".link")
        .data(graph.links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", "#69b3a2")
        .attr("stroke-opacity", 0.7)
        .attr("stroke-width", d => Math.max(1, d.value))
        .attr("fill", "none");

    // ✅ Draw Nodes
    const node = svg.append("g")
        .selectAll(".node")
        .data(graph.nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    node.append("rect")
        .attr("height", d => d.y1 - d.y0)
        .attr("width", sankey.nodeWidth())
        .attr("fill", d => d.category === "Life Expectancy" ? "steelblue" : "orange")
        .attr("stroke", "#000");

    // ✅ Add Node Labels
    node.append("text")
        .attr("x", d => (d.category === "Life Expectancy" ? -6 : 6))
        .attr("y", d => (d.y1 - d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => (d.category === "Life Expectancy" ? "end" : "start"))
        .text(d => d.label);

    console.log("Alluvial plot should be visible now.");

}).catch(error => {
    console.error("Error loading the data:", error);
});
