document.addEventListener("DOMContentLoaded", () => {
    const stateMapParentElement = "stateMap";
    const stateDropdown = document.getElementById("stateDropdown");
    const filterButton = document.getElementById("filterButton");

    let isFiltered = false;

    if (!stateDropdown) {
        console.error("Dropdown element with ID 'stateDropdown' not found!");
        return;
    }

    // Clear the state map
    function clearStateMap() {
        const mapContainer = d3.select(`#${stateMapParentElement}`);
        mapContainer.selectAll("*").remove(); // Clear old map
    }

    // Function to render the state map
    function renderStateMap(selectedState, filterByBreeds = false) {
        clearStateMap();
        Promise.all([
            d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
            d3.csv("data/dog_shelter_data.csv"),
            d3.csv("data/breed_data.csv"),
        ])
            .then(([geoData, dogData, breedData]) => {
                console.log("Rendering map with data");

                // Create or update the StateMapVis instance
                stateMapVisInstance = new StateMapVis(
                    stateMapParentElement,
                    selectedState,
                    geoData,
                    dogData
                );

                // Assign breed data and trigger initial filter
                stateMapVisInstance.breedData = breedData;
                //stateMapVisInstance.filterData(); // Filter pins based on the current state

                // If filtering by breeds is enabled, trigger the filter
                if (filterByBreeds) {
                    stateMapVisInstance.filterData();
                }
            })
            .catch((err) => {
                console.error("Error loading data:", err);
            });
    }

    // Handle dropdown changes
    stateDropdown.addEventListener("change", () => {
        const selectedState = stateDropdown.value;

        // If "no state selected", clear the map
        if (!selectedState) {
            console.log("No state selected. Clearing map.");
            sessionStorage.removeItem("selectedState");
            clearStateMap();
            return;
        }

        console.log(`Dropdown changed: ${selectedState}`);

        // Reset the filter state
        isFiltered = false;
        filterButton.textContent = "Filter by Selected Breeds";

        // Update session storage and render the map
        sessionStorage.setItem("selectedState", selectedState);
        renderStateMap(selectedState);
    });

    // Handle filter button click
    filterButton.addEventListener("click", () => {
        const selectedState = stateDropdown.value;

        if (!selectedState) {
            console.error("No state selected to filter!");
            return;
        }

        // Toggle the filter state
        isFiltered = !isFiltered;
        filterButton.textContent = isFiltered
            ? "Show All Dogs"
            : "Filter by Selected Breeds";

        console.log(isFiltered ? "Filtering state map by selected breeds..." : "Showing all dogs...");

        // Render the map with the current filter state
        renderStateMap(selectedState, isFiltered);
    });

    // Initial render (only render if session storage has a state)
    const initialState = sessionStorage.getItem("selectedState");
    if (initialState) {
        stateDropdown.value = initialState; // Set dropdown to the saved state
        renderStateMap(initialState);
    } else {
        clearStateMap(); // Ensure the map is empty if no state is selected
    }
});

