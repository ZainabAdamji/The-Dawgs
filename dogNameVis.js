class DogNameVis {
    constructor(parentElement, nameData, breedData) {
        this.parentElement = parentElement;
        this.nameData = nameData;
        this.breedData = breedData;
        this.selectedBreed = null;
        this.selectedGender = null;
        this.displayData = [];
        this.shortlist = [];
        this.currentIndex = 0;
        this.commonalityValue = 50;

        this.initVis();

        // reference the global proxy
        globalShortlistNames = window.globalShortlistNames || globalSelectedNamesProxy;
    }

    initVis() {
        let vis = this;

        // setting up dimensions and margins
        vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 400;

        // creating SVG area
        vis.svg = d3.select("#" + vis.parentElement)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        // initializing the slider
        vis.initializeSlider();

        // appending the header
        vis.svg.append("text")
            .attr("x", vis.width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .style("font-size", "50px")
            .style("font-weight", "bold")
            .text("Let's Create a List of Names!");

        // appending headers for card swiping section
        vis.svg.append("text")
            .attr("x", vis.width / 2)
            .attr("y", 90)
            .attr("text-anchor", "middle")
            .style("font-size", "24px")
            .text("See a name you like?");

        // adding instructions for user
        vis.svg.append("text")
            .attr("x", vis.width / 2)
            .attr("y", 110)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Click the thumbs-up to like it!");

        vis.svg.append("text")
            .attr("x", vis.width / 2)
            .attr("y", 130)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Click the thumbs-down to skip it!");

        vis.svg.append("text")
            .attr("x", vis.width / 2)
            .attr("y", 150)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Choose up to 5!");

        // adding header for shortlist section
        vis.svg.append("text")
            .attr("x", vis.width - 150)
            .attr("y", 90)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .text("Your Top Picks");

        // creating bone shape using svg shapes
        // creating a card group to hold the bone shapes
        vis.cardGroup = vis.svg.append("g")
            .attr("class", "card-group")
            .attr("transform", `translate(${vis.width / 2}, ${vis.height / 2})`);

        // creating a bone group for the bone shape
        vis.boneGroup = vis.cardGroup.append("g")
            .attr("class", "bone-group");

        // defining the dimensions for the bone shape
        const boneWidth = 200;
        const boneHeight = 80;
        const circleRadius = 40;

        // calculating the new rectangle width
        const rectWidth = boneWidth + circleRadius - 40;

        // adding the central rectangle for the bone (with border)
        vis.boneGroup.append("rect")
            .attr("x", -rectWidth / 2)
            .attr("y", -circleRadius)
            .attr("width", rectWidth)
            .attr("height", 2 * circleRadius)
            .style("fill", "white")
            .style("stroke", "#000000")
            .style("stroke-width", 3);

        // top-left circle
        vis.boneGroup.append("circle")
            .attr("cx", -boneWidth / 2)
            .attr("cy", -circleRadius)
            .attr("r", circleRadius)
            .style("fill", "white")
            .style("stroke", "#000000")
            .style("stroke-width", 2);

        // top-right circle
        vis.boneGroup.append("circle")
            .attr("cx", boneWidth / 2)
            .attr("cy", -circleRadius)
            .attr("r", circleRadius)
            .style("fill", "white")
            .style("stroke", "#000000")
            .style("stroke-width", 2);

        // bottom-left circle
        vis.boneGroup.append("circle")
            .attr("cx", -boneWidth / 2)
            .attr("cy", circleRadius)
            .attr("r", circleRadius)
            .style("fill", "white")
            .style("stroke", "#000000")
            .style("stroke-width", 2);

        // bottom-right circle
        vis.boneGroup.append("circle")
            .attr("cx", boneWidth / 2)
            .attr("cy", circleRadius)
            .attr("r", circleRadius)
            .style("fill", "white")
            .style("stroke", "#000000")
            .style("stroke-width", 2);

        // adding an overlay rectangle to cover a portion of the circle edges
        vis.boneGroup.append("rect")
            .attr("x", -rectWidth / 2)
            .attr("y", -circleRadius)
            .attr("width", rectWidth)
            .attr("height", 2 * circleRadius)
            .style("fill", "white")
            .style("stroke", "none");

        // adding the name text in the center of the bone
        vis.nameText = vis.boneGroup.append("text")
            .attr("class", "bone-text")
            .attr("text-anchor", "middle")
            .attr("dy", 5)
            .style("font-size", "20px")
            .style("fill", "black");

        // creating a "Like" button group
        vis.likeButtonGroup = vis.svg.append("g")
            .attr("class", "like-button-group")
            .attr("transform", `translate(${vis.width / 2 + 100}, ${vis.height - 30})`)
            .style("cursor", "pointer")
            .on("click", () => vis.handleLike());

        // adding the thumbs-up emoji
        vis.likeButtonGroup.append("text")
            .attr("class", "like-emoji")
            .attr("text-anchor", "middle")
            .text("👍")
            .style("font-size", "40px");

        // adding the "Like" text
        vis.likeButtonGroup.append("text")
            .attr("class", "like-text")
            .attr("text-anchor", "middle")
            .attr("y", 45)
            .text("Like")
            .style("font-size", "20px");

        // creating a "Skip" button group
        vis.skipButtonGroup = vis.svg.append("g")
            .attr("class", "skip-button-group")
            .attr("transform", `translate(${vis.width / 2 - 100}, ${vis.height - 30})`)
            .style("cursor", "pointer")
            .on("click", () => vis.handleSkip());

        // adding the thumbs-down emoji
        vis.skipButtonGroup.append("text")
            .attr("class", "skip-emoji")
            .attr("text-anchor", "middle")
            .text("👎")
            .style("font-size", "40px");

        // adding the "Skip" text
        vis.skipButtonGroup.append("text")
            .attr("class", "skip-text")
            .attr("text-anchor", "middle")
            .attr("y", 45)
            .text("Skip")
            .style("font-size", "20px");

        // adding a group for the shortlist
        vis.shortlistGroup = vis.svg.append("g")
            .attr("class", "shortlist-group")
            .attr("transform", `translate(${vis.width - 200}, 120)`);

        // calling wrangleData() to filter and prepare data
        vis.wrangleData();
    }

    // initializing the name popularity slider
    initializeSlider() {
        let vis = this;

        const slider = document.getElementById("popularity-slider");

        noUiSlider.create(slider, {
            start: [50],
            connect: [true, false],
            step: 1,
            range: {
                min: 0,
                max: 100,
            },
            tooltips: [true],
            format: {
                to: value => Math.round(value),
                from: value => Number(value),
            },
        });

        slider.noUiSlider.on("slide", (values) => {
            vis.commonalityValue = parseInt(values[0], 10);
            console.log("Updated commonalityValue:", vis.commonalityValue);
            vis.wrangleData();
        });
    }

    updateGenderSelection() {
        let vis = this;

        // grabbing the selected gender from the dropdown
        const genderDropdown = document.getElementById("dog-gender-select");
        if (genderDropdown) {
            vis.selectedGender = genderDropdown.value;
            console.log("Gender updated in DogNameVis to:", vis.selectedGender);
            vis.wrangleData();
        }
    }

    wrangleData() {
        let vis = this;

        console.log("wrangleData() called");

        const defaultBreeds = ["Golden Retriever", "Labrador Retriever", "Poodle"];
        const selectedBreeds = globalSelectedBreeds.length > 0
            ? globalSelectedBreeds.map(breedObj => breedObj.breed.toLowerCase()) // googled how to normalize the case since there was a case discrepancy btwn mine and yiyi's
            : defaultBreeds.map(b => b.toLowerCase());

        const defaultGender = "M";
        const defaultCommonality = 50;

        const selectedGender = vis.selectedGender || defaultGender;
        const commonalityValue = vis.commonalityValue || defaultCommonality;

        console.log("Using selectedBreeds:", selectedBreeds);
        console.log("Using selectedGender:", selectedGender);
        console.log("Using commonalityValue:", commonalityValue);

        // filter the data based on the criteria
        vis.displayData = vis.nameData.filter(d => {
            const breedMatch = selectedBreeds.includes(d.BreedName.toLowerCase());
            const genderMatch = selectedGender === "All" || d.AnimalGender === selectedGender;
            const commonalityMatch = Math.abs(d.PopularityScore - commonalityValue) <= 20;

            return breedMatch && genderMatch && commonalityMatch;
        });

        // removing duplicate names (taking into account case sensitivity)
        const seenNames = new Set();
        vis.displayData = vis.displayData.filter(d => {
            const nameLower = d.AnimalName.toLowerCase();
            if (seenNames.has(nameLower)) {
                return false;
            }
            seenNames.add(nameLower);
            return true;
        });

        // randomizing the filtered data for display
        vis.displayData = vis.displayData.sort(() => Math.random() - 0.5);

        console.log("Filtered and randomized displayData:", vis.displayData);

        vis.updateVis();
    }



    updateVis() {
        let vis = this;

        // stop updating if shortlist is full or all names are exhausted
        if (vis.shortlist.length === 5 || vis.currentIndex >= vis.displayData.length) {
            vis.cardGroup.style("display", "none");
            vis.nameText.text("");
            vis.svg.append("text")
                .attr("x", vis.width / 2)
                .attr("y", vis.height / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("font-weight", "bold")
                .text("Looks like you filled up your list or ran out of names!");

            // hover instructions
            vis.svg.append("text")
                .attr("x", vis.width / 2)
                .attr("y", vis.height / 2 + 20)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("font-weight", "bold")
                .style("fill", "#000000")
                .style("color", "#a1c6be")
                .text("Hover over the names on your list to learn more!");

            // visually disable the like and skip buttons
            vis.likeButtonGroup
                .style("pointer-events", "none")
                .style("opacity", 0.3)
                .select(".like-emoji")
                .style("font-size", "20px");
            vis.likeButtonGroup
                .select(".like-text")
                .style("font-size", "12px");

            vis.skipButtonGroup
                .style("pointer-events", "none")
                .style("opacity", 0.3)
                .select(".skip-emoji")
                .style("font-size", "20px");
            vis.skipButtonGroup
                .select(".skip-text")
                .style("font-size", "12px");

            // getting the current name
            const currentName = vis.displayData[vis.currentIndex];

            // updating the card text
            vis.nameText.text(currentName.AnimalName);

            // resetting the card position to return to the center of the page
            vis.cardGroup.attr("transform", `translate(${vis.width / 2}, ${vis.height / 2 + 20})`);

            // updating the shortlist
            vis.updateShortlist();

            return;
        }

        // getting the current name
        const currentName = vis.displayData[vis.currentIndex];

        // updating the card text
        vis.nameText.text(currentName.AnimalName);

        // resetting the card position to return to the center of the page
        vis.cardGroup.attr("transform", `translate(${vis.width / 2}, ${vis.height / 2 + 20})`);

        // updating the shortlist
        vis.updateShortlist();
    }


    handleLike() {
        let vis = this;

        // adding a name to the shortlist if a user clicks "like"
        if (vis.displayData[vis.currentIndex] && vis.shortlist.length < 6) {
            const likedName = vis.displayData[vis.currentIndex].AnimalName;

            // adding to the local shortlist
            vis.shortlist.push(likedName);

            // adding to the global shortlist (avoiding duplicates)
            if (!globalShortlistNames.includes(likedName)) {
                globalShortlistNames.push(likedName);
            }

            console.log("Shortlist (local):", vis.shortlist);
            console.log("Shortlist (global):", globalShortlistNames);
        }

        // adding animation for "swipe right"
        vis.cardGroup.transition()
            .duration(500)
            .attr("transform", `translate(${vis.width + 200}, ${vis.height / 2})`)
            .on("end", () => {
                vis.currentIndex++;
                vis.updateVis();
            });
    }


    handleSkip() {
        let vis = this;

        // adding animation for "swipe-left"
        vis.cardGroup.transition()
            .duration(500)
            .attr("transform", `translate(-200, ${vis.height / 2})`)
            .on("end", () => {
                vis.currentIndex++;
                vis.updateVis();
            });
    }

    updateShortlist() {
        let vis = this;

        // connecting data to shortlist items
        const shortlistItems = vis.shortlistGroup.selectAll(".shortlist-item")
            .data(vis.shortlist);

        // enter selection: adding new names to the shortlist
        shortlistItems.enter()
            .append("text")
            .attr("class", "shortlist-item")
            .attr("x", 0)
            .attr("y", (d, i) => i * 30)
            .text(d => d)
            .style("font-size", "16px")
            .style("fill", "black")
            .style("cursor", "pointer")
            .on("mouseover", (event, name) => vis.showTooltip(event, name))
            .on("mousemove", (event) => vis.moveTooltip(event))
            .on("mouseout", () => vis.hideTooltip())
            .transition()
            .duration(500)
            .style("opacity", 1);

        console.log("Shortlist updated:", vis.shortlist);

        // update selection: adjusting existing items
        shortlistItems
            .transition()
            .duration(500)
            .text(d => d);

        // exit selection: removing items that are no longer in the data
        shortlistItems.exit()
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();
    }

    showTooltip(event, name) {
        let vis = this;

        // filtering the name data for tooltip details
        const nameData = vis.nameData.filter(d => d.AnimalName === name);

        if (nameData.length > 0) {
            const nameCount = nameData.length;
            const averagePopularity = d3.mean(nameData, d => d.PopularityScore).toFixed(2);
            const mostCommonBreed = d3.mode(nameData.map(d => d.BreedName)) || "N/A";

            // updating tooltip content and position
            const tooltip = document.getElementById("name-info-tooltip");
            tooltip.style.display = "block";
            tooltip.innerHTML = `
            <table>
                <tr><td><strong>${name}</strong></td></tr>
                <tr><td>Total Dogs With This Name:</td><td>${nameCount}</td></tr>
                <tr><td>Average Popularity:</td><td>${averagePopularity}</td></tr>
                <tr><td>Most Common Breed:</td><td>${mostCommonBreed}</td></tr>
            </table>
        `;
        }
    }

    moveTooltip(event) {
        const tooltip = document.getElementById("name-info-tooltip");
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        const mouseX = event.pageX;
        const mouseY = event.pageY;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // setting default position
        let left = mouseX + 10;
        let top = mouseY + 10;

        // adjusting tooltip position, avoiding overflow
        if (mouseX + tooltipWidth + 10 > viewportWidth) {
            left = mouseX - tooltipWidth - 10;
        }
        if (mouseY + tooltipHeight + 10 > viewportHeight) {
            top = mouseY - tooltipHeight - 10;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    hideTooltip() {
        const tooltip = document.getElementById("name-info-tooltip");
        tooltip.style.display = "none";
    }


}
