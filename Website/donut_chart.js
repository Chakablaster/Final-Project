function initAllDonutCharts() {
    const width = 650, height = 650, radius = Math.min(width, height) / 2;

    // Initialize three donut charts with respective data files and units
    createDonutChart("alcoholChart", "avg_alcohol_consumption.csv", "Alcohol Consumption", "litres per person");
    createDonutChart("tobaccoChart", "avg_tobacco_consumption.csv", "Tobacco Consumption", "grammes per person");
    createDonutChart("obesityChart", "avg_obesity.csv", "Obesity Percentage", "percentage of population");

    function createDonutChart(chartId, csvFile, title, unit) {
        const minValue = 5; // Set a minimum value threshold for display

        const svg = d3.select(`#${chartId}`)
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const color = d3.scaleOrdinal(d3.schemeSet3);

        const arc = d3.arc()
            .innerRadius(radius - 150)
            .outerRadius(radius - 70);

        const arcHover = d3.arc()
            .innerRadius(radius - 150)
            .outerRadius(radius - 20); // Larger outer radius for a stronger zoom effect

        const pie = d3.pie()
            .sort(null)
            .value(d => d.value);

        // Central text for displaying details on hover
        const centerText = svg.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "-0.5em")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .text("Hover over an arc");

        const centerValue = svg.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "1.2em")
            .style("font-size", "18px")
            .style("fill", "#666");

        d3.csv(`ProcessedData/${csvFile}`).then(data => {
            // Filter out countries with values below the minimum threshold
            data = data.filter(d => +d.value >= minValue && d.value !== "");

            data.forEach(d => d.value = +d.value);
            renderChart(data);
        }).catch(error => {
            console.error("Error loading CSV:", error);
        });

        function renderChart(data) {
            const arcs = svg.selectAll(".arc").data(pie(data));

            const arcGroups = arcs.enter().append("g").attr("class", "arc");

            arcGroups.append("path")
                .attr("d", arc)
                .attr("fill", d => color(d.data.Country))
                .attr("stroke", "#fff")
                .attr("stroke-width", 1)
                .on("mouseover", function(event, d) {
                    d3.select(this)
                        .transition()
                        .duration(300)
                        .attr("d", arcHover) // Enlarge slice on hover
                        .attr("opacity", 0.85); // Reduce opacity for visual effect

                    const percentage = ((d.data.value / d3.sum(data, d => d.value)) * 100).toFixed(2);

                    // Update center text with country name, value, and unit
                    centerText.text(d.data.Country);
                    centerValue.text(`Value: ${d.data.value} ${unit} (${percentage}%)`);

                    // Increase text size on hover for label
                    d3.select(this.parentNode).select("text")
                        .transition()
                        .duration(300)
                        .style("font-size", "14px")
                        .style("font-weight", "bold");
                })
                .on("mouseout", function() {
                    d3.select(this)
                        .transition()
                        .duration(300)
                        .attr("d", arc) // Revert to original size
                        .attr("opacity", 1); // Reset opacity

                    // Reset center text and center value when mouse leaves
                    centerText.text("Hover over an arc");
                    centerValue.text("");  // Make sure this is properly reset

                    // Reset text size when mouse leaves
                    d3.select(this.parentNode).select("text")
                        .transition()
                        .duration(300)
                        .style("font-size", "10px")
                        .style("font-weight", "bold");
                });

            // Rotate text labels for readability and make them bold
            arcGroups.append("text")
                .attr("transform", function(d) {
                    const [x, y] = arc.centroid(d);
                    const angle = (d.startAngle + d.endAngle) / 2 * (180 / Math.PI) - 90;
                    return angle > 90 ? `translate(${x}, ${y}) rotate(${angle + 180})` : `translate(${x}, ${y}) rotate(${angle})`;
                })
                .attr("dy", "0.35em")
                .attr("text-anchor", "middle")
                .text(d => d.data.Country)
                .style("font-size", "10px")
                .style("fill", "#333")
                .style("font-weight", "bold")
                .style("user-select", "none"); // Prevent text selection
        }
    }
}
