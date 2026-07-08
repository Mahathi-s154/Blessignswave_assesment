import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator


app = FastAPI(title="E-commerce AI Chatbot API")
router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent
PRODUCTS_FILE = BASE_DIR / "products.json"
FAQS_FILE = BASE_DIR / "faqs.json"
TMP_PRODUCTS_FILE = Path("/tmp/products.json")

load_dotenv(BASE_DIR / ".env")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    price: float = Field(..., gt=0)
    category: str = Field(..., min_length=1)
    stock: int = Field(..., ge=0)
    image: str = Field(..., min_length=1)

    @field_validator("name", "description", "category", "image")
    @classmethod
    def text_must_not_be_blank(cls, value: str) -> str:
        cleaned_value = value.strip()
        if not cleaned_value:
            raise ValueError("Field cannot be blank.")
        return cleaned_value


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)


def running_on_vercel() -> bool:
    return os.getenv("VERCEL") == "1"


def read_json_file(path: Path) -> list[dict[str, Any]]:
    try:
        with path.open("r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError as error:
        raise HTTPException(status_code=500, detail=f"Data file not found: {path.name}") from error
    except json.JSONDecodeError as error:
        raise HTTPException(status_code=500, detail=f"Data file is invalid: {path.name}") from error


def write_json_file(path: Path, data: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)


def get_products_path() -> Path:
    if not running_on_vercel():
        return PRODUCTS_FILE

    if not TMP_PRODUCTS_FILE.exists():
        write_json_file(TMP_PRODUCTS_FILE, read_json_file(PRODUCTS_FILE))

    return TMP_PRODUCTS_FILE


def get_products() -> list[dict[str, Any]]:
    return read_json_file(get_products_path())


def get_faqs() -> list[dict[str, Any]]:
    return read_json_file(FAQS_FILE)


def build_chat_context() -> str:
    data = {
        "faqs": get_faqs(),
        "products": get_products(),
    }
    return json.dumps(data, indent=2, ensure_ascii=False)


def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")

    try:
        from groq import Groq
    except ImportError as error:
        raise HTTPException(status_code=500, detail="Groq SDK is not installed.") from error

    return Groq(api_key=api_key)


@router.get("/")
def root():
    return {"message": "E-commerce AI Chatbot API is running."}


@router.get("/products")
def list_products():
    return get_products()


@router.get("/products/{product_id}")
def get_product(product_id: int):
    for product in get_products():
        if product["id"] == product_id:
            return product

    raise HTTPException(status_code=404, detail="Product not found.")


@router.post("/products", status_code=201)
def add_product(product: ProductCreate):
    products = get_products()
    next_id = max((item["id"] for item in products), default=0) + 1
    new_product = {"id": next_id, **product.model_dump()}
    products.append(new_product)
    write_json_file(get_products_path(), products)
    return new_product


@router.post("/chat")
def chat(request: ChatRequest):
    user_message = request.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Chat message cannot be empty.")

    system_prompt = f'''You are a helpful e-commerce store assistant.
You can answer only using the given FAQ data and product data.
Do not invent products, prices, stock, policies, discounts, categories, or availability.
If information is not available, politely say that the information is not available.
For product-related questions, use only the products in the product data.
If a user asks about a product that is not present, say: "Sorry, I could not find that product in our current product list."
Use Indian rupees when mentioning prices.

Store data:
{build_chat_context()}'''.strip()

    client = get_groq_client()
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.1,
            max_tokens=350,
        )
    except Exception as error:
        raise HTTPException(status_code=503, detail="AI service failed. Please try again later.") from error

    answer = completion.choices[0].message.content
    return {"answer": answer}


app.include_router(router)
app.include_router(router, prefix="/api")
