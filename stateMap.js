class StateMapVis {
    constructor(parentElement, stateName, geoData, dogData) {
        this.parentElement = parentElement;
        this.stateName = stateName;
        this.geoData = topojson.feature(geoData, geoData.objects.states).features;
        this.originalDogData = dogData;
        this.dogData = [];

        this.isFiltered = false; // Track whether data is filtered

        // Clear any existing SVG elements in the parent container
        d3.select(`#${this.parentElement}`).selectAll("*").remove();

        // Exit if no state is selected
        if (!this.stateName) {
            console.log("No state selected. Exiting StateMapVis constructor.");
            return;
        }

        // Filter dogData for the selected state
        this.stateDogData = dogData.filter(d => d.contact_state === stateName);

        console.log("GeoData:", this.geoData);
        console.log("StateName:", this.stateName);
        console.log("DogData:", this.dogData);

        // Initialize the visualization
        this.initVis();
    }

    initVis() {
        if (!this.stateName) {
            console.log("No state selected. Skipping initVis.");
            return;
        }

        let vis = this;

        console.log("Initializing visualization...");
        console.log("State Name:", vis.stateName);
        console.log("GeoData Features:", vis.geoData);

        // Filter the GeoJSON for the selected state
        vis.stateGeoJSON = vis.geoData.filter(
            d => d.properties.name === vis.stateName
        );

        if (!vis.stateGeoJSON.length) {
            console.error(`No GeoJSON data found for state: ${vis.stateName}`);
            return; // Exit gracefully if no data is found
        }

        vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 600 - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select(`#${vis.parentElement}`)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        // Initialize tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute");

        // Set up the projection and path generator
        vis.projection = d3.geoAlbersUsa()
            .fitSize([vis.width, vis.height], { type: "FeatureCollection", features: vis.stateGeoJSON });

        vis.path = d3.geoPath()
            .projection(vis.projection);

        // Draw the state outline
        vis.svg.selectAll(".state")
            .data(vis.stateGeoJSON)
            .enter()
            .append("path")
            .attr("class", "state")
            .attr("d", vis.path)
            .attr("fill", "white") // Gold fill
            .attr("stroke", "#333");

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        if (!vis.stateDogData || !Array.isArray(vis.stateDogData)) {
            console.error("stateDogData is undefined or not an array:", vis.stateDogData);
            return;
        }

        // Prepare pin data for the selected state (filter out invalid lat/lon)
        vis.pinData = vis.stateDogData
            .filter(d => d.latitude && d.longitude) // Ensure valid coordinates
            .map(d => ({
                latitude: +d.latitude, // Convert to numbers
                longitude: +d.longitude,
                url: d.url,
                breed_primary: d.breed_primary || "Unknown Breed",
                color_primary: d.color_primary,
                age: d.age,
                sex: d.sex,
                size: d.size,
                house_trained: d.house_trained,
                shots_current: d.shots_current,
                contact_city: d.contact_city,
                contact_state: d.contact_state,
                contact_zip: d.contact_zip,
            }));

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        if (!vis.pinData || !vis.pinData.length) {
            console.log("No pin data to display.");
            // Add a message to inform the user
            vis.svg
                .append("text")
                .attr("class", "no-data-message")
                .attr("x", vis.width / 2)
                .attr("y", vis.height / 2)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("font-size", "18px")
                .style("font-family", "Sour Gummy, system-ui")
                .style("fill", "#a1c6be")

                .text("No dogs available to display for this state.");
            return;
        }

        // Adjust projection for the selected state
        vis.projection = d3.geoAlbersUsa()
            .fitSize([vis.width, vis.height], {
                type: "FeatureCollection",
                features: vis.stateGeoJSON
            });

        vis.path = d3.geoPath().projection(vis.projection);

        // Clear any previous map elements
        vis.svg.selectAll("*").remove();

        // Draw the state map
        vis.svg.append("path")
            .datum(vis.stateGeoJSON[0]) // Use the first feature (selected state)
            .attr("d", vis.path)
            .attr("fill", "#a1c6be")
            .attr("stroke", "#333") // Darker outline
            .attr("stroke-width", 1.5);

        // Add tooltip div to the body
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip-box")
            .style("position", "absolute")
            .style("opacity", 0)
            .style("background", "#fff")
            .style("border", "1px solid #a1c6be")
            .style("border-radius", "10px")
            .style("padding", "10px")
            .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.1)")
            .style("font-family", "Sour Gummy, system-ui")
            .style("pointer-events", "none")
            .style("z-index", 1000);

        // Add pins for each dog's location
        vis.svg.selectAll(".pin")
            .data(vis.pinData)
            .enter()
            .append("text")
            .attr("class", "pin")
            .attr("x", d => vis.projection([+d.longitude, +d.latitude])[0]) // X coordinate
            .attr("y", d => vis.projection([+d.longitude, +d.latitude])[1]) // Y coordinate
            .attr("text-anchor", "middle") // Pin size
            .attr("alignment-baseline", "middle")
            .style("font-size", "15px")
            .style("cursor", "pointer")
            .text("🐶")
            .on("mouseover", (event, d) => {
                const capitalizedBreed = (d.breed_primary || "Unknown Breed")
                    .charAt(0)
                    .toUpperCase() + (d.breed_primary || "Unknown Breed").slice(1);

                tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);

                tooltip.html(`
                <strong>${capitalizedBreed}</strong><br>
                <span>${d.contact_city}, ${d.contact_state}</span><br>
                <span>${d.contact_zip}</span>
            `)
                    .style("left", `${event.pageX + 15}px`)
                    .style("top", `${event.pageY + 15}px`);
            })
            .on("mouseout", () => {
                // Hide tooltip
                tooltip.transition()
                    .duration(200)
                    .style("opacity", 0);
            })
            .on("mousemove", (event) => {
                // Update tooltip position dynamically
                tooltip.style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);
            })
            .on("click", (event, d) => {
                vis.showPopup(d);
            });
    }

    showPopup(dog) {
        // Remove any existing pop-ups
        d3.select(".popup").remove();

        // Fetch the image URL for the breed
        const breedImage = this.breedData.find(b => b.breed === dog.breed_primary)?.image_url || "";

        // Capitalize the breed name
        const capitalizedBreed = (dog.breed_primary || "Unknown Breed")
            .charAt(0)
            .toUpperCase() + (dog.breed_primary || "Unknown Breed").slice(1);

        // Create the pop-up container
        const popup = d3.select("body")
            .append("div")
            .attr("class", "popup")
            .style("position", "absolute")
            .style("left", `${window.innerWidth / 2 - 200}px`)
            .style("top", `${window.innerHeight / 2 - 350}px`)
            .style("width", "400px")
            .style("background", "#fff")
            .style("border-radius", "20px")
            .style("box-shadow", "0 10px 20px rgba(0, 0, 0, 0.2)")
            .style("padding", "20px")
            .style("z-index", 1000)
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center");

        // Add the "X" close button at the top-left corner
        popup.append("button")
            .text("×")
            .attr("aria-label", "Close popup")
            .style("position", "absolute")
            .style("top", "10px")
            .style("left", "10px")
            .style("background", "none")
            .style("border", "none")
            .style("font-size", "24px")
            .style("color", "#819E98")
            .style("cursor", "pointer")
            .on("click", () => {
                popup.remove();
            });

        // Add breed image
        if (breedImage) {
            popup.append("img")
                .attr("src", breedImage)
                .attr("alt", capitalizedBreed)
                .style("width", "80%")
                .style("border-radius", "10px")
                .style("margin-bottom", "20px");
        }

        // Add dog breed name
        popup.append("h2")
            .text(capitalizedBreed)
            .style("font-family", "Sour Gummy, system-ui")
            .style("font-size", "24px")
            .style("color", "#a1c6be")
            .style("margin-bottom", "10px")
            .style("text-shadow", "0 0 10px rgba(255, 215, 0, 0.8)")
            .style("text-align", "center");

        // Create a table for the dog details
        const table = popup.append("table")
            .style("width", "100%")
            .style("border-spacing", "10px")
            .style("color", "#819E98")
            .style("margin-bottom", "15px");

        const details = [
            { label: "Color", value: dog.color_primary || "Unknown" },
            { label: "Age", value: dog.age || "Unknown" },
            { label: "Sex", value: dog.sex || "Unknown" },
            { label: "Size", value: dog.size || "Unknown" },
            { label: "House-Trained", value: dog.house_trained || "Unknown" },
            { label: "Shots Current", value: dog.shots_current || "Unknown" },
            { label: "Location", value: `${dog.contact_city}, ${dog.contact_state}` },
            { label: "Zip", value: dog.contact_zip || "Unknown" }
        ];

        details.forEach(detail => {
            const row = table.append("tr");
            row.append("td")
                .text(detail.label)
                .style("font-weight", "bold")
                .style("text-align", "left")
                .style("width", "40%")
                .style("color", "black")
                .style("font-family", "Sour Gummy, system-ui");
            row.append("td")
                .text(detail.value)
                .style("text-align", "right")
                .style("width", "60%")
                .style("font-family", "Sour Gummy, system-ui");
        });

        // Add "More Details" link
        popup.append("a")
            .attr("href", dog.url)
            .attr("target", `_blank`)
            .text("More Details")
            .style("font-family", "Arial, sans-serif")
            .style("font-size", "16px")
            .style("color", "#007BFF")
            .style("text-decoration", "none")
            .style("margin-top", "10px")
            .style("margin-bottom", "20px")
            .style("cursor", "pointer")
            .on("mouseover", function () {
                d3.select(this).style("text-decoration", "underline");
            })
            .on("mouseout", function () {
                d3.select(this).style("text-decoration", "none");
            });

    }
    filterData() {
        let vis = this;

        if (vis.isFiltered) {
            // If already filtered, reset to show all dogs
            vis.stateDogData = vis.originalDogData.filter(d => d.contact_state === vis.stateName);
            vis.isFiltered = false;
        } else {
            // Filter `dogData` based on `globalSelectedBreedsProxy`
            const selectedBreeds = globalSelectedBreedsProxy.map(b => b.breed.toLowerCase());
            vis.stateDogData = vis.originalDogData
                .filter(d => d.contact_state === vis.stateName)
                .filter(d => selectedBreeds.includes(d.breed_primary?.toLowerCase()));
            vis.isFiltered = true;
        }

        // Check if there are dogs to display after filtering
        if (!vis.stateDogData.length) {
            vis.svg.selectAll("*").remove();

            // Draw the state shape with white fill
            vis.svg.append("path")
                .datum(vis.stateGeoJSON[0])
                .attr("d", vis.path)
                .attr("fill", "white")
                .attr("stroke", "#333")
                .attr("stroke-width", 1.5);

            // Add "No dogs available" message in the center
            vis.svg.append("text")
                .attr("class", "no-data-message")
                .attr("x", vis.width / 2)
                .attr("y", vis.height / 2)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("font-size", "18px")
                .style("font-family", "Sour Gummy, system-ui")
                .style("fill", "#a1c6be")
                .text("No dogs available to display for this state.");
        } else {
            vis.wrangleData();
        }

        // Toggle the filtered state
        vis.isFiltered = !vis.isFiltered;

        // Re-wrangle the data for visualization
        vis.wrangleData();
    }
}
