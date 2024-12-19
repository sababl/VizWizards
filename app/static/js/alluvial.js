// Set up the SVG container
const width = 960, height = 500;
const svg = d3.select("#alluvial-chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Load the dataset
const dataPath = "/static/data/Alluvial_1996.csv";
d3.csv(dataPath).then(data => {
  const sankeyData = [];

  // Filter data for the year 1996
  const filteredData = data.filter(d => +d.Year === 1996);

  // Prepare data with validation and aggregation
  const aggregatedData = d3.rollup(filteredData, v => {
    return {
      totalEmissions: d3.sum(v, d => +d["Annual CO₂ emissions"] || 0),
      fossilEmissions: d3.sum(v, d => +d["Annual CO₂ emissions from fossil fuels"] || 0),
      landEmissions: d3.sum(v, d => +d["Annual CO₂ emissions from land-use change"] || 0)
    };
  }, d => d.Continent, d => d.Entity);

  aggregatedData.forEach((countries, continent) => {
    countries.forEach((values, country) => {
      if (values.totalEmissions > 0) {
        sankeyData.push({ source: continent, target: country, value: values.totalEmissions });
      }
      if (values.fossilEmissions > 0) {
        sankeyData.push({ source: country, target: "Fossil", value: values.fossilEmissions });
      }
      if (values.landEmissions > 0) {
        sankeyData.push({ source: country, target: "Land", value: values.landEmissions });
      }
    });
  });

  // Create nodes and links
  const nodes = Array.from(new Set(sankeyData.flatMap(d => [d.source, d.target])), name => ({ name }));
  const links = sankeyData
    .map(d => {
      const sourceIndex = nodes.findIndex(n => n.name === d.source);
      const targetIndex = nodes.findIndex(n => n.name === d.target);
      return sourceIndex !== -1 && targetIndex !== -1
        ? { source: sourceIndex, target: targetIndex, value: d.value }
        : null;
    })
    .filter(link => link !== null);

  // Create Sankey layout
  const sankey = d3.sankey()
    .nodeWidth(15)
    .nodePadding(10)
    .extent([[1, 1], [width - 1, height - 6]]);

  try {
    sankey({ nodes, links });
  } catch (error) {
    console.error("Error creating Sankey layout:", error);
    return;
  }

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
