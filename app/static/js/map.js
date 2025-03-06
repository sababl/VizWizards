// Assuming you've already included D3.js and topojson library in your HTML file
// and that you have access to a GeoJSON file representing world countries

document.addEventListener("DOMContentLoaded", function () {
  const width = 960;
  const height = 600;

  const svg = d3
    .select("#total-emissions")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    // .style("background", "#91C4F3FF"); // Adding a background color for better readability

  // Define two projections
  const mercatorProjection = d3
    .geoMercator()
    .scale(150)
    .translate([width / 2, height / 1.5]);

  const orthographicProjection = d3
    .geoOrthographic()
    .scale(250)
    .translate([width / 2, height / 2])
    .clipAngle(90);

  // Choose a projection
  let currentProjection = mercatorProjection;

  const path = d3.geoPath().projection(currentProjection);

  const colorScale = d3.scaleSequential(d3.interpolateReds).domain([0, 70]); // Adjust the domain to fit your data range

  // Tooltip setup
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Loading GeoJSON for world countries
  d3.json(
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
  ).then(function (geoData) {
    // Loading the CSV data
    d3.csv("/static/data/Alluvial_1996.csv").then(function (data) {
      const emissionsByCountry = {};
      let minEmission = Infinity;
      let maxEmission = -Infinity;

      data.forEach((d) => {
        if (d.Year == 1996) {
          const emission = +d["Annual CO₂ emissions"];
          emissionsByCountry[d.Code] = {
            emission: emission,
            country: d.Entity,
          };
          if (emission < minEmission) minEmission = emission;
          if (emission > maxEmission) maxEmission = emission;
        }
      });
      const colorScale = d3
        .scaleSequential(d3.interpolateReds)
        .domain([minEmission, maxEmission]); // Set the domain based on the data

      svg
        .selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", (d) => {
          const countryCode = d.id;
          const emissionData = emissionsByCountry[countryCode];
          return emissionData ? colorScale(emissionData.emission) : "#ccc"; // Grey color for missing data
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", function (event, d) {
          const countryCode = d.id;
          const emissionData = emissionsByCountry[countryCode];
          if (emissionData) {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip
              .html(
                `<strong>${emissionData.country}</strong><br>Emissions: ${emissionData.emission} tons`
              )
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 28 + "px");
          }
        })
        .on("mousemove", function (event) {
          tooltip
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 28 + "px");
        })
        .on("mouseout", function () {
          tooltip.transition().duration(500).style("opacity", 0);
        });

      // Adding a color legend
      const legendWidth = 700;
      const legendHeight = 20;

      const legendSvg = svg
        .append("g")
        .attr(
          "transform",
          `translate(${width - legendWidth - 50}, ${height - 50})`
        );
      // console.log(minEmission, maxEmission);
      const legendScale = d3
        .scaleLinear()
        .domain([minEmission / 1000000000, maxEmission/ 1000000000]) // Use dynamic domain from data
        .range([0, legendWidth]);

      const legendAxis = d3
        .axisBottom(legendScale)
        .ticks(5)
        .tickFormat(d3.format(".2f"));

      const defs = legendSvg.append("defs");

      const linearGradient = defs
        .append("linearGradient")
        .attr("id", "linear-gradient");

      linearGradient
        .selectAll("stop")
        .data(
          colorScale.ticks().map((t, i, n) => ({
            offset: `${(100 * i) / n.length}%`,
            color: colorScale(t),
          }))
        )
        .enter()
        .append("stop")
        .attr("offset", (d) => d.offset)
        .attr("stop-color", (d) => d.color);

      legendSvg
        .append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#linear-gradient)");

      legendSvg
        .append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis);
    });
  });

  // Add a button to switch between projections
  d3.select("#switch-button")
    .append("button")
    .text("Switch Projection")
    .on("click", function () {
      currentProjection =
        currentProjection === mercatorProjection
          ? orthographicProjection
          : mercatorProjection;
      path.projection(currentProjection);

      svg.selectAll("path").transition().duration(1000).attr("d", path);
    });
  // Drag to rotate
  const drag = d3
    .drag()
    .on("start", function (event) {
      this.oldRotation = currentProjection.rotate();
    })
    .on("drag", function (event) {
      const rotate = currentProjection.rotate();
      const newRotate = [rotate[0] + event.dx / 4, rotate[1] - event.dy / 4];
      currentProjection.rotate(newRotate);
      svg.selectAll("path").attr("d", path);
    });

  svg.call(drag);
});
