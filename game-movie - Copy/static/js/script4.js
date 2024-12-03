<script>
    const categoryDropdown = document.getElementById('category');
    const itemDropdown = document.getElementById('item_title');
    const customTitleInput = document.getElementById('item_title_input'); // Optional for custom titles

    // Handle category change (movie or game)
    categoryDropdown.addEventListener('change', async function () {
        const selectedCategory = this.value;

        // Clear the second dropdown and custom title field
        itemDropdown.innerHTML = '<option value="">--Select--</option>';
        customTitleInput.value = ''; // Clear the custom title input

        // Disable the dropdown if custom title is being used
        if (customTitleInput.value !== '') {
            itemDropdown.disabled = true;
        } else {
            itemDropdown.disabled = false;
        }

        if (selectedCategory === 'movie' || selectedCategory === 'game') {
            try {
                // Fetch items based on the selected category
                const response = await fetch(`/api/items?category=${selectedCategory}`);
                
                // Check if the response is okay
                if (!response.ok) {
                    throw new Error("Failed to fetch items");
                }

                const items = await response.json();

                // Check if items is an array (we expect a list of movie/game titles)
                if (Array.isArray(items) && items.length > 0) {
                    items.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item; // Use the item name as the value
                        option.textContent = item; // Use the item name as the display text
                        itemDropdown.appendChild(option);
                    });

                    // Enable the dropdown
                    itemDropdown.disabled = false;
                } else {
                    alert("No items found for this category.");
                }
            } catch (error) {
                console.error("Error fetching items:", error);
                alert("Failed to load items.");
            }
        } else {
            // Disable the dropdown if no valid category is selected
            itemDropdown.disabled = true;
        }
    });

    // Automatically populate the custom title input when a title is selected from the dropdown
    itemDropdown.addEventListener('change', function () {
        customTitleInput.value = itemDropdown.value;
    });

    // Disable the item dropdown if user starts typing in the custom title input
    customTitleInput.addEventListener('input', function () {
        if (customTitleInput.value !== '') {
            itemDropdown.disabled = true;
        } else {
            // Re-enable the dropdown if the custom title field is cleared
            const selectedCategory = categoryDropdown.value;
            if (selectedCategory) {
                itemDropdown.disabled = false;
            }
        }
    });
</script>
