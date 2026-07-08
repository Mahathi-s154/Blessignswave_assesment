# Blessings Wave E-commerce AI Chatbot

A simple assignment-ready e-commerce storefront built with FastAPI, plain HTML, CSS, JavaScript, and local JSON files. It includes a product grid, product detail page, product creation API, and a Groq-powered FAQ chatbot that answers only from the stored FAQ and product data.

## Features

- View all products in a responsive product grid
- View a single product detail page
- Add new products through a FastAPI endpoint
- Ask store policy and product questions through a chatbot
- Chatbot uses local `faqs.json` and `products.json` as its source of truth
- Local JSON storage, no database required

## Tech Stack

- Backend: Python, FastAPI, Uvicorn, local JSON files
- AI: Groq API
- Frontend: HTML, CSS, JavaScript, Fetch API

## Folder Structure

```text
ecommerce-ai-chatbot/
├── backend/
│   ├── main.py
│   ├── products.json
│   ├── faqs.json
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── product.html
│   ├── style.css
│   └── script.js
├── README.md
└── .gitignore
```

## Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
```

For Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Add your Groq API key:

```env
GROQ_API_KEY=your_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Run the backend:

```bash
uvicorn main:app --reload
```

The backend runs at:

```text
http://localhost:8000
```

## Frontend Setup

Use Live Server in VS Code, or run:

```bash
cd frontend
python -m http.server 5500
```

Open:

```text
http://localhost:5500
```

## API Endpoints

### GET `/products`

Returns all products.

### GET `/products/{product_id}`

Returns one product by ID. If the product does not exist, returns `404`.

### POST `/products`

Adds a new product to `products.json`.

Request body:

```json
{
  "name": "Wireless Keyboard",
  "description": "A compact keyboard for daily use.",
  "price": 799,
  "category": "Electronics",
  "stock": 14,
  "image": "https://via.placeholder.com/300x220?text=Keyboard"
}
```

### POST `/chat`

Sends a message to the chatbot.

Request body:

```json
{
  "message": "Do you have anything under ₹500?"
}
```

Response:

```json
{
  "answer": "Yes, we have Wireless Mouse for ₹499."
}
```

## Example Chatbot Questions

- What is your return policy?
- How long does shipping take?
- What payment methods do you accept?
- Do you have anything under ₹500?
- Show me electronics products
- Which product is the cheapest?
- Is Wireless Mouse in stock?
- Suggest something under ₹1000
- Do you sell clothing?
- Do you have an iPhone?

## Notes

This project intentionally uses local JSON files instead of a database to keep the assignment simple. Products are stored in `backend/products.json`, and store FAQs are stored in `backend/faqs.json`.

The chatbot prompt instructs the model to answer only from the FAQ and product JSON data. It should not invent products, prices, stock, policies, discounts, or categories.

## Deploying to Vercel

This project is configured for Vercel with the static frontend served from `frontend/` and the FastAPI backend served under `/api`.

1. Push the latest code to GitHub.
2. In Vercel, import the GitHub repository.
3. Keep the root directory as the repository root.
4. Add these Environment Variables in Vercel Project Settings:

```env
GROQ_API_KEY=your_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

5. Deploy the project.

After deployment, test these URLs on your Vercel domain:

```text
/
/product.html?id=1
/api/products
/api/products/1
/api/chat
```

The deployed API reads product and FAQ data from local JSON files included in the repository. Adding products through `POST /api/products` on Vercel uses temporary serverless storage and is not a permanent database replacement.
