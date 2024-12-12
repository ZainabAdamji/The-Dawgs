# Team: the_dawgs
CS171 Final Project - A guide for prospective dog owners
By Zainab Adamji, Yiyi Wang, Ashley Hernandez

**Overview**

This project is an interactive web application that provides users with personalized recommendations throughout key steps in the dog ownership process. The website starts by asking the user a set of questions, then allowing the user to explore their best options for dog breed(s), their favorite dog names, and then adoptable dogs within their selected state. The first visualization is the dog breeds visualization, which showcases the top 10 recommended dog breeds based on the user’s input, also allowing the user to explore the specific details of each breed by hovering over each dog. The second visualization is the dog names “speed dating” game which starts by asking the user to share their preferences for gender and name commonality, and uses these values along with their previously selected breeds to filter the names and prompting the user to build a list of up to 5 names that they like. The map dynamically updates based on user interactions, such as filtering by dog breeds, and provides detailed popups with additional information about each dog.

**Key Features**

Breed matching:

- Filters and ranks all 86 dog breeds based on questionnaire answers, displaying the top 10 with animations.
- Hovering over dog images reveals a detailed breakdown of breed attributes.
- Requires the user to select 1-5 favorite breeds to proceed.

Name brainstorming:

- Takes user input on dog gender.
- Implements a slider for user input on name commonality.
- Filters all dog names based on user input for dog breeds, dog gender, and name commonality, randomly displaying all matched names and ending the display once the user has selected 5 names (or when the list runs out).
- Hovering over dog names reveals specific details about the name, including the number of dogs that share that name, average popularity, and the most common breed associated with that name.

Shelter (dog) locator:

- Interactive state map that displays adoptable dogs using geo-coordinates.
- Dynamic filtering by selected breeds with a reset option.
- Informative popups with dog details, styled with a focus on aesthetics.
- No-data indication when no dogs match the current filter criteria.

Other:
- Conclusion page summarizes the user’s choice of breeds and names from previous pages.

**Code Files**

Javascript:
- main.js: Handles scrolling mechanism, initialises and updates all classes.
- breed.js: The breed matching class renders the top 10 matched breeds visualisation, handling the filtering and ordering of breeds, and triggers necessary animations.
- dogNameVis.js: The dog name vis class renders the dog name brainstorming game/visualisation, manages the name commonality slider and gender dropdown input, handles the filtering of names, displays the tooltip, and handles other animations (like/skip functionality).
- page_4: This file is the container for Page 4 of the application, connecting all components and layouts for the adoption message, heat map, state dropdown, state map and related functionality.
- page4-2.js: Handles the interactions and functionalities specific to heatmaps so dynamic updates and any logic related to heatmap-driven interactions.
- page4-3.js: Manages state selection, dropdown changes, and integrates filtering functionality.
- heatMapVis.js: Renders a heat map visualization of the number of adoptable dogs in the United States according to our data.
- stateMap.js: Handles the rendering of the interactive state map, like the visualization logic, filtering mechanism, and detailed popups.

CSS:
- style.css: Overall styling
- page_1.css: Title page styling
- intro.css: Introduction page styling
- questions.css: Questionnaire styling
- matched-breeds.css: Matched breeds styling
- page_3.css: Name brainstorming styling
- page_4.css: Heat map, stateMap styling
- conclusion.css: Conclusion page styling

HTML:
- index.html: Hosts the project structure and integrates various scripts and styles

**Libraries Used**
- D3.js: For creating the interactive state map and rendering data-driven elements.
- TopoJSON: For processing and displaying GeoJSON data for state boundaries.
- noUiSlider: For implementing a customizable slider for dog name commonality (pulled from HW 5).

**Data**
- Kaggle Dog Ranking Dataset: https://www.kaggle.com/datasets/jainaru/dog-breeds-ranking-best-to-worst
- Kaggle Dog Breeds Dataset: https://www.kaggle.com/datasets/yonkotoshiro/dogs-breeds
- NYC Dog Licensing Dataset: https://data.cityofnewyork.us/Health/NYC-Dog-Licensing-Dataset/nu7n-tubp/about_data
- Kaggle Dog Adoption Dataset: https://www.kaggle.com/datasets/whenamancodes/dog-adoption
- Kaggle US Shelters Dataset: https://www.kaggle.com/datasets/thedevastator/adoptable-dogs-in-the-us

**Project Website**
https://code.harvard.edu/pages/yiw029/the_dawgs/

**Screencast Video**
https://youtu.be/9Q5D-G_SvjM

**Non-obvious features**
- The breed matching algorithm ensures that the top-ranked breed meets all the user's requirements. If fewer than 10 breeds meet these criteria, the remaining slots are filled with breeds that most closely match the user's requirements to guarantee 10 options.
- If no breeds are selected, the user cannot scroll or press the confirm button to proceed. In such cases, an error message is displayed.
- Users can select up to 5 breeds. To add more, they must first deselect some of their current selections.
- Hovering over matched breeds is only enabled after the animation completes (when the opacity reaches 1) to prevent confusion during loading.
- A moving arrow prompts users to select breeds, guiding them through the clicking mechanism.
- Users can scroll up to modify their questionnaire answers, which dynamically updates the displayed set of matching breeds.
- When no dogs match the selected filter, the state remains visible in white, and a message appears in the center.
- Even when filtered data is unavailable, the map retains the shape of the selected state for better user orientation.
- The dog's breed name is displayed with a subtle glow effect for added visual appeal.
- The dropdown state selection is seamlessly integrated with session storage, allowing for persistent state data across page reloads.
- When “More Details” is selected in the pop-up card, that takes the user to the link to the actual dog so they can learn more about that specific dog.
- The user's selected state is saved in the session storage, allowing the state map to retain its configuration when the page is refreshed or revisited.
