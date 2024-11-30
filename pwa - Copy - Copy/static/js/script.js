document.addEventListener('DOMContentLoaded', () => {
    console.log("Script loaded successfully");

    const inbuiltRadio = document.getElementById('inbuilt');
    const userDefinedRadio = document.getElementById('userdefined');
    const movieDropdown = document.getElementById('movie_title');
    const movieInput = document.getElementById('movie_title_input');

    // Toggle input fields based on the selection
    const toggleMovieSelection = () => {
        if (inbuiltRadio.checked) {
            movieDropdown.disabled = false;
            movieInput.disabled = true;
            movieInput.value = ""; // Clear the text input
        } else if (userDefinedRadio.checked) {
            movieDropdown.disabled = true;
            movieInput.disabled = false;
            movieDropdown.value = ""; // Clear the dropdown selection
        }
    };

    // Fetch movies dynamically for the dropdown (if required)
    const fetchMovies = async () => {
        try {
            const response = await fetch('/api/movies'); // Adjust the route as needed
            if (!response.ok) throw new Error("Failed to fetch movies");
            
            const movies = await response.json();
            movieDropdown.innerHTML = '<option value="">Select a Movie</option>'; // Reset dropdown
            movies.forEach(movie => {
                const option = document.createElement('option');
                option.value = movie.name; // Assuming 'name' is the key in your API
                option.textContent = movie.name;
                movieDropdown.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching movies:", error);
            movieDropdown.innerHTML = '<option value="">Error loading movies</option>';
        }
    };

    // Event Listeners
    inbuiltRadio.addEventListener('change', toggleMovieSelection);
    userDefinedRadio.addEventListener('change', toggleMovieSelection);

    // Initialize
    toggleMovieSelection();
    fetchMovies(); // Comment this out if movies are hardcoded in HTML
});
