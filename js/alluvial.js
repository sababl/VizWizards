// Set up the SVG container
const width = 960, height = 500;
const svg = d3.select("#alluvial-chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Path to your merged dataset
const dataPath = "C:/Users/studente/Documents/unige/VizWizards/data/Alluvial.csv"; // Adjust this path based on your setup

// Check if the file is being located
console.log("Data file path:", dataPath);

d3.csv(dataPath)
  .then(data => {
    console.log("Data loaded successfully:", data);
    console.log("Merged Data Loaded:", data); // Debugging to check the loaded data

  // Prepare data for the Sankey chart
  const sankeyData = [];
  data.forEach(d => {
    // Add flows from Continent to Country
    sankeyData.push({
      source: d.Continent, // Continent column
      target: d.Country,   // Country column
      value: +d["Annual CO₂ emissions"] // Total emissions column
    });

    // Add flows from Country to Fossil/Land
    sankeyData.push({
      source: d.Country, // Country column
      target: "Fossil",  // Example: Fossil emissions
      value: +d["Annual CO₂ emissions from fossil fuels"]
    });

    sankeyData.push({
      source: d.Country, // Country column
      target: "Land",    // Example: Land-use emissions
      value: +d["Annual CO₂ emissions from land-use change"]
    });
  });

  console.log("Sankey Data Prepared:", sankeyData); // Debugging

  // Create nodes and links for the Sankey diagram
  const nodes = Array.from(
    new Set(sankeyData.flatMap(d => [d.source, d.target])),
    name => ({ name })
  );

  const links = sankeyData.map(d => ({
    source: nodes.findIndex(n => n.name === d.source),
    target: nodes.findIndex(n => n.name === d.target),
    value: d.value
  }));

  console.log("Nodes:", nodes);
  console.log("Links:", links);

  // Create a Sankey layout
  const sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .extent([[1, 1], [width - 1, height - 6]]);

  sankey({
    nodes,
    links
  });

  // Draw nodes
  svg.append("g")
    .selectAll("rect")
    .data(nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", "steelblue")
    .attr("stroke", "#000");

  // Draw links
  svg.append("g")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", "gray")
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5);

  // Add node labels
  svg.append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    .text(d => d.name)
    .style("font-size", "12px");
}).catch(error => {
  console.error("Error loading data:", error);
  })
  .catch(error => {
    console.error("Error loading data:", error);
  });

// Load the merged dataset
d3.csv(dataPath).then(data => {
  console.log("Merged Data Loaded:", data); // Debugging to check the loaded data

  // Prepare data for the Sankey chart
  const sankeyData = [];
  data.forEach(d => {
    // Add flows from Continent to Country
    sankeyData.push({
      source: d.Continent, // Continent column
      target: d.Country,   // Country column
      value: +d["Annual CO₂ emissions"] // Total emissions column
    });

    // Add flows from Country to Fossil/Land
    sankeyData.push({
      source: d.Country, // Country column
      target: "Fossil",  // Example: Fossil emissions
      value: +d["Annual CO₂ emissions from fossil fuels"]
    });

    sankeyData.push({
      source: d.Country, // Country column
      target: "Land",    // Example: Land-use emissions
      value: +d["Annual CO₂ emissions from land-use change"]
    });
  });

  console.log("Sankey Data Prepared:", sankeyData); // Debugging

  // Create nodes and links for the Sankey diagram
  const nodes = Array.from(
    new Set(sankeyData.flatMap(d => [d.source, d.target])),
    name => ({ name })
  );

  const links = sankeyData.map(d => ({
    source: nodes.findIndex(n => n.name === d.source),
    target: nodes.findIndex(n => n.name === d.target),
    value: d.value
  }));

  console.log("Nodes:", nodes);
  console.log("Links:", links);

  // Create a Sankey layout
  const sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .extent([[1, 1], [width - 1, height - 6]]);

  sankey({
    nodes,
    links
  });

  // Draw nodes
  svg.append("g")
    .selectAll("rect")
    .data(nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", "steelblue")
    .attr("stroke", "#000");

  // Draw links
  svg.append("g")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", "gray")
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5);

  // Add node labels
  svg.append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    .text(d => d.name)
    .style("font-size", "12px");
}).catch(error => {
  console.error("Error loading data:", error);
});
