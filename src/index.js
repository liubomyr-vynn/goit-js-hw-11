import Notiflix from 'notiflix';
import axios from 'axios';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const searchFormEl = document.querySelector('.js-search-form');
const galleryEl = document.querySelector('.js-gallery');
const loadMoreEl = document.querySelector('.js-load-more');

const BASE_URL = 'https://pixabay.com/api/';
const API_KEY = '34845172-53e67b2f5b8cb8ccf3124ff1b';

let currentPage = 1;
let totalPages = 1;
let currentQuery = '';

const searchParams = new URLSearchParams({
  key: API_KEY,
  image_type: 'photo',
  orientation: 'horizontal',
  safesearch: true,
  page: currentPage,
  per_page: 40,
});

function initialiseSimplelightbox() {
  const lightbox = new SimpleLightbox('.gallery a', {
    captionsData: 'alt',
    captionDelay: 250,
    animationSpeed: 300,
  });

  const galleryLinks = document.querySelectorAll('.gallery-link');
  galleryLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      lightbox.open(link.href);
    });
  });
}

searchFormEl.addEventListener('submit', handleSubmitOnButton);
loadMoreEl.addEventListener('click', handleButtonClickLoadMore);

async function fetchPhotos(userQuery) {
  const response = await axios.get(
    `${BASE_URL}?${searchParams}&q=${userQuery}&page=${currentPage}`
  );
  return response.data;
}

async function handleSubmitOnButton(event) {
  event.preventDefault();
  const userQuery = event.currentTarget.elements.searchQuery.value.trim();
  if (!userQuery) {
    Notiflix.Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
    return;
  }
  try {
    const data = await fetchPhotos(userQuery);
    const images = data.hits;
    totalPages = Math.ceil(data.totalHits / data.hits.length);
    renderGallery(images);

    if (images.length === 0) {
      loadMoreEl.classList.add('is-hidden');
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }
    Notiflix.Notify.info(`Hooray! We found ${data.total} images.`);
    currentQuery = userQuery;
    if (currentPage !== totalPages) {
      loadMoreEl.classList.add('is-hidden');
    }
    if (currentPage < totalPages) {
      loadMoreEl.classList.remove('is-hidden');
    }
  } catch (error) {
    console.warn(error);
  }
}

async function handleButtonClickLoadMore() {
  currentPage += 1;
  if (currentPage > totalPages) {
    return;
  }
  try {
    const data = await fetchPhotos(currentQuery);
    const images = data.hits;
    renderGalleryMore(images);
    if (currentPage === totalPages) {
      Notiflix.Notify.info(
        "We're sorry, but you've reached the end of search results."
      );
      loadMoreEl.classList.add('is-hidden');
    }
  } catch (error) {
    console.warn(error);
  }
}

function galleryMarkup(image) {
  return `
  <div class="photo-card">
    <div class="gallery-item">
      <a class="gallery-link" href="${image.largeImageURL}">
        <img class="gallery-img" src="${image.webformatURL}" alt="${image.tags}" loading="lazy"/>
      </a>
    </div>
    <div class="info">
      <p class="info-item">
        <b>Likes: ${image.likes}</b>
      </p>
      <p class="info-item">
        <b>Views: ${image.views}</b>
      </p>
      <p class="info-item">
        <b>Comments: ${image.comments}</b>
      </p>
      <p class="info-item">
        <b>Downloads: ${image.downloads}</b>
      </p>
    </div>
  </div>
  `;
}

function renderGallery(images) {
  galleryEl.innerHTML = images.map(image => galleryMarkup(image)).join('');

  initialiseSimplelightbox();
  return;
}

function renderGalleryMore(images) {
  galleryEl.insertAdjacentHTML(
    'beforeend',
    images.map(image => galleryMarkup(image)).join('')
  );

  initialiseSimplelightbox();

  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
  return;
}
