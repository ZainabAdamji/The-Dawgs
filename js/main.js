// Initialize global variables
let dogNameVis;
let globalSelectedBreeds = [];
let globalShortlistNames = [];
let stateMapVisInstance;
let currentPageIndex = 0;

function setupCustomScroll() {
    const container = document.querySelector(".container");
    const pages = document.querySelectorAll(".page");
    const matchedBreedsNextButton = document.getElementById("matched-breeds-next-button");
    const scrollIndicators = document.querySelectorAll(".scroll-indicator");

    if (!container) {
        console.error("Container element not found!");
        return;
    }

    if (pages.length === 0) {
        console.error("No pages found!");
        return;
    }

    let isScrolling = false; // Prevent multiple scroll triggers

    // Smooth scroll to a specific page
    function scrollToPage(index) {
        const targetPage = pages[index];
        if (!targetPage) return;

        isScrolling = true;
        container.scrollTo({
            top: targetPage.offsetTop,
            behavior: "smooth",
        });

        container.dataset.currentPage = index;
        setTimeout(() => {
            isScrolling = false; // Unlock scrolling after animation
        }, 700);
    }

    // Show an error message
    function showError() {
        let errorMessage = document.getElementById("error-message");

        if (!errorMessage) {
            errorMessage = document.createElement("div");
            errorMessage.id = "error-message";
            errorMessage.textContent = "Select at least one breed to continue!";
            document.body.appendChild(errorMessage);
        }

        // Show the message
        errorMessage.style.display = "block";

        setTimeout(() => {
            errorMessage.style.opacity = "1";
        }, 10);

        // Fade out after 3 seconds
        setTimeout(() => {
            errorMessage.style.opacity = "0";
            setTimeout(() => {
                errorMessage.style.display = "none";
            }, 500);
        }, 3000);

    }

    // Debounce-like mechanism to prevent multiple rapid scrolls
    let scrollTimeout;

    container.addEventListener("wheel", (event) => {
        if (isScrolling) return; // Ignore if scrolling is locked

        clearTimeout(scrollTimeout); // Reset the debounce timer
        scrollTimeout = setTimeout(() => {
            // Determine scroll direction
            const direction = event.deltaY > 0 ? 1 : -1;

            // Calculate the next page index
            const nextPageIndex = currentPageIndex + direction;

            // Prevent scrolling past matched-breeds if no breeds are selected
            if (
                pages[currentPageIndex].id === "matched-breeds" &&
                direction === 1 && // Only block downward scroll
                globalSelectedBreeds.length === 0
            ) {
                showError();
                event.preventDefault(); // Block the scroll
                return;
            }

            // Check boundaries
            if (nextPageIndex >= 0 && nextPageIndex < pages.length) {
                currentPageIndex = nextPageIndex;
                console.log("Next page index", currentPageIndex);
                scrollToPage(currentPageIndex);
            }
        }, 50); // Adjust debounce time for responsiveness

        // Prevent default scroll behavior
        event.preventDefault();
    });

    // Press to continue button
    scrollIndicators.forEach((indicator, index) => {
        indicator.addEventListener("click", () => {
            // Scroll to the next page if it exists
            const nextPageIndex = currentPageIndex + 1;
            currentPageIndex = nextPageIndex;
            console.log("Next page index", currentPageIndex);
            scrollToPage(currentPageIndex);
        });
    });

    // Handle button click for "matched-breeds" page
    if (matchedBreedsNextButton) {
        matchedBreedsNextButton.addEventListener("click", () => {
            if (globalSelectedBreeds.length === 0) {
                showError();
                return;
            }
            const nextPageIndex = currentPageIndex + 1;
            currentPageIndex = nextPageIndex;
            console.log("Next page index", currentPageIndex);
            scrollToPage(currentPageIndex);
        });
    }
}

// Call the function after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    setupCustomScroll();
});


function updateSelectedBreedsSidebar() {
    // console.log("Updating sidebar with breeds:", globalSelectedBreeds);
    const selectedBreedsList = document.getElementById("selected-breeds-list");
    selectedBreedsList.innerHTML = ""; // Clear previous list

    globalSelectedBreedsProxy.forEach((breedObj) => {
        if (breedObj && breedObj.breed) {
            const li = document.createElement("li");
            li.textContent = breedObj.breed; // Display the breed name
            selectedBreedsList.appendChild(li);
        } else {
            console.warn("Invalid breed object:", breedObj);
        }
    });
}

// Call updateSelectedBreedsSidebar when breeds change
globalSelectedBreedsProxy = new Proxy(globalSelectedBreeds, {
    set(target, property, value) {
        console.log(`Setting property ${property} to ${value}`); // Debug log
        target[property] = value;
        if (property === "length" || !isNaN(property)) {
            updateSelectedBreedsSidebar();
            console.log("globalSelectedBreeds updated:", target);
            // Update conclusion text
            updateMessage();
        }
        return true;
    }
});

// Call updateMessage when names change
globalSelectedNamesProxy = new Proxy(globalShortlistNames, {
    set(target, property, value) {
        target[property] = value;
        if (property === "length" || !isNaN(property)) {
            console.log("globalShortlistNames updated:", target);
            // Update conclusion text
            updateMessage();
        }
        return true;
    }
});

// Load data using promises
let promises = [
    d3.csv("data/dog_names_cleaned.csv"),
    d3.csv("data/breed_data.csv")
];

Promise.all(promises)
    .then(function(data) {
        initMainPage(data);
    })
    .catch(function(err) {
        console.error("Error loading data:", err);
    });

function initMainPage(dataArray) {
    // log data for debugging
    console.log("Loaded Data:", dataArray);

    // initialize the DogNameVis visualization
    dogNameVis = new DogNameVis("dog-name-vis", dataArray[0], dataArray[1]);

    // event listener for gender dropdown updates
    const genderDropdown = document.getElementById("dog-gender-select");
    if (genderDropdown) {
        genderDropdown.addEventListener("change", () => {
            dogNameVis.updateGenderSelection();
        });
    } else {
        console.warn("Gender dropdown not found.");
    }
}

// Change the title dynamically when scrolling to a new page
const pages = document.querySelectorAll('.page');

// Simple fade-in animation when a page comes into view
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        } else {
            entry.target.classList.remove('visible');
        }
    });
}, { threshold: 0.5 });

pages.forEach((page) => {
    observer.observe(page);
});

// Initialize the DogBreeds visualization
const dogBreeds = new DogBreeds("podium", "ranking");
const matchedBreedsPage = document.getElementById("matched-breeds");

const observer_podium = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.id === "matched-breeds") {
            const topthree = dogBreeds.getTopThreeBreeds();
            const ranksFourToTen = dogBreeds.getRanksFourToTen();
            dogBreeds.renderPodium(topthree);
            dogBreeds.renderRanks(ranksFourToTen);
        }
    });
}, { threshold: 0.5 });

if (matchedBreedsPage) {
    observer_podium.observe(matchedBreedsPage);
}

// Shelter
// Define the parent element for the heatmap visualization
const heatMapParentElement = "heatmap";

// heatMapVis instance
let heatMapVisInstance;

// Load GeoJSON and dog shelter data for the heatmap
Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"), // GeoJSON
    d3.csv("data/dog_shelter_data.csv") // Dog shelter data
]).then(([geoData, dogData]) => {
    // Initialize heatMapVis with loaded data
    heatMapVisInstance = new heatMapVis(heatMapParentElement, geoData, dogData);
});

// Dynamically change conclusion text
const conclusionPage = document.querySelector("#page-conclusion .question-box p");

// Function to format breed names
const formatBreedNames = (breeds) => {
    if (breeds.length === 0) return "your favorite breed(s)";
    if (breeds.length === 1) return pluralizeBreed(breeds[0].breed);

    const allButLast = breeds.slice(0, -1).map(b => pluralizeBreed(b.breed)).join(", ");
    const last = pluralizeBreed(breeds[breeds.length - 1].breed);
    return `${allButLast} and ${last}`;
};

// Function to format breed names
const formatDogNames = (names) => {
    // Helper function to capitalize the first letter of a name
    const capitalizeName = (name) => {
        if (!name) return "";
        return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    };

    if (names.length === 0) return "Luna or Bella"; // Default example names
    if (names.length === 1) return capitalizeName(names[0]);

    const allButLast = names.slice(0, -1).map(capitalizeName).join(", ");
    const last = capitalizeName(names[names.length - 1]);
    return `${allButLast} or ${last}`;
};

// Listen for updates to `globalSelectedBreeds`
const updateMessage = () => {
    const breedNames = formatBreedNames(globalSelectedBreeds);
    const dogNames = formatDogNames(globalShortlistNames);
    console.log("Breed names:", breedNames)
    conclusionPage.innerHTML = `
                Thank you for letting us be part of your journey to finding the perfect furry friend! 
                Whether you've fallen in love with <span class="highlight">${breedNames}</span>, or are considering names like <span class="highlight">${dogNames}</span>, 
                we hope you're excited to welcome a dog into your life. 
                We’re glad you explored adoptable dogs near you—remember, adopting is a lifelong commitment, 
                and so many wonderful companions are waiting to join your family. 
                Best of luck as you embark on this exciting adventure!
            `;
};

// Function to pluralize breed names
const pluralizeBreed = (breed) => {
    return breed.endsWith("s") ? breed : `${breed}s`;
};

