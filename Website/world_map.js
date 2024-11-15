// Removed `window.onload = init;`

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

    // Create a color scale for hospital admissions (manual thresholds)
    const colorScale = d3.scaleThreshold()
        .domain([20, 40, 60, 80])
        .range(['#d4e4f4', '#8fb8e6', '#4b93d6', '#1f6abf', '#0b417a']);

    // Tooltip for displaying information on hover
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Add a legend
    const legendSvg = d3.select("#legend svg");

    // Variable to track the currently zoomed-in country
    let currentZoomedCountry = null;

    // Load the GeoJSON world map data once and reuse it
    let geoData;
    d3.json("https://raw.githubusercontent.com/Chakablaster/Final-Project/refs/heads/main/Website/world.geojson").then(json => {
        geoData = json;
        updateMap('asthma');  // Load asthma data by default
    });

    // Function to draw the map with the given dataset
    function drawMap(data, disease) {
        const dataMap = {};
        data.forEach(d => {
            dataMap[d.REF_AREA] = +d.OBS_VALUE;  // Map country code to observation value (hospital admissions)
        });

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
                tooltip.transition().duration(200).style("opacity", 0.9);
                tooltip.html(`<strong>${d.properties.name}</strong><br>${disease} Hospital Admissions: ${value || "No data"}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                tooltip.transition().duration(500).style("opacity", 0);
            })
            .on("click", function (event, d) {
                if (currentZoomedCountry === d) {
                    zoomOut();
                    currentZoomedCountry = null; // Reset the zoom state
                } else {
                    zoomToCountry(d);
                    currentZoomedCountry = d;
                }
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
        const legendData = [
            { label: '0 - 20 per 100,000', color: colorScale(10), thresholdMin: 0, thresholdMax: 20 },
            { label: '21 - 40 per 100,000', color: colorScale(30), thresholdMin: 21, thresholdMax: 40 },
            { label: '41 - 60 per 100,000', color: colorScale(50), thresholdMin: 41, thresholdMax: 60 },
            { label: '61 - 80 per 100,000', color: colorScale(70), thresholdMin: 61, thresholdMax: 80 },
            { label: '81+ per 100,000', color: colorScale(90), thresholdMin: 81, thresholdMax: Infinity }
        ];

        // Clear any existing legend elements
        legendSvg.selectAll("*").remove();

        // Create a group for each legend entry
        const legendGroup = legendSvg.selectAll(".legend-entry")
            .data(legendData)
            .enter().append("g")
            .attr("class", "legend-entry")
            .attr("transform", (d, i) => `translate(0, ${i * 25})`);

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
            .style("fill", "#000");

        // Add click interaction for filtering map based on legend selection
        legendGroup.on('click', function (event, d) {
            svg.selectAll('path')
                .attr('opacity', d2 => {
                    const value = dataMap[d2.id];
                    return value >= d.thresholdMin && value <= d.thresholdMax ? 1 : 0.2;
                });
        });
    }

    // Function to zoom to a specific country when clicked
    function zoomToCountry(country) {
        const [[x0, y0], [x1, y1]] = path.bounds(country);
        const dx = x1 - x0;
        const dy = y1 - y0;
        const x = (x0 + x1) / 2;
        const y = (y0 + y1) / 2;
        const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height)));
        const translate = [width / 2 - scale * x, height / 2 - scale * y];

        svg.transition()
            .duration(1000)
            .call(
                zoom.transform,
                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
    }

    // Function to zoom out to the original view
    function zoomOut() {
        svg.transition()
            .duration(1000)
            .call(
                zoom.transform,
                d3.zoomIdentity.translate(0, 0).scale(1)
            );
    }

    // Adding zoom behavior to SVG
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
            svg.selectAll('path').attr('transform', event.transform);
        });

    svg.call(zoom);
}
