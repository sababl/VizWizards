
        const margin = { top: 20, right: 30, bottom: 60, left: 60 };
        const width = +d3.select("svg").attr("width") - margin.left - margin.right;
        const height = +d3.select("svg").attr("height") - margin.top - margin.bottom;

        const svg = d3.select("svg")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        d3.csv('average_emissions_2001_2010.csv').then(averageData => {
            averageData = averageData.slice(0, 20);
            averageData.forEach(d => {

                d["Average CO₂ emissions (2001-2010)"] = +d["Average CO₂ emissions (2001-2010)"];
            });
            
            // Set x and y scales
            const x = d3.scaleBand()
                .domain(averageData.map(d => d.Entity))
                .range([0, width])
                .padding(0.1);

            const y = d3.scaleLinear()
                .domain([0, d3.max(averageData, d => d["Average CO₂ emissions (2001-2010)"])]).nice()
                .range([height, 0]);

            svg.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .selectAll("text")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end"); // Align text to the end 

            svg.append("g")
                .attr("class", "axis axis--y")
                .call(d3.axisLeft(y));

            // Create bars
            svg.selectAll(".bar")
                .data(averageData)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", d => x(d.Entity))
                .attr("y", d => y(d["Average CO₂ emissions (2001-2010)"]))
                .attr("width", x.bandwidth())
                .attr("height", d => height - y(d["Average CO₂ emissions (2001-2010)"]));
        });