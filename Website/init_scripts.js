window.onload = function() {
    if (typeof init === "function") {
        init();  // For world_map.js
    }
    if (typeof initChart === "function") {
        initChart();  // For cancer_survival_chart.js
    }
};
