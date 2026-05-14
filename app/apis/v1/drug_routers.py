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


@drug_router.post("/records/{record_id}/medications/{medication_id}/verify")
async def verify_medication(record_id: int, medication_id: int):
    return {
        "record_id": record_id,
        "medication_id": medication_id,
        "is_verified": True,
        "api_status": "selected",
        "message": "약품 후보가 선택되었습니다.",
    }