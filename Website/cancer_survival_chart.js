function initChart() {
    // Load the CSV data
    d3.csv("ProcessedData/cancer_survival_data.csv").then(data => {
        // Parse the data
        data.forEach(d => {
            d.year = +d.year;
            d.survivalRate = +d.survivalRate;
        });

        // Set up chart dimensions and margin
        const margin = { top: 120, right: 50, bottom: 100, left: 90 };
        const width = 450 - margin.left - margin.right;
        const height = 350 - margin.top - margin.bottom;

        // Get list of unique countries and cancer types
        const countries = Array.from(new Set(data.map(d => d.country)));
        const cancerTypes = Array.from(new Set(data.map(d => d.cancerType)));

        // Populate dropdown for country selection
        const countryDropdown = d3.select("#countryFilter");
        countries.forEach(country => {
            countryDropdown.append("option").attr("value", country).text(country);
        });

        // Create SVG element for the chart
        const svg = d3.select("#cancerSurvivalSvg")
            .style("border", "2px solid #333")
            .style("background-color", "#ffffff");

        // Set up the x and y scales for the chart
        const x = d3.scaleLinear().domain([2000, 2015]).range([0, width]);
        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.survivalRate)]).nice()
            .range([height, 0]);

        // Color scale for cancer types
        const color = d3.scaleOrdinal()
            .domain(cancerTypes)
            .range(d3.schemeCategory10);

        // Line generator for chart lines
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.survivalRate));

        // Update chart based on the selected country
        function updateChart(selectedCountry) {
            // Remove previous chart elements
            svg.selectAll("g.chart").remove();

            // Filter countries based on selection
            const filteredCountries = selectedCountry === "all" ? countries : [selectedCountry];

            // Calculate dynamic width and height
            const dynamicWidth = selectedCountry === "all" ? (width + margin.left + margin.right) * 4 : width * 1.5;
            const dynamicHeight = selectedCountry === "all" ? (height + margin.top + margin.bottom) * Math.ceil(filteredCountries.length / 4) + margin.top : height * 1.5 + margin.top + margin.bottom;

            // Adjust SVG dimensions
            svg.attr("width", dynamicWidth).attr("height", dynamicHeight);

            // Loop over each country and render the charts
            filteredCountries.forEach((country, i) => {
                const countryData = data.filter(d => d.country === country);

                let currentWidth = width;
                let currentHeight = height;

                if (filteredCountries.length === 1) {
                    currentWidth = width * 1.5;
                    currentHeight = height * 1.5;
                }

                const x = d3.scaleLinear().domain([2000, 2015]).range([0, currentWidth]);
                const y = d3.scaleLinear()
                    .domain([0, d3.max(data, d => d.survivalRate)]).nice()
                    .range([currentHeight, 0]);

                const centerX = filteredCountries.length === 1
                    ? (dynamicWidth - currentWidth) / 2
                    : (i % 4) * (width + margin.left + margin.right) + margin.left;
                const centerY = Math.floor(i / 4) * (height + margin.top + margin.bottom) + margin.top;

                const g = svg.append("g")
                    .attr("class", "chart")
                    .attr("transform", `translate(${centerX}, ${centerY})`)
                    .style("background-color", "#f9f9f9");

                // Create the x and y axis
                g.append("g")
                    .attr("transform", `translate(0,${currentHeight})`)
                    .call(d3.axisBottom(x).ticks(4).tickFormat(d3.format("d")))
                    .selectAll("text")
                    .style("text-anchor", "end")
                    .style("font-size", "12px")
                    .style("font-weight", "bold")
                    .attr("dx", "-.8em")
                    .attr("dy", ".15em")
                    .attr("transform", "rotate(-45)");

                g.append("g")
                    .call(d3.axisLeft(y).ticks(10))
                    .selectAll("text")
                    .style("font-size", "12px")
                    .style("font-weight", "bold");

                // Render the lines for each cancer type
                cancerTypes.forEach(type => {
                    const typeData = countryData.filter(d => d.cancerType === type);

                    g.append("path")
                        .datum(typeData)
                        .attr("fill", "none")
                        .attr("stroke", color(type))
                        .attr("stroke-width", 1.5)
                        .attr("d", line);
                });

                // Add country name as the chart title
                g.append("text")
                    .attr("x", currentWidth / 2)
                    .attr("y", -15)
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .style("font-weight", "bold")
                    .text(country);

                // Add labels for the x and y axes
                g.append("text")
                    .attr("transform", `translate(${currentWidth / 2}, ${currentHeight + 40})`)
                    .style("text-anchor", "middle")
                    .style("font-size", "14px")
                    .style("font-weight", "bold")
                    .text("Year");

                g.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -70)
                    .attr("x", -currentHeight / 2)
                    .style("text-anchor", "middle")
                    .style("font-size", "14px")
                    .style("font-weight", "bold")
                    .text("Survival Rate (%)");

                // Append legend inside SVG, centered at the top
                const legend = svg.append("g")
                    .attr("class", "legend")
                    .attr("transform", `translate(${(dynamicWidth - (cancerTypes.length * 100)) / 2}, 20)`);  // Center the legend horizontally

                cancerTypes.forEach((type, index) => {
                    const legendItem = legend.append("g")
                        .attr("transform", `translate(${index * 100}, 0)`);  // Space each item with 100px

                    // Legend color box
                    legendItem.append("rect")
                        .attr("width", 15)
                        .attr("height", 15)
                        .attr("fill", color(type))
                        .attr("y", 5);  // Center vertically

                    // Legend text
                    legendItem.append("text")
                        .attr("x", 20)
                        .attr("y", 17)
                        .attr("text-anchor", "start")
                        .style("font-size", "12px")
                        .text(type);
                });
                            
            });
        }

        // Initial chart load
        updateChart("all");

        // Update the chart when a new country is selected
        countryDropdown.on("change", function () {
            const selectedCountry = d3.select(this).property("value");
            updateChart(selectedCountry);
        });
    });
}
