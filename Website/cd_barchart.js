function initStackedBarChart() {
    const margin = { top: 40, right: 150, bottom: 80, left: 80 }, // Increased bottom margin for x-axis label
          width = 900 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#barChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("ProcessedData/chronic_disease_admissions_mortality_2010_2020.csv").then(data => {
        data.forEach(d => {
            d.Hospital_Admissions = +d.Hospital_Admissions;
            d.Mortality_Rate = +d.Mortality_Rate;
        });

        const diseases = Array.from(new Set(data.map(d => d.Disease)));
        const years = [2010, 2015, 2020];

        const x0 = d3.scaleBand()
            .domain(years)
            .range([0, width])
            .padding(0.2);

        const x1 = d3.scaleBand()
            .domain(["Hospital_Admissions", "Mortality_Rate"])
            .range([0, x0.bandwidth()])
            .padding(0.05);

        let y = d3.scaleLinear()
            .domain([0, 700]) // Adjusted max to match your data's possible range
            .nice()
            .range([height, 0]);

        const color = d3.scaleOrdinal()
            .domain(diseases)
            .range(["#1f77b4", "#ff7f0e", "#d62728"]);

        // Add x-axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x0).tickValues(years).tickFormat(d3.format("d")))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Add y-axis
        let yAxis = svg.append("g").call(d3.axisLeft(y).ticks(10));

        // Tooltip for hover information
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "#f9f9f9")
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("border-radius", "4px")
            .style("font-size", "0.9em")
            .style("opacity", 0);

        // Prepare data for stacking
        const admissionsData = years.map(year => {
            const result = { year };
            diseases.forEach(disease => {
                const record = data.find(d => d.Year == year && d.Disease == disease);
                result[disease] = record ? record.Hospital_Admissions : 0;
            });
            return result;
        });

        const mortalityData = years.map(year => {
            const result = { year };
            diseases.forEach(disease => {
                const record = data.find(d => d.Year == year && d.Disease == disease);
                result[disease] = record ? record.Mortality_Rate : 0;
            });
            return result;
        });

        // Function to draw the full stacked chart or filter by disease
        function drawBars(filterDisease = null) {
            svg.selectAll(".bar-group").remove();  // Clear existing bars

            const filteredDiseases = filterDisease ? [filterDisease] : diseases;
            const maxY = d3.max(data.filter(d => !filterDisease || d.Disease === filterDisease), 
                                d => d.Hospital_Admissions + d.Mortality_Rate);
            
            y.domain([0, filterDisease ? maxY : 700]).nice();
            yAxis.transition().duration(500).call(d3.axisLeft(y).ticks(10));

            // Admissions stack
            const admissionsStack = d3.stack()
                .keys(filteredDiseases)(admissionsData);

            svg.selectAll(".admissions")
                .data(admissionsStack)
                .enter().append("g")
                .attr("class", "bar-group")
                .attr("fill", d => color(d.key))
                .selectAll("rect")
                .data(d => d.map(value => ({ ...value, key: d.key })))
                .enter().append("rect")
                .attr("x", d => x0(d.data.year) + x1("Hospital_Admissions"))
                .attr("y", d => y(d[1]))
                .attr("height", d => y(d[0]) - y(d[1]))
                .attr("width", x1.bandwidth())
                .on("mouseover", function(event, d) {
                    tooltip.style("visibility", "visible")
                        .html(`<strong>${d.key}</strong><br>Admissions: ${(d[1] - d[0]).toFixed(2)}`)
                        .transition()
                        .duration(200)
                        .style("opacity", 1);
                })
                .on("mousemove", function(event) {
                    tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
                })
                .on("mouseout", function() {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 0)
                        .on("end", () => tooltip.style("visibility", "hidden"));
                });

            // Mortality stack
            const mortalityStack = d3.stack()
                .keys(filteredDiseases)(mortalityData);

            svg.selectAll(".mortality")
                .data(mortalityStack)
                .enter().append("g")
                .attr("class", "bar-group")
                .attr("fill", d => color(d.key))
                .selectAll("rect")
                .data(d => d.map(value => ({ ...value, key: d.key })))
                .enter().append("rect")
                .attr("x", d => x0(d.data.year) + x1("Mortality_Rate"))
                .attr("y", d => y(d[1]))
                .attr("height", d => y(d[0]) - y(d[1]))
                .attr("width", x1.bandwidth())
                .on("mouseover", function(event, d) {
                    tooltip.style("visibility", "visible")
                        .html(`<strong>${d.key}</strong><br>Mortality: ${(d[1] - d[0]).toFixed(2)}`)
                        .transition()
                        .duration(200)
                        .style("opacity", 1);
                })
                .on("mousemove", function(event) {
                    tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
                })
                .on("mouseout", function() {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 0)
                        .on("end", () => tooltip.style("visibility", "hidden"));
                });
        }

        // Create Filter Buttons
        const buttonContainer = d3.select("#barChart").append("div").attr("class", "button-container");
        buttonContainer.append("button")
            .text("Show All")
            .attr("class", "filter-button")
            .on("click", () => drawBars());

        diseases.forEach(disease => {
            buttonContainer.append("button")
                .text(disease)
                .attr("class", "filter-button")
                .on("click", () => drawBars(disease));
        });

        // Initial draw with all diseases stacked
        drawBars(); // Initial call to render all data

        // Legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width + 20}, 20)`);

        diseases.forEach((disease, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 25})`);

            legendRow.append("rect")
                .attr("width", 18)
                .attr("height", 18)
                .attr("fill", color(disease));

            legendRow.append("text")
                .attr("x", 25)
                .attr("y", 14)
                .style("font-size", "12px")
                .style("text-anchor", "start")
                .text(disease);
        });

        // Add x-axis label
        svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 20)  // Position label within bottom margin
            .style("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Year");

        // Add y-axis label
        svg.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 20)  // Position label within left margin
            .style("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Average");

    }).catch(error => console.error("Error loading or processing data:", error));
}
