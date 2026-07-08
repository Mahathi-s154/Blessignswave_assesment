const API_BASE_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.querySelector("#product-grid");
  const productDetail = document.querySelector("#product-detail");
  const chatForm = document.querySelector("#chat-form");

  if (productGrid) {
    loadProducts(productGrid);
  }

  if (productDetail) {
    loadProductDetail(productDetail);
  }

  if (chatForm) {
    setupChat(chatForm);
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


async function loadProductDetail(container) {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    container.innerHTML = '<p class="status-message error">Product ID is missing.</p>';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);

    if (response.status === 404) {
      container.innerHTML = '<p class="status-message error">Product not found.</p>';
      return;
    }

    if (!response.ok) {
      throw new Error("Could not load product.");
    }

    const product = await response.json();
    renderProductDetail(container, product);
  } catch (error) {
    container.innerHTML = '<p class="status-message error">Unable to load product. Please check that the backend is running.</p>';
  }
}

function renderProductDetail(container, product) {
  container.innerHTML = `
    <img class="detail-image" src="${product.image}" alt="${product.name}">
    <div class="detail-content">
      <span class="category-pill">${product.category}</span>
      <h2>${product.name}</h2>
      <p>${product.description}</p>
      <dl class="product-meta">
        <div>
          <dt>Price</dt>
          <dd>₹${product.price}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>${product.category}</dd>
        </div>
        <div>
          <dt>Stock</dt>
          <dd>${product.stock}</dd>
        </div>
      </dl>
    </div>
  `;
}


function setupChat(form) {
  const input = document.querySelector("#chat-input");
  const messages = document.querySelector("#chat-messages");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = input.value.trim();
    if (!message) {
      return;
    }

    addChatMessage(messages, message, "user");
    input.value = "";
    input.focus();

    const loadingMessage = addChatMessage(messages, "Thinking...", "bot");

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Chat request failed.");
      }

      loadingMessage.textContent = data.answer;
    } catch (error) {
      loadingMessage.textContent = error.message || "Unable to get an answer right now.";
      loadingMessage.classList.add("error-message");
    }
  });
}

function addChatMessage(container, text, sender) {
  const message = document.createElement("div");
  message.className = `message ${sender}-message`;
  message.textContent = text;
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
  return message;
}
