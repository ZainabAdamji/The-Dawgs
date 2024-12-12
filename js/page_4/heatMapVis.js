
class heatMapVis {
    constructor(parentElement, geoData, dogData) {
        this.parentElement = parentElement;
        this.geoData = geoData; // GeoJSON data
        this.dogData = dogData; // Dog shelter data

        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select(`#${vis.parentElement}`).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        vis.projection = d3.geoAlbersUsa()
            .translate([vis.width / 2, vis.height / 2])
            .scale(vis.width * 0.9);

        vis.path = d3.geoPath()
            .projection(vis.projection);

        // Convert TopoJSON to GeoJSON
        vis.statesGeoJSON = topojson.feature(vis.geoData, vis.geoData.objects.states).features;

        // Draw states
        vis.states = vis.svg.selectAll(".state")
            .data(vis.statesGeoJSON)
            .enter()
            .append("path")
            .attr("class", "state")
            .attr("d", vis.path)
            .attr("fill", "lightgray")
            .attr("stroke", "#333");

        // Initialize tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .attr("id", "heatMapTooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("pointer-events", "none");

        // Wrangle data
        vis.wrangleData();

        // Prepare the legend after data is wrangled
        vis.prepareLegend();
    }
    prepareLegend() {
        let vis = this;

        // Ensure stateData is available
        const maxDogs = vis.stateData ? d3.max(vis.stateData.values()) : 0;

        // Legend dimensions based on SVG width
        const legendWidth = Math.max(vis.width * 0.2, 50);
        const legendHeight = 20;

        // Add gradient definition for legend
        const defs = vis.svg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "gradient");

        linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#ffffff");

        linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#a1c6be");

        // Append legend rectangle
        const legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr(
                "transform",
                `translate(${vis.width - legendWidth - 10}, ${vis.height - legendHeight - 40})`
            );

        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#gradient)");

        // Add labels for "0" and maximum number of adoptable dogs
        legend.append("text")
            .attr("x", 0)
            .attr("y", legendHeight + 15)
            .style("text-anchor", "start")
            .style("font-size", "12px")
            .style("font-family", "Sour Gummy, system-ui")
            .text("0");

        legend.append("text")
            .attr("x", legendWidth)
            .attr("y", legendHeight + 15)
            .style("text-anchor", "end")
            .style("font-size", "12px")
            .style("font-family", "Sour Gummy, system-ui")
            .text(`${maxDogs}`);
    }

    wrangleData() {
        let vis = this;

        // Aggregate data by state (count all dogs)
        vis.stateData = d3.rollup(
            vis.dogData,
            v => v.length,
            d => d.contact_state
        );

        // Update the color scale to match the pink gradient
        vis.colorScale = d3.scaleSequential()
            .interpolator(d3.interpolateRgb("#ffffff", "#a1c6be"))
            .domain([0, d3.max(vis.stateData.values())]);

        // Update visualization
        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Update state fill colors based on data
        vis.states
            .attr("fill", d => {
                const stateName = d.properties.name;
                const dogCount = vis.stateData.get(stateName) || 0;
                return vis.colorScale(dogCount);
            })
            .on("mouseover", (event, d) => {
                const stateName = d.properties.name;
                const dogCount = vis.stateData.get(stateName) || 0;

                // Highlight the state
                d3.select(event.target)
                    .attr("stroke", "#a1c6be")
                    .attr("stroke-width", 3);

                // Show tooltip
                vis.tooltip
                    .style("opacity", 1)
                    .html(`
                    <div style="padding: 10px; 
                    border: 1px solid #a1c6be; 
                    border-radius: 5px; 
                    background: #fff; 
                    font-family: 'Sour Gummy', system-ui;">
                        <strong>${stateName}</strong><br>
                        ${dogCount} dogs without shelter
                    </div>
                `);
            })
            .on("mousemove", (event) => {
                // Update tooltip position
                vis.tooltip
                    .style("left", `${event.pageX + 15}px`)
                    .style("top", `${event.pageY - 15}px`);
            })
            .on("mouseout", (event, d) => {
                // Reset state appearance
                d3.select(event.target)
                    .attr("stroke", "#333")
                    .attr("stroke-width", 1);

                // Hide tooltip
                vis.tooltip.style("opacity", 0);
            });
    }
}

