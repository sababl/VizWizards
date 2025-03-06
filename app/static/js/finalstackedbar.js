d3.csv("/static/data/bar-hle_avg_filtered.csv").then(function(data) {
  const margin = { top: 50, right: 70, bottom: 100, left: 100 },
      width = 900 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;

  const svg = d3.select("#bar-chart")
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

  const tooltip = d3.select(".tooltip");

  function update(year) {
      const filteredData = data.filter(d => d.Period === year);

      x.domain(filteredData.map(d => d.ParentLocation));
      y.domain([0, d3.max(filteredData, d => d.FactValueNumeric)]);

      xAxis.call(d3.axisBottom(x).tickSize(0))
          .selectAll("text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end");

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
                  .on("mouseover", (event, d) => {
                      tooltip.style("visibility", "visible")
                          .html(`${d.ParentLocation}<br>Value: ${d.FactValueNumeric.toFixed(2)}`)
                          .style("left", (event.pageX + 10) + "px")
                          .style("top", (event.pageY - 50) + "px");
                  })
                  .on("mouseout", () => tooltip.style("visibility", "hidden"));


              // Update selection (for existing bars)
              bars.merge(bars) // Merge enter and update selections
                  .transition()
                  .duration(500)
                  .attr("x", d => x(d.ParentLocation))
                  .attr("y", d => y(d.FactValueNumeric))
                  .attr("width", x.bandwidth())
                  .attr("height", d => height - y(d.FactValueNumeric))
                  .attr("fill", d => colorScale(d.ParentLocation));

              bars.exit().remove();
          }

  dropdown.on("change", function () {
      update(+this.value);
  });

  update(years[0]);
});