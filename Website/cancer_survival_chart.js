function initChart() {
    d3.csv("ProcessedData/cancer_survival_data.csv").then(data => {
        data.forEach(d => {
            d.year = +d.year;
            d.survivalRate = +d.survivalRate;
        });

        const margin = { top: 120, right: 50, bottom: 100, left: 90 },
            width = 450 - margin.left - margin.right,
            height = 350 - margin.top - margin.bottom;

        const countries = Array.from(new Set(data.map(d => d.country)));
        const cancerTypes = Array.from(new Set(data.map(d => d.cancerType)));

        const countryDropdown = d3.select("#countryFilter");
        countries.forEach(country => {
            countryDropdown.append("option").attr("value", country).text(country);
        });

        const svg = d3.select("#cancerSurvivalSvg")
            .attr("width", (width + margin.left + margin.right) * 4)
            .attr("height", (height + margin.top + margin.bottom) * Math.ceil(countries.length / 4) + margin.top)
            .style("border", "2px solid #333")
            .style("background-color", "#ffffff");

        // Centered legend at the top
        const legend = svg.append("g")
            .attr("transform", `translate(${(svg.attr("width") - (cancerTypes.length * 150)) / 2}, ${margin.top / 2})`);

        cancerTypes.forEach((type, index) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(${index * 150}, 0)`);

            legendRow.append("rect")
                .attr("width", 12)
                .attr("height", 12)
                .attr("fill", d3.schemeCategory10[index])
                .attr("stroke", "#333")
                .attr("stroke-width", 0.5);

            legendRow.append("text")
                .attr("x", 25)
                .attr("y", 10)
                .attr("text-anchor", "start")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .text(type);
        });

        const x = d3.scaleLinear()
            .domain([2000, 2015])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.survivalRate)]).nice()
            .range([height, 0]);

        const color = d3.scaleOrdinal()
            .domain(cancerTypes)
            .range(d3.schemeCategory10);

        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.survivalRate));

        function updateChart(selectedCountry) {
            svg.selectAll("g.chart").remove();

            const filteredCountries = selectedCountry === "all" ? countries : [selectedCountry];
            const rows = Math.ceil(filteredCountries.length / 4);
            svg.attr("height", (height + margin.top + margin.bottom) * rows + margin.top);

            filteredCountries.forEach((country, i) => {
                const countryData = data.filter(d => d.country === country);

                // Adjust dimensions if only one chart is selected
                let currentWidth = width;
                let currentHeight = height;
                if (filteredCountries.length === 1) {
                    currentWidth = width * 1.5;
                    currentHeight = height * 1.5;
                }

                const x = d3.scaleLinear()
                    .domain([2000, 2015])
                    .range([0, currentWidth]);

                const y = d3.scaleLinear()
                    .domain([0, d3.max(data, d => d.survivalRate)]).nice()
                    .range([currentHeight, 0]);

                // Center the chart if there's only one country selected
                const centerX = filteredCountries.length === 1
                    ? (svg.attr("width") - currentWidth) / 2
                    : (i % 4) * (width + margin.left + margin.right) + margin.left;
                const centerY = Math.floor(i / 4) * (height + margin.top + margin.bottom) + margin.top;

                const g = svg.append("g")
                    .attr("class", "chart")
                    .attr("transform", `translate(${centerX}, ${centerY})`)
                    .style("background-color", "#f9f9f9");

                // Add x-axis
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

                // Add y-axis
                g.append("g")
                    .call(d3.axisLeft(y).ticks(10))
                    .selectAll("text")
                    .style("font-size", "12px")
                    .style("font-weight", "bold");

                // Add lines and circles for each cancer type
                cancerTypes.forEach(type => {
                    const typeData = countryData.filter(d => d.cancerType === type);

                    g.append("path")
                        .datum(typeData)
                        .attr("fill", "none")
                        .attr("stroke", color(type))
                        .attr("stroke-width", 1.5)
                        .attr("d", line);
                });

                // Add country label at the top of each chart
                g.append("text")
                    .attr("x", currentWidth / 2)
                    .attr("y", -15)
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .style("font-weight", "bold")
                    .text(country);

                // Add x-axis label
                g.append("text")
                    .attr("transform", `translate(${currentWidth / 2}, ${currentHeight + 40})`)
                    .style("text-anchor", "middle")
                    .style("font-size", "14px")
                    .style("font-weight", "bold")
                    .text("Year");

                // Add y-axis label
                g.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -70)
                    .attr("x", -currentHeight / 2)
                    .style("text-anchor", "middle")
                    .style("font-size", "14px")
                    .style("font-weight", "bold")
                    .text("Survival Rate (%)");
            });
        }

        updateChart("all");

        countryDropdown.on("change", function () {
            const selectedCountry = d3.select(this).property("value");
            updateChart(selectedCountry);
        });
    });
}
