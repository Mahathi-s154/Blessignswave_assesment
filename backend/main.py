import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(title="E-commerce AI Chatbot API")

BASE_DIR = Path(__file__).resolve().parent
PRODUCTS_FILE = BASE_DIR / "products.json"

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
        json.dump(data, file, indent=2)


def get_products() -> list[dict[str, Any]]:
    return read_json_file(PRODUCTS_FILE)


@app.get("/")
def root():
    return {"message": "E-commerce AI Chatbot API is running."}


@app.get("/products")
def list_products():
    return get_products()


@app.get("/products/{product_id}")
def get_product(product_id: int):
    for product in get_products():
        if product["id"] == product_id:
            return product

    raise HTTPException(status_code=404, detail="Product not found.")


@app.post("/products", status_code=201)
def add_product(product: ProductCreate):
    products = get_products()
    next_id = max((item["id"] for item in products), default=0) + 1
    new_product = {"id": next_id, **product.model_dump()}
    products.append(new_product)
    write_json_file(PRODUCTS_FILE, products)
    return new_product
