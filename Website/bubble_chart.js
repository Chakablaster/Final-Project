function initBubbleChart() {
    const width = 800, height = 600;
    const svg = d3.select("#bubbleChartSvg")
        .attr("width", width)
        .attr("height", height)
        .style("border", "1px solid #ccc");

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("display", "none")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "5px")
        .style("font-size", "12px");

    const diseases = ["Asthma", "Cancer", "Diabetes", "Heart Diseases"]; // Corrected to match dataset naming
    let currentDisease = diseases[0]; // Default disease to display

    // Load the combined dataset
    d3.csv("ProcessedData/mortality_data.csv").then(data => {
        data.forEach(d => {
            d.mortalityRate = +d.mortalityRate; // Convert mortalityRate to a number
        });

        // Display initial data for the default disease
        updateChart(filterData(data, currentDisease));

        // Add clickable icons for disease filtering
        d3.select("#filterControls").selectAll(".disease-icon")
            .on("click", function(event) {
                const disease = this.textContent.trim(); // Ensure no extra spaces
                currentDisease = disease;

                // Log the selected disease and the filtered data
                console.log("Selected disease:", disease);
                console.log("Filtered data:", filterData(data, disease));

                // Update the active class and chart
                d3.selectAll(".disease-icon").classed("active", false);
                d3.select(this).classed("active", true);
                updateChart(filterData(data, disease));
            });

        // Function to filter data based on selected disease
        function filterData(data, disease) {
            const normalizedDisease = disease.trim().replace(/ /g, "_").toLowerCase(); // Normalize spaces to underscores
            return data.filter(d => d.disease.replace(/ /g, "_").toLowerCase() === normalizedDisease);
        }

        // Update chart with filtered data
        function updateChart(filteredData) {
            const color = d3.scaleOrdinal(d3.schemeCategory10);
        
            // Dynamically calculate the max mortality rate for the current disease
            const maxMortalityRate = d3.max(filteredData, d => d.mortalityRate);
        
            // Use dynamic domain to ensure bubble sizes scale properly for each disease
            const radiusScale = d3.scaleSqrt()
                .domain([0, maxMortalityRate])
                .range([8, 64]);
        
            // Adjust force settings based on disease type
            const isCancer = currentDisease === "Cancer";
            const xStrength = isCancer ? 0.2 : 0.05;
            const yStrength = isCancer ? 0.2 : 0.05;
            const collideRadius = isCancer ? d => radiusScale(d.mortalityRate) * 0.7 : d => radiusScale(d.mortalityRate) + 1;
        
            const simulation = d3.forceSimulation(filteredData)
                .force("x", d3.forceX(width / 2).strength(xStrength))
                .force("y", d3.forceY(height / 2).strength(yStrength))
                .force("collide", d3.forceCollide(collideRadius))
                .on("tick", ticked);
        
            function ticked() {
                const bubbles = svg.selectAll("circle")
                    .data(filteredData, d => d.country);
        
                bubbles.enter()
                    .append("circle")
                    .attr("r", d => radiusScale(d.mortalityRate))
                    .attr("fill", d => color(d.country))
                    .attr("stroke", "#333")
                    .attr("stroke-width", 1)
                    .merge(bubbles)
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                    .on("mouseover", function(event, d) {
                        d3.select(this).attr("stroke-width", 2);
                        tooltip.style("display", "inline-block")
                            .html(`<strong>${d.country}</strong><br>Mortality Rate: ${d.mortalityRate}`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("stroke-width", 1);
                        tooltip.style("display", "none");
                    });
        
                bubbles.exit().remove();
            }
        
            // Start the simulation
            simulation.alpha(1).restart();
        }        
    }).catch(error => console.error("Error loading data:", error));
}
