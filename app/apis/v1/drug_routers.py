from fastapi import APIRouter

drug_router = APIRouter(prefix="/drugs", tags=["Drugs"])


@drug_router.get("/search")
async def search_drugs(keyword: str):
    return {
        "keyword": keyword,
        "results": [
            {
                "drug_name": "메트포르민정 500mg",
                "ingredient_name": "Metformin",
                "manufacturer": "예시제약",
                "dosage": "500mg",
                "efficacy": "혈당 조절 보조",
                "source": "MFDS",
            }
        ],
    }