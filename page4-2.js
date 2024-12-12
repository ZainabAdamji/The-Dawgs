document.addEventListener("DOMContentLoaded", () => {
    const states = [
        "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
        "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
        "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
        "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
        "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
        "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
        "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
        "Wisconsin", "Wyoming"
    ];

    const dropdown = document.getElementById("stateDropdown");
    // Clear existing options to prevent duplication
    dropdown.innerHTML = "";

    // Add default "Select a state" option
    const defaultOption = document.createElement("option");
    defaultOption.value = ""; // Empty value
    defaultOption.textContent = "Select a state";
    defaultOption.disabled = true; // Not selectable
    defaultOption.selected = true; // Default selection
    dropdown.appendChild(defaultOption);

    // Populate dropdown with states
    states.forEach(state => {
        const option = document.createElement("option");
        option.value = state;
        option.textContent = state;
        dropdown.appendChild(option);
    });

    dropdown.addEventListener("change", () => {
        const selectedState = dropdown.value;

        if (!selectedState) {
            // Clear the map if no state is selected
            clearStateMap();
            sessionStorage.removeItem("selectedState");
            return;
        }

        // Save the selected state in sessionStorage and update the map
        sessionStorage.setItem("selectedState", selectedState);
        updateStateMap(selectedState);

        // Scroll to the stateMap page
        const page4Section = document.querySelector("#page4-3");
        if (page4Section) {
            page4Section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });

    // Helper function to clear the map
    function clearStateMap() {
        const stateMapParentElement = "stateMap";
        d3.select(`#${stateMapParentElement}`).selectAll("*").remove();
    }

    // Restore previously selected state from sessionStorage
    const savedState = sessionStorage.getItem("selectedState");
    if (savedState) {
        dropdown.value = savedState;
        updateStateMap(savedState);
    } else {
        clearStateMap();
    }
});

function updateStateMap(selectedState) {
    const stateMapParentElement = "stateMap";

    d3.select(`#${stateMapParentElement}`).selectAll("*").remove(); // Clear existing elements

    Promise.all([
        d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
        d3.csv("data/dog_shelter_data.csv"),
        d3.csv("data/breed_data.csv")
    ]).then(([geoData, dogData, breedData]) => {
        // Filter dogData by globalSelectedBreeds
        const filteredDogData = globalSelectedBreeds.length > 0
            ? dogData.filter(d => globalSelectedBreeds.includes(d.breed_primary))
            : dogData;

        // Pass the filtered data to StateMapVis
        const stateMapVis = new StateMapVis(
            stateMapParentElement,
            selectedState,
            geoData,
            filteredDogData
        );
        stateMapVis.breedData = breedData;
    }).catch(err => {
        console.error("Error loading data:", err);
    });
}



