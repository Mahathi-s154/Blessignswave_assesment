const API_BASE_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.querySelector("#product-grid");

  if (productGrid) {
    loadProducts(productGrid);
  }
});

async function loadProducts(container) {
  container.innerHTML = '<p class="status-message">Loading products...</p>';

  try {
    const response = await fetch(`${API_BASE_URL}/products`);

    if (!response.ok) {
      throw new Error("Could not load products.");
    }

    const products = await response.json();
    renderProductGrid(container, products);
  } catch (error) {
    container.innerHTML = '<p class="status-message error">Unable to load products. Please check that the backend is running.</p>';
  }
}

function renderProductGrid(container, products) {
  if (!products.length) {
    container.innerHTML = '<p class="status-message">No products available.</p>';
    return;
  }

  container.innerHTML = products
    .map((product) => `
      <article class="product-card">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-card-body">
          <span class="category-pill">${product.category}</span>
          <h3>${product.name}</h3>
          <p class="price">₹${product.price}</p>
          <a class="button" href="product.html?id=${product.id}">View Details</a>
        </div>
      </article>
    `)
    .join("");
}
