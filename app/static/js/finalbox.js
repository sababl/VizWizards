d3.csv("/static/data/box_life_expectancy_by_region.csv").then(data => {
    data.forEach(d => {
        d.AverageLifeExpectancy = +d.AverageLifeExpectancy;
      });
      const regionColors = {
        "Africa": "#143642",
        "Eastern Mediterranean": "#741C28",
        "Western Pacific": "#877765",
        "Americas": "#E7DECD",
        "South-East Asia": "#A1A8BE",
        "Europe": "#BB8C94"
    };

      // Get the width of the parent container
      const container = d3.select("#box-chart").node().parentNode;
      const containerWidth = container.getBoundingClientRect().width;
    
      // You can pick a fixed height or a ratio:
      const margin = { top: 30, right: 50, bottom: 50, left: 50 };
      const svgWidth = containerWidth;
      const svgHeight = 400; // or something dynamic
    
      const width = svgWidth - margin.left - margin.right;
      const height = svgHeight - margin.top - margin.bottom;
    
      const svg = d3.select("#box-chart")
        .attr("width", svgWidth)
        .attr("height", svgHeight);
    
      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
      // Define scales
      const x = d3.scaleBand()
        .domain(data.map(d => d.Region))
        .range([0, width])
        .padding(0.4);
    
      const y = d3.scaleLinear()
        .domain([50, d3.max(data, d => d.AverageLifeExpectancy) + 5])
        .range([height, 0]);
    
    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    g.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Regions");

    g.append("text")
        .attr("class", "y-axis-label")  
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", - 30) 
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        
        .text("Life Expectancy (years)");  


    const tooltip = d3.select("#tooltip");

    data.forEach(d => {
        const q1 = d.AverageLifeExpectancy - 3;
        const median = d.AverageLifeExpectancy;
        const q3 = d.AverageLifeExpectancy + 3;
        const min = Math.max(50, q1 - 5);
        const max = q3 + 5;
        const boxWidth = x.bandwidth();

        g.append("line")
            .attr("x1", x(d.Region) + boxWidth / 2)
            .attr("x2", x(d.Region) + boxWidth / 2)
            .attr("y1", y(min))
            .attr("y2", y(max))
            .attr("class", "whisker");

        g.append("rect")
            .attr("x", x(d.Region))
            .attr("y", y(q3))
            .attr("height", y(q1) - y(q3))
            .attr("width", boxWidth)
            .attr("fill", regionColors[d.Region] || "#000")
            .on("mouseover", function(event) {
                tooltip.style("display", "block").html(
                    `<strong>${d.Region}</strong><br>` +
                    `Min: ${min.toFixed(2)}<br>` +
                    `Q1: ${q1.toFixed(2)}<br>` +
                    `Median: ${median.toFixed(2)}<br>` +
                    `Q3: ${q3.toFixed(2)}<br>` +
                    `Max: ${max.toFixed(2)}`
                );
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                       .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("display", "none");
            });

        g.append("line")
            .attr("x1", x(d.Region))
            .attr("x2", x(d.Region) + boxWidth)
            .attr("y1", y(median))
            .attr("y2", y(median))
            .attr("class", "median");
    });
});