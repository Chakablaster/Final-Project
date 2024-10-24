window.onload = init;

function init() {
    // Select the SVG element and set its dimensions
    const svg = d3.select("svg");
    const width = svg.attr("width");
    const height = svg.attr("height");

    // Define the projection for the map
    const projection = d3.geoMercator()
        .scale(130)
        .translate([width / 2, height / 1.5]);

    // Define the path generator for drawing the map
    const path = d3.geoPath().projection(projection);

    // Create a color scale for hospital admissions
    const colorScale = d3.scaleSequential(d3.interpolateBlues);

    // Tooltip for displaying information on hover
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Add a legend
    const legendSvg = d3.select("#legend svg");

    // Load the GeoJSON world map data once and reuse it
    let geoData;
    d3.json("world.geojson").then(json => {
        geoData = json;
        updateMap('asthma');  // Load asthma data by default
    });

    // Function to draw the map with the given dataset
    function drawMap(data, disease) {
        const dataMap = {};
        data.forEach(d => {
            dataMap[d.REF_AREA] = +d.OBS_VALUE;  // Map country code to observation value (hospital admissions)
        });

        // Set the domain of the color scale based on the data
        colorScale.domain([0, d3.max(data, d => +d.OBS_VALUE)]);

        // Draw the map
        svg.selectAll("path")
            .data(geoData.features)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                const value = dataMap[d.id]; // Match the country code
                return value ? colorScale(value) : "#ccc"; // Default to gray for no data
            })
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 0.5)
            .on("mouseover", function (event, d) {
                const value = dataMap[d.id];
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`<strong>${d.properties.name}</strong><br>${disease} Hospital Admissions: ${value || "No data"}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                tooltip.transition().duration(500).style("opacity", 0);
            });

        // Draw the updated discrete legend
        drawLegend(colorScale);
    }

    // Function to update the map when switching datasets
    window.updateMap = function (disease) {
        const dataFile = `ProcessedData/${disease}2020.csv`;  // Path to different disease datasets
        console.log("Loading data from:", dataFile);

        d3.csv(dataFile).then(data => {
            console.log("Data loaded:", data);
            drawMap(data, disease.charAt(0).toUpperCase() + disease.slice(1));  // Capitalize first letter for display
        }).catch(error => {
            console.error("Error loading data:", error);
        });
    };

    // Function to draw the discrete color legend
    function drawLegend(colorScale) {
        // Define the ranges or categories for the legend (you can adjust these based on your data)
        const legendData = [
            { color: colorScale(0.2), label: '0 - 20 per 100,000' },
            { color: colorScale(0.4), label: '21 - 40 per 100,000' },
            { color: colorScale(0.6), label: '41 - 60 per 100,000' },
            { color: colorScale(0.8), label: '61 - 80 per 100,000' },
            { color: colorScale(1), label: '81+ per 100,000' }
        ];

        // Clear any existing legend elements
        legendSvg.selectAll("*").remove();

        // Create a group for each legend entry
        const legendGroup = legendSvg.selectAll(".legend-entry")
            .data(legendData)
            .enter().append("g")
            .attr("class", "legend-entry")
            .attr("transform", (d, i) => `translate(0, ${i * 25})`);  // Adjust spacing between entries

        // Append colored rectangles
        legendGroup.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", d => d.color);

        // Append labels next to the rectangles
        legendGroup.append("text")
            .attr("x", 30)
            .attr("y", 15)
            .text(d => d.label)
            .style("font-size", "12px")
            .style("fill", "#000");  // Adjust text color
    }
}
