const apiKey = '360318c5412234b7670933d70910a6ee'; 
const marketPrices = {}; 


async function fetchData() {
    fetchPopularMovies();
    fetchPopularSeries();
}


async function fetchPopularMovies() {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=${getRandomPageNumber()}`;
    const movieList = document.getElementById('movie-list');
    movieList.innerHTML = ''; 

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            data.results.forEach(movie => displayItem(movie, movieList, 'movie'));
        } else {
            console.warn('No popular movies found!');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


async function fetchPopularSeries() {
    const url = `https://api.themoviedb.org/3/tv/popular?api_key=${apiKey}&language=en-US&page=${getRandomPageNumber()}`;
    const seriesList = document.getElementById('series-list');
    seriesList.innerHTML = ''; 

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            data.results.forEach(series => displayItem(series, seriesList, 'series'));
        } else {
            console.warn('No popular series found!');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Display movies/series with dynamic pricing and market actions
function displayItem(item, container, type) {
    const itemElement = document.createElement('div');
    itemElement.className = 'item';

    const basePrice = calculateBasePrice(item);
    const itemId = `${type}-${item.id}`;

    if (!marketPrices[itemId]) {
        marketPrices[itemId] = basePrice;
    }

    const currentPrice = marketPrices[itemId];
    const posterPath = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    const releaseYear = item.release_date ? item.release_date.split('-')[0] : item.first_air_date.split('-')[0];

    itemElement.innerHTML = 
        `<img src="${posterPath}" alt="${item.title || item.name}">
        <div class="item-title">${item.title || item.name} (${releaseYear})</div>
        <div class="item-price">Price: ₹${currentPrice.toFixed(2)}</div>
        <div class="buttons">
            <button onclick="confirmAction('buy', '${itemId}')">Buy</button>
            <button onclick="confirmAction('sell', '${itemId}')">Sell</button>
        </div>`;
    
    itemElement.dataset.title = (item.title || item.name).toLowerCase(); 
    container.appendChild(itemElement);
}


function confirmAction(action, itemId) {
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.innerHTML = 
        `<div class="modal-content">
            <p>How many do you want to ${action}?</p>
            <input type="number" id="quantity-input" min="1" placeholder="Quantity" />
            <button onclick="executeAction('${action}', '${itemId}')">Confirm</button>
            <button onclick="closeModal(this)">Cancel</button>
        </div>`;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}


function executeAction(action, itemId) {
    const quantity = parseInt(document.getElementById('quantity-input').value);
    if (!quantity || quantity <= 0) {
        alert('Please enter a valid quantity.');
        return;
    }

    if (action === 'buy') {
        marketPrices[itemId] *= 1.05; 
    } else {
        marketPrices[itemId] *= 0.95; 
    }

    closeModal();
    alert(`Successfully ${action}ed ${quantity} of ${itemId}. New price: ₹${marketPrices[itemId].toFixed(2)}`);
    refreshItemPrices();
}


function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}


function refreshItemPrices() {
    document.querySelectorAll('.item').forEach(itemElement => {
        const itemId = itemElement.querySelector('button').onclick.toString().match(/'(.*?)'/)[1];
        const currentPrice = marketPrices[itemId];
        itemElement.querySelector('.item-price').textContent = `Price: ₹${currentPrice.toFixed(2)}`;
    });
}


function calculateBasePrice(item) {
    const popularityFactor = item.popularity / 10; 
    const voteAverageFactor = item.vote_average / 2; 
    return Math.max(1, 10 + (popularityFactor + voteAverageFactor)); 
}


function getRandomPageNumber() {
    return Math.floor(Math.random() * 100) + 1; 
}

// Search functionality using TMDB API
async function searchItems() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = ''; 

    if (!query) {
        return; 
    }


    const movieSearchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}&language=en-US&page=1`;
    const seriesSearchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${query}&language=en-US&page=1`;

    try {
        const [movieResponse, seriesResponse] = await Promise.all([
            fetch(movieSearchUrl),
            fetch(seriesSearchUrl)
        ]);

        const movieData = await movieResponse.json();
        const seriesData = await seriesResponse.json();

        if (movieData.results && movieData.results.length > 0) {
            movieData.results.forEach(movie => displayItem(movie, searchResults, 'movie'));
        }

        if (seriesData.results && seriesData.results.length > 0) {
            seriesData.results.forEach(series => displayItem(series, searchResults, 'series'));
        }

        if (!movieData.results.length && !seriesData.results.length) {
            searchResults.innerHTML = '<p>No results found.</p>';
        }
    } catch (error) {
        console.error('Error fetching search results:', error);
    }
}


fetchData();
