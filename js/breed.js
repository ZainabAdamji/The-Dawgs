class DogBreeds {
    constructor(podiumContainer, rankContainer) {
        this.podiumContainer = podiumContainer;
        this.rankContainer = rankContainer;

        // Array to track user selected breeds
        this.selectedBreeds = [];
        this.maxNumSelectedBreeds = 5;

        // Reference the global proxy
        globalSelectedBreeds = window.globalSelectedBreeds || globalSelectedBreedsProxy;

        // Initialize visualization setup
        this.initVis();
    }

    initVis() {
        const vis = this;

        // Margin conventions
        const size = document.getElementById(vis.podiumContainer).getBoundingClientRect();
        vis.margin = { top: 70, right: 70, bottom: 20, left: 70 };
        vis.width = size.width - vis.margin.left - vis.margin.right;
        vis.height = size.height - vis.margin.top - vis.margin.bottom;

        // Initialize SVG
        vis.svg = d3.select("#" + vis.podiumContainer)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);

        console.log("SVG initialized with dimensions:", vis.width, vis.height);

        // List of input IDs to monitor
        const inputIDs = [
            '#activity-level',
            '#home-space',
            '#dog-experience',
            '#child-friendly',
            '#shedding',
            '#drooling',
            '#budget'
        ];

        // Add event listeners for each input
        inputIDs.forEach(id => {
            const inputElement = document.querySelector(id);
            if (inputElement) {
                inputElement.addEventListener('change', () => vis.updateVis());
            }
        });

        // Podium configuration
        vis.dogImgSize = 0.6
        vis.totalPodiumWidth = vis.width / 2;
        vis.podiumWidth = vis.totalPodiumWidth / 3;
        vis.podiumBaseHeight = vis.height / 1.7;
        vis.topHeightAdjustments = [vis.podiumBaseHeight * 3/4, vis.podiumBaseHeight, vis.podiumBaseHeight * 3/5];
        vis.textOffset = vis.podiumBaseHeight / 2.5; // Distance below the top of the podium
        vis.podiumStartX = (vis.width - vis.totalPodiumWidth) / 2;

        // Rank SVG setup
        const rankSize = document.getElementById(vis.rankContainer).getBoundingClientRect();
        vis.rankMargin = { top: 50, right: 50, bottom: 50, left: 50 };
        vis.rankWidth = rankSize.width - vis.rankMargin.left - vis.rankMargin.right;
        vis.rankHeight = rankSize.height - vis.rankMargin.top - vis.rankMargin.bottom;

        vis.rankSvg = d3.select("#" + vis.rankContainer)
            .append("svg")
            .attr("width", vis.rankWidth + vis.rankMargin.left + vis.rankMargin.right)
            .attr("height", vis.rankHeight + vis.rankMargin.top + vis.rankMargin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.rankMargin.left},${vis.rankMargin.top})`);

        console.log("Rank SVG initialized:", vis.rankWidth, vis.rankHeight);

        // Initialize tooltip
        this.tooltip = document.getElementById("breed-tooltip");

        // Load and process data
        vis.wrangleData();
    }

    wrangleData() {
        const vis = this;

        // Load the CSV file
        d3.csv("data/breed_data.csv", (row) => {
            return {
                breed: row.breed,
                purchase_price: +row.purchase_price,
                food_costs_per_year: +row.food_costs_per_year,
                apartment_adaptability_score: +row.apartment_adaptability_score,
                fit_for_novice_score: +row.fit_for_novice_score,
                kid_friendly_score: +row.kid_friendly_score,
                shedding_score: +row.shedding_score,
                drooling_score: +row.drooling_score,
                exercise_need_score: +row.exercise_need_score,
                height_min: +row.height_min,
                height_max: +row.height_max,
                weight_min: +row.weight_min,
                weight_max: +row.weight_max,
                image_url: row.image_url,
            };
        }).then((data) => {
            // Store the processed data
            vis.data = data;
            console.log("Data loaded and processed:", vis.data);

            // Call the function to render the visualization
            vis.updateVis();
        }).catch((error) => {
            console.error("Error loading or processing data:", error);
        });
    }

    // Placeholder for visualization update logic
    updateVis() {
        const vis = this;

        // Reset selected breeds array
        this.selectedBreeds = [];

        // Clear existing text
        vis.svg.selectAll("text").remove();
        vis.rankSvg.selectAll("text").remove();

        // Fetch user inputs from questions
        vis.userInputs = {
            activityLevel: parseInt(document.querySelector('#activity-level').value, 10) || 0,
            homeSpace: parseInt(document.querySelector('#home-space').value, 10) || 0,
            dogExperience: parseInt(document.querySelector('#dog-experience').value, 10) || 0,
            childFriendly: parseInt(document.querySelector('#child-friendly').value, 10) || 0,
            sheddingTolerance: parseInt(document.querySelector('#shedding').value, 10) || 0,
            droolingTolerance: parseInt(document.querySelector('#drooling').value, 10) || 0,
            budget: parseFloat(document.querySelector('#budget').value) || 0,
        };

        console.log("User inputs collected:", vis.userInputs);

        vis.filterAndRankBreeds();

        // Get the top 3 breeds
        vis.topthree = vis.topten.slice(0, 3);

        // Ranks 4–10
        vis.ranksFourToTen = vis.topten.slice(3, 10);

        console.log("Top 3 Breeds:", vis.topthree);
        console.log("Ranks 4–10:", vis.ranksFourToTen);
    }

    filterAndRankBreeds() {
        const vis = this;

        // Helper function to calculate involution
        const involution = (value) => {
            const map = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 };
            return map[value] || value;
        };

        // Separate breeds that meet the requirements
        vis.meetsRequirements = [];
        vis.doesNotMeetRequirements = [];

        vis.data.forEach((breed) => {
            const meetsActivityLevel = breed.exercise_need_score <= vis.userInputs.activityLevel;
            const meetsHomeSpace = involution(breed.apartment_adaptability_score) <= vis.userInputs.homeSpace;
            const meetsDogExperience = involution(breed.fit_for_novice_score) <= vis.userInputs.dogExperience;
            const meetsChildFriendly = breed.kid_friendly_score >= vis.userInputs.childFriendly;
            const meetsSheddingTolerance = breed.shedding_score <= vis.userInputs.sheddingTolerance;
            const meetsDroolingTolerance = breed.drooling_score <= vis.userInputs.droolingTolerance;
            const meetsBudget = (breed.food_costs_per_year / 12) * 4 <= vis.userInputs.budget;

            if (
                meetsActivityLevel &&
                meetsHomeSpace &&
                meetsDogExperience &&
                meetsChildFriendly &&
                meetsSheddingTolerance &&
                meetsDroolingTolerance &&
                meetsBudget
            ) {
                vis.meetsRequirements.push(breed);
            } else {
                vis.doesNotMeetRequirements.push(breed);
            }
        });

        console.log("Breeds that meet the requirements:", vis.meetsRequirements);

        // Rank breeds that meet the requirements

        vis.meetsRequirements.forEach((breed) => {
            breed.matchScore =
                // Smaller difference in exercise need is better
                (5 - Math.abs(breed.exercise_need_score - vis.userInputs.activityLevel)) +
                // Higher kid-friendly score is better
                breed.kid_friendly_score +
                // Lower shedding score is better
                (5 - breed.shedding_score) +
                // Lower drooling score is better
                (5 - breed.drooling_score);
        });

        vis.meetsRequirements.sort((a, b) => b.matchScore - a.matchScore);

        console.log("Breeds that meet the requirements (ranked by matchScore):", vis.meetsRequirements);

        // Ensure at least 10 breeds
        if (vis.meetsRequirements.length < 10) {
            // Calculate proximity score for non-matching breeds
            vis.doesNotMeetRequirements.forEach((breed) => {
                breed.proximityScore =
                    (5 - Math.abs(breed.exercise_need_score - vis.userInputs.activityLevel)) +
                    (5 - Math.abs(involution(breed.apartment_adaptability_score) - vis.userInputs.homeSpace)) +
                    (5 - Math.abs(involution(breed.fit_for_novice_score) - vis.userInputs.dogExperience)) +
                    (5 - Math.abs(breed.kid_friendly_score - vis.userInputs.childFriendly)) +
                    (5 - Math.abs(breed.shedding_score - vis.userInputs.sheddingTolerance)) +
                    (5 - Math.abs(breed.drooling_score - vis.userInputs.droolingTolerance));
            });

            // Sort non-matching breeds by proximity score
            vis.doesNotMeetRequirements.sort((a, b) => b.proximityScore - a.proximityScore);

            // Add the top 10 breeds from the non-matching set to the filtered set
            const additionalBreeds = vis.doesNotMeetRequirements.slice(0, 10 - vis.meetsRequirements.length);
            vis.meetsRequirements.push(...additionalBreeds);
        }

        // Update the filtered breeds list
        vis.topten = vis.meetsRequirements.slice(0, 10); // Final set of top 10 breeds
        console.log("Top 10 breeds:", vis.topten);
    }

    renderPodium(topthree) {
        const vis = this;

        // Podium positions
        const positions = [
            { x: vis.podiumStartX + vis.podiumWidth * 0, baseY: vis.height, heightAdjustment: vis.topHeightAdjustments[0] }, // 2nd place
            { x: vis.podiumStartX + vis.podiumWidth * 1, baseY: vis.height, heightAdjustment: vis.topHeightAdjustments[1] }, // 1st place
            { x: vis.podiumStartX + vis.podiumWidth * 2, baseY: vis.height, heightAdjustment: vis.topHeightAdjustments[2] }, // 3rd place
        ];

        // Draw rectangles for the podium
        const podiumRects = vis.svg
            .selectAll(".podium")
            .data(positions)
            .enter()
            .append("rect")
            .attr("class", "podium")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.baseY)
            .attr("width", vis.podiumWidth)
            .attr("rx", 10)
            .attr("ry", 10)
            .attr("fill", (d, i) => (i === 1 ? "#FFD700" : i === 0 ? "#C0C0C0" : "#CD7F32")) // Gold, Silver, Bronze
            .attr("height", 0);


        // Animate podium rectangles to grow from the bottom
        podiumRects.transition()
            .duration(1000)
            .delay((d, i) => (i === 1 ? 0 : i === 0 ? 500 : 1000))
            .attr("height", (d) => d.heightAdjustment)
            .attr("y", (d) => d.baseY - d.heightAdjustment);

        // Add numbers for the positions
        vis.svg
            .selectAll(".podium-text")
            .data(positions)
            .enter()
            .append("text")
            .attr("class", "podium-text")
            .attr("x", (d) => d.x + vis.podiumWidth / 2)
            .attr("y", (d) => d.baseY - d.heightAdjustment + vis.textOffset)
            .attr("text-anchor", "middle")
            .text((d, i) => (i === 0 ? "2" : i === 1 ? "1" : "3")); // Numbers: 2 for 2nd, 1 for 1st, 3 for 3rd

        // Add breed names above the podiums
        const podiumTexts = vis.svg
            .selectAll(".podium-breed-text")
            .data([topthree[1], topthree[0], topthree[2]])
            .enter()
            .append("text")
            .attr("class", "podium-breed-text")
            .attr("x", (d, i) => positions[i].x + vis.podiumWidth / 2)
            .attr("y", (d, i) => positions[i].baseY - positions[i].heightAdjustment - (vis.podiumWidth * vis.dogImgSize) - 10)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .attr("font-weight", "bold")
            .attr("font-family", "Sour Gummy")
            .style("opacity", 0)
            .attr("class", d => this.selectedBreeds.includes(d) ? "selected" : "")
            .text(d => d.breed)
            .on("click", (event, d) => {
                this.toggleSelection(d);
                vis.updateSelectionStyles(d);
            });

        // Fade in breed names after podium grows
        podiumTexts.transition()
            .duration(500)
            .delay((d, i) => (i === 1 ? 1300 : i === 0 ? 1800 : 2300))
            .style("opacity", 1);

        // Add breed images above the podiums
        const podiumImages = vis.svg
            .selectAll(".podium-breed-image")
            .data([topthree[1], topthree[0], topthree[2]])
            .join("image")
            .attr("class", "podium-breed-image")
            .attr("x", (d, i) => positions[i].x + (vis.podiumWidth * ((1 - vis.dogImgSize) / 2)))
            .attr("y", (d, i) => positions[i].baseY - positions[i].heightAdjustment - (vis.podiumWidth * vis.dogImgSize))
            .attr("width", vis.podiumWidth * vis.dogImgSize)
            .attr("height", vis.podiumWidth * vis.dogImgSize)
            .attr("href", d => d.image_url)
            .style("opacity", 0)
            .attr("preserveAspectRatio", "xMidYMid meet") // Preserve aspect ratio
            .classed("selected", d => this.selectedBreeds.includes(d))
            .on("click", (event, d) => {
                this.toggleSelection(d);
                vis.updateSelectionStyles(d);
            })
            .on("mouseover", (event, d) => {
                const tooltip = document.getElementById("breed-tooltip");
                // Ensure the image's opacity is 1 before showing the tooltip
                const imageElement = event.target;
                if (parseFloat(window.getComputedStyle(imageElement).opacity) === 1) {
                    console.log()
                    tooltip.style.display = "block";
                    tooltip.innerHTML = `
                        <table>
                            <tr>
                                <td>Fit for new owners:</td>
                                <td>${d.fit_for_novice_score} / 5</td>
                            </tr>
                            <tr>
                                <td>Exercise needs:</td>
                                <td>${d.exercise_need_score} / 5</td>
                            </tr>
                            <tr>
                                <td>Apartment adaptability:</td>
                                <td>${d.apartment_adaptability_score} / 5</td>
                            </tr>
                            <tr>
                                <td>Child-friendliness:</td>
                                <td>${d.kid_friendly_score} / 5</td>
                            </tr>
                            <tr>
                                <td>Shedding:</td>
                                <td>${d.shedding_score} / 5</td>
                            </tr>
                            <tr>
                                <td>Drooling:</td>
                                <td>${d.drooling_score} / 5</td>
                            </tr>
                            <tr>
                                <td>Cost per month:</td>
                                <td>$${(d.food_costs_per_year / 3).toFixed(2)}</td>
                            </tr>
                        </table>
                    `;
                }
            })
            .on("mousemove", (event) => {
                const tooltip = document.getElementById("breed-tooltip");
                tooltip.style.left = `${event.pageX + 10}px`;
                tooltip.style.top = `${event.pageY + 10}px`;
            })
            .on("mouseout", () => {
                const tooltip = document.getElementById("breed-tooltip");
                tooltip.style.display = "none";
            });

        // Fade in breed images after podium grows
        podiumImages.transition()
            .duration(500)
            .delay((d, i) => (i === 1 ? 800 : i === 0 ? 1300 : 1800))
            .style("opacity", 1);

        // Add arrow image
        const arrow = vis.svg
            .selectAll(".podium-arrow")
            .data([null])
            .join("image")
            .attr("class", "podium-arrow")
            .attr("x", vis.podiumStartX + vis.podiumWidth * 2.8)
            .attr("y", positions[1].baseY - positions[1].heightAdjustment - (vis.podiumWidth * vis.dogImgSize) + 10)
            .attr("width", vis.podiumWidth / 4)
            .attr("height", vis.podiumWidth / 4)
            .attr("href", "img/left-arrow.png")
            .style("opacity", 0)
            .attr("preserveAspectRatio", "xMidYMid meet");

        arrow.transition()
            .duration(700)
            .delay(7000)
            .style("opacity", 1)
            .on("end", () => {
                d3.select(".podium-arrow").classed("diagonal-bounce", true);
            });

        // Text for arrow
        const arrowText = vis.svg
            .selectAll(".arrow-text")
            .data([null])
            .join("text")
            .attr("class", "arrow-text")
            .attr("x", vis.podiumStartX + vis.podiumWidth * 2.8 + (vis.podiumWidth / 4) + 2)
            .attr("y", positions[1].baseY - positions[1].heightAdjustment - (vis.podiumWidth * vis.dogImgSize) + 26)
            .style("opacity", 0)
            .style("font-size", "16px")
            .style("fill", "#333")
            .text("Click to choose me!")
            .attr("font-family", "Sour Gummy");

        arrowText.transition()
            .duration(700)
            .delay(7000)
            .style("opacity", 1)
            .on("end", () => {
                d3.select(".arrow-text").classed("diagonal-bounce", true);
            });

    }

    renderRanks(ranksFourToTen) {
        const vis = this;
        const rankItemWidth = vis.rankWidth / 7; // Adjust for spacing

        const contendersImages = vis.rankSvg
            .selectAll(".contenders-image")
            .data(ranksFourToTen)
            .join("image")
            .attr("class", "contenders-image")
            .attr("x", (d, i) => (i * rankItemWidth))
            .attr("width", rankItemWidth - 10)
            .attr("height", rankItemWidth - 10)
            .attr("href", d => d.image_url)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("opacity", 0)
            .classed("selected", d => this.selectedBreeds.includes(d))
            .on("click", (event, d) => {
                this.toggleSelection(d);
                vis.updateSelectionStyles(d);
            })
            .on("mouseover", (event, d) => {
                const tooltip = document.getElementById("breed-tooltip");
                // Ensure the image's opacity is 1 before showing the tooltip
                const imageElement = event.target;
                if (parseFloat(window.getComputedStyle(imageElement).opacity) === 1) {
                    console.log()
                    tooltip.style.display = "block";
                    tooltip.innerHTML = `
                        <table>
                            <tr>
                                <td>Fit for new owners:</td>
                                <td>${d.fit_for_novice_score} / 5</td>
                            </tr>
                            <tr>
                                <td>Exercise needs:</td>
                                <td>${d.exercise_need_score} / 5</td>
                            </tr>
                            <tr>
                                <td>Apartment adaptability:</td>
                                <td>${d.apartment_adaptability_score} / 5</td>
                            </tr>
                            <tr>
                                <td>Child-friendliness:</td>
                                <td>${d.kid_friendly_score} / 5</td>
                            </tr>
                            <tr>
                                <td>Shedding:</td>
                                <td>${d.shedding_score} / 5</td>
                            </tr>
                            <tr>
                                <td>Drooling:</td>
                                <td>${d.drooling_score} / 5</td>
                            </tr>
                            <tr>
                                <td>Cost per month:</td>
                                <td>$${(d.food_costs_per_year / 3).toFixed(2)}</td>
                            </tr>
                        </table>
                    `;
                }
            })
            .on("mousemove", (event) => {
                const tooltip = document.getElementById("breed-tooltip");
                const tooltipWidth = tooltip.offsetWidth;
                const tooltipHeight = tooltip.offsetHeight;
                const mouseX = event.pageX;
                const mouseY = event.pageY;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                // Default position: bottom-right of the cursor
                let left = mouseX + 10;
                let top = mouseY + 10;

                // Check if the tooltip's right edge exceeds the viewport
                if (mouseX + tooltipWidth + 10 > viewportWidth) {
                    left = mouseX - tooltipWidth - 10; // Position on the left of the cursor
                }

                // Check if the tooltip's bottom edge exceeds the viewport
                if (mouseY + tooltipHeight + 10 > viewportHeight) {
                    top = mouseY - tooltipHeight - 10; // Position above the cursor
                }

                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
            })
            .on("mouseout", () => {
                const tooltip = document.getElementById("breed-tooltip");
                tooltip.style.display = "none";
            });

        // Animate the images to fade in order
        contendersImages.transition()
            .duration(500)
            .delay((d, i) => 2500 + i * 500)
            .style("opacity", 1);

        const contendersText = vis.rankSvg
            .selectAll(".contenders-text")
            .data(ranksFourToTen)
            .enter()
            .append("text")
            .attr("class", "contenders-text")
            .attr("x", (d, i) => (i * rankItemWidth) + (rankItemWidth - 10) / 2)
            .attr("y", -20)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .attr("font-family", "Sour Gummy")
            .style("opacity", 0)
            .classed("selected", d => this.selectedBreeds.includes(d))
            .text(d => d.breed)
            .on("click", (event, d) => {
                this.toggleSelection(d);
                vis.updateSelectionStyles(d);
            });

        // Animate the text to fade in order
        contendersText.transition()
            .duration(500)
            .delay((d, i) => 3000 + i * 500)
            .style("opacity", 1);

        const contendersRank = vis.rankSvg
            .selectAll(".contenders-rank")
            .data(ranksFourToTen)
            .enter()
            .append("text")
            .attr("class", "contenders-rank")
            .attr("x", (d, i) => (i * rankItemWidth) + 10)
            .attr("dy", vis.rankHeight + 100)
            .attr("text-anchor", "start")
            .attr("font-size", "3vw")
            .attr("fill", "rgb(255, 215, 0)")
            .attr("font-family", "Rubik Bubbles")
            .style("opacity", 0)
            .text((d, i) => i + 4);

        // Animate the text to fade in order
        contendersRank.transition()
            .duration(500)
            .delay((d, i) => 2000 + i * 500)
            .attr("dy", vis.rankHeight + 40)
            .style("opacity", 1);
    }

    toggleSelection(breed) {
        const index = this.selectedBreeds.findIndex(selected => selected.breed === breed.breed);
        if (index === -1) {
            // Add breed to selected list if below the limit
            if (this.selectedBreeds.length < this.maxNumSelectedBreeds) {
                this.selectedBreeds.push(breed);
            } else {
                console.warn("Selection limit reached. You can only select up to 5 breeds.");
            }
        } else {
            // Remove breed from selected list
            this.selectedBreeds.splice(index, 1);
        }
        globalSelectedBreeds.length = 0;
        this.selectedBreeds.forEach(b => globalSelectedBreeds.push(b));
        console.log("Updated Global Selected Breeds:", globalSelectedBreeds);
    }

    updateSelectionStyles(breed) {
        const vis = this;

        d3.select("#podium")
            .selectAll("text")
            .filter(d => d === breed)
            .classed("selected", this.selectedBreeds.includes(breed));

        vis.rankSvg.selectAll(".contenders-text")
            .filter(d => d === breed)
            .classed("selected", this.selectedBreeds.includes(breed));

        vis.svg.selectAll(".podium-breed-image")
            .filter(d => d === breed)
            .classed("selected", this.selectedBreeds.includes(breed));

        vis.rankSvg.selectAll(".contenders-image")
            .filter(d => d === breed)
            .classed("selected", this.selectedBreeds.includes(breed));

    }

    getTopThreeBreeds() {
        return this.topthree;
    }
    getRanksFourToTen() {
        return this.ranksFourToTen;
    }


}
