fetch('/static/data/finalscatter_lowest_life_expectancy_male_filtered.csv')
.then(response => response.text())
.then(csvText => {
    const data = d3.csvParse(csvText, d => ({
        Location: d.Location,
        Period: +d.Period,
        FactValueNumeric: +d.FactValueNumeric
    }));
    
    const years = [...new Set(data.map(d => d.Period))].sort();
    const selectedCountries = [...new Set(data.map(d => d.Location))];
    
    const margin = { top: 40, right: 120, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    const svg = d3.select("#scatter-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
        
    const xScale = d3.scaleLinear()
        .domain([d3.min(years), d3.max(years)])
        .range([0, width]);
        
    const yScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.FactValueNumeric), d3.max(data, d => d.FactValueNumeric)])
        .range([height, 0]);
        
   
const themeColors = [
    'var(--vis-orange)',  // #E05515
    'var(--vis-green)',   // #019154
    'var(--vis-blue)',    // #20d0f3
    'var(--vis-purple)',  // #9C6ADE
    'var(--vis-yellow)',   // #FFB74D
];

const colorScale = d3.scaleOrdinal()
    .domain(selectedCountries)
    .range(themeColors); 

    
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale);
    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);
    
    svg.append("g").call(yAxis);
    
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .style("text-anchor", "middle")
        .text("Year");
    
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .style("text-anchor", "middle")
        .text("Life Expectancy (years)");
    
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "chart-tooltip")
        .style("opacity", 0);
    const slider = d3.select("#year-slider");
    const yearDisplay = d3.select("#year-display");
    
        slider.on("input", function() {
            const selectedYear = +this.value;
            yearDisplay.text(selectedYear);
            updateChart(selectedYear);
        });

    function updateChart(selectedYear) {
        // Filter data for selected year and remove null/undefined values
        const yearData = data.filter(d => 
            d.Period === selectedYear && 
            d.FactValueNumeric != null && 
            !isNaN(d.FactValueNumeric)
        );

        // Update color scale domain to only include countries with data for this year
        const availableCountries = yearData.map(d => d.Location);
        colorScale.domain(availableCountries);

        // Remove existing dots
        svg.selectAll(".dot").remove();
        
        // Create new dots only for countries with data
        svg.selectAll(".dot")
            .data(yearData, d => d.Location)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("r", 10) 
            .attr("cx", d => xScale(d.Period))
            .attr("cy", d => yScale(d.FactValueNumeric))
            .style("fill", d => colorScale(d.Location))
            .style("stroke", "var(--dark-gray)")
            .style("stroke-width", 1)
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 16); 
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`Country: ${d.Location}<br/>Year: ${d.Period}<br/>Life Expectancy: ${d.FactValueNumeric.toFixed(2)} years`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 10); 
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    }
    
    const initialYear = 2010;
    slider.attr("min", d3.min(years))
          .attr("max", d3.max(years))
          .attr("value", initialYear);
    
    yearDisplay.text(initialYear);
    updateChart(initialYear);
});