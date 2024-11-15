window.onload = function() {
    if (typeof init === "function") {
        init();  // For world_map.js
    }
    if (typeof initChart === "function") {
        initChart();  // For cancer_survival_chart.js
    }
    if (typeof initAllDonutCharts === "function") {
        initAllDonutCharts();  // Initialize donut chart
    }
    if (typeof initBubbleChart === "function") {
        initBubbleChart();  // Initialize bubble chart
    }
    if (typeof initStackedBarChart === "function") {
        initStackedBarChart();  // Initialize the stacked bar chart
    } 
};
