import os
import random

import numpy as np
import requests
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

load_dotenv()

API_KEY = os.getenv("DRUG_API_KEY") or os.getenv("MFDS_API_KEY")
API_URL = "https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService07/getDrugPrdtPrmsnInq07"
FORM_PATH = "tests/mock_data/prescription_form.png"

session = requests.Session()
retries = Retry(
    total=3,
    connect=3,
    read=3,
    backoff_factor=1.5,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET"],
)
session.mount("https://", HTTPAdapter(max_retries=retries))
session.mount("http://", HTTPAdapter(max_retries=retries))


def fetch_random_drugs(count=3):
    if not API_KEY:
        print("API 호출 실패: DRUG_API_KEY / MFDS_API_KEY 가 설정되지 않았습니다.")
        return fallback_drugs(count)

    page = random.randint(1, 200)
    params = {
        "serviceKey": API_KEY,
        "pageNo": page,
        "numOfRows": count,
        "type": "json",
    }

    try:
        response = session.get(API_URL, params=params, timeout=(5, 30))
        response.raise_for_status()

        try:
            data = response.json()
        except ValueError as e:
            preview = response.text[:300].replace("\n", " ")
            raise ValueError(f"JSON 파싱 실패 / body preview: {preview}") from e

        body = data.get("body", {}) if isinstance(data, dict) else {}
        items = body.get("items", [])

        if isinstance(items, dict):
            if "item" in items:
                items = items["item"]
            else:
                items = [items]

        if not isinstance(items, list) or not items:
            print("API 응답에 유효한 약품 목록이 없어 fallback 데이터 사용")
            return fallback_drugs(count)

        result = []
        for item in items[:count]:
            material = item.get("MATERIAL_NAME", "") or ""
            if "|" in material:
                ingredient = material.split("|")[1].replace("성분명 :", "").strip()
            else:
                ingredient = "성분 정보 없음"

            result.append(
                {
                    "name": (item.get("ITEM_NAME", "알 수 없음") or "알 수 없음")[:20],
                    "company": (item.get("ENTP_NAME", "알 수 없음") or "알 수 없음")[:10],
                    "ingredient": ingredient[:15],
                }
            )

        if not result:
            print("파싱된 약품 결과가 없어 fallback 데이터 사용")
            return fallback_drugs(count)

        return result

    except requests.exceptions.Timeout as e:
        print(f"API 호출 실패: timeout - {e}")
        return fallback_drugs(count)
    except requests.exceptions.RequestException as e:
        print(f"API 호출 실패: 요청 오류 - {e}")
        return fallback_drugs(count)
    except Exception as e:
        print(f"API 호출 실패: {e}")
        return fallback_drugs(count)


def fallback_drugs(count=3):
    drugs = [
        {"name": "암로디핀정 5mg", "company": "동아제약", "ingredient": "암로디핀베실산염"},
        {"name": "로수바스타틴 10mg", "company": "한독", "ingredient": "로수바스타틴칼슘"},
        {"name": "메트포르민 500mg", "company": "일양약품", "ingredient": "메트포르민염산염"},
        {"name": "아스피린 100mg", "company": "바이엘코리아", "ingredient": "아세틸살리실산"},
        {"name": "오메프라졸 20mg", "company": "유한양행", "ingredient": "오메프라졸"},
    ]
    return random.sample(drugs, min(count, len(drugs)))


def apply_noise(img, intensity=3000):
    draw = ImageDraw.Draw(img)
    for _ in range(intensity):
        x = random.randint(0, img.width - 1)
        y = random.randint(0, img.height - 1)
        draw.point((x, y), fill=(180, 180, 180))
    return img


def apply_rotation(img, angle=None):
    if angle is None:
        angle = random.uniform(2, 10) * random.choice([-1, 1])
    return img.rotate(angle, fillcolor=(255, 255, 255), expand=False)


def apply_blur(img, radius=None):
    if radius is None:
        radius = random.uniform(1.5, 3.0)
    return img.filter(ImageFilter.GaussianBlur(radius=radius))


def apply_brightness(img, mode="over"):
    enhancer = ImageEnhance.Brightness(img)
    factor = random.uniform(1.6, 2.0) if mode == "over" else random.uniform(0.4, 0.6)
    return enhancer.enhance(factor)


def apply_partial_block(img):
    draw = ImageDraw.Draw(img)
    for _ in range(random.randint(1, 3)):
        x1 = random.randint(0, max(1, img.width - 200))
        y1 = random.randint(400, min(1200, img.height - 60))
        x2 = x1 + random.randint(80, 200)
        y2 = y1 + random.randint(20, 50)
        draw.rectangle([x1, y1, x2, y2], fill=(0, 0, 0))
    return img


def find_coeffs(source_coords, target_coords):
    matrix = []
    for s, t in zip(source_coords, target_coords, strict=False):
        matrix.append([t[0], t[1], 1, 0, 0, 0, -s[0] * t[0], -s[0] * t[1]])
        matrix.append([0, 0, 0, t[0], t[1], 1, -s[1] * t[0], -s[1] * t[1]])
    A = np.matrix(matrix, dtype=float)
    B = np.array(source_coords).reshape(8)
    res = np.dot(np.linalg.inv(A.T * A) * A.T, B)
    return np.array(res).reshape(8)


def apply_perspective(img):
    width, height = img.size
    offset = random.randint(20, 60)
    src = [(0, 0), (width, 0), (width, height), (0, height)]
    dst = [
        (random.randint(0, offset), random.randint(0, offset)),
        (width - random.randint(0, offset), random.randint(0, offset)),
        (width - random.randint(0, offset), height - random.randint(0, offset)),
        (random.randint(0, offset), height - random.randint(0, offset)),
    ]
    coeffs = find_coeffs(dst, src)
    return img.transform(img.size, Image.PERSPECTIVE, coeffs, Image.BICUBIC)


LOW_CONFIDENCE_PATTERNS = {
    "noise_light": lambda img: apply_noise(img, 1500),
    "noise_medium": lambda img: apply_noise(img, 2500),
    "rotate_slight": lambda img: apply_rotation(img, random.uniform(1, 3)),
    "rotate_medium": lambda img: apply_rotation(img, random.uniform(3, 5)),
    "blur_minimal": lambda img: apply_blur(img, random.uniform(1.0, 1.5)),
    "blur_light": lambda img: apply_blur(img, random.uniform(1.5, 2.0)),
    "overexposed_light": lambda img: apply_brightness(img, "over"),
    "underexposed_light": lambda img: apply_brightness(img, "under"),
    "partial_block_small": lambda img: apply_partial_block(img),
    "noise_rotate_slight": lambda img: apply_rotation(apply_noise(img, 1000), random.uniform(1, 3)),
    "noise_blur_minimal": lambda img: apply_blur(apply_noise(img, 1000), 1.2),
    "rotate_blur_light": lambda img: apply_blur(apply_rotation(img, random.uniform(1, 3)), 1.5),
    "bright_noise": lambda img: apply_noise(apply_brightness(img, "over"), 1000),
    "dark_noise": lambda img: apply_noise(apply_brightness(img, "under"), 1000),
    "block_noise_light": lambda img: apply_noise(apply_partial_block(img), 1000),
    "perspective_slight": lambda img: apply_perspective(img),
    "perspective_noise": lambda img: apply_noise(apply_perspective(img), 1000),
    "rotate_bright": lambda img: apply_brightness(apply_rotation(img, random.uniform(1, 3)), "over"),
    "blur_block_light": lambda img: apply_blur(apply_partial_block(img), 1.5),
    "noise_dark_blur": lambda img: apply_blur(apply_brightness(apply_noise(img, 800), "under"), 1.2),
}

FAILED_PATTERNS = {
    "heavy_blur": lambda img: apply_blur(img, random.uniform(3.0, 4.0)),
    "heavy_noise_blur": lambda img: apply_blur(apply_noise(img, 5000), 3.0),
    "block_blur": lambda img: apply_blur(apply_partial_block(apply_partial_block(img)), 3.5),
    "heavy_rotate_blur": lambda img: apply_blur(apply_rotation(img, random.uniform(8, 12)), 3.0),
    "overexposed_blur": lambda img: apply_blur(apply_brightness(img, "over"), 3.5),
    "underexposed_blur": lambda img: apply_blur(apply_brightness(img, "under"), 3.5),
    "perspective_blur": lambda img: apply_blur(apply_perspective(img), 3.0),
    "noise_block_blur": lambda img: apply_blur(apply_partial_block(apply_noise(img, 4000)), 3.0),
    "heavy_noise_rotate": lambda img: apply_rotation(apply_noise(img, 6000), random.uniform(6, 10)),
    "triple_degradation": lambda img: apply_blur(apply_noise(apply_rotation(img, random.uniform(5, 8)), 3000), 2.5),
}


def draw_text_on_form(img, drugs, confidence="high"):
    draw = ImageDraw.Draw(img)

    hospitals = ["서울중앙병원", "연세의원", "한강병원", "강남세브란스", "삼성서울병원"]
    doctors = ["김철수", "이영희", "박민준", "최수연", "정대호"]
    diseases = ["Z03", "E11", "I10", "K21", "M54"]
    patient_names = ["홍길동", "김민수", "이지은", "박서준", "최유리"]
    frequencies = ["1일 1회", "1일 2회", "1일 3회"]
    timings = ["식후 30분", "식전 30분", "취침 전"]

    hospital = random.choice(hospitals)
    doctor = random.choice(doctors)
    disease = random.choice(diseases)
    patient = random.choice(patient_names)

    try:
        font = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 28)
        font_sm = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 22)
    except Exception:
        font = ImageFont.load_default()
        font_sm = font

    draw.text((1200, 118), "12345678", font=font_sm, fill=(0, 0, 0))
    draw.text((500, 168), "2026", font=font_sm, fill=(0, 0, 0))
    draw.text((640, 168), "05", font=font_sm, fill=(0, 0, 0))
    draw.text((730, 168), "15", font=font_sm, fill=(0, 0, 0))
    draw.text((300, 230), hospital, font=font, fill=(0, 0, 0))
    draw.text((300, 285), f"02-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}", font=font_sm, fill=(0, 0, 0))
    draw.text((950, 230), patient, font=font, fill=(0, 0, 0))
    draw.text(
        (950, 285),
        f"{random.randint(700101, 991231)}-{random.randint(1000000, 2999999)}",
        font=font_sm,
        fill=(0, 0, 0),
    )
    draw.text((300, 370), disease, font=font, fill=(0, 0, 0))
    draw.text((950, 370), doctor, font=font, fill=(0, 0, 0))
    draw.text((950, 420), "의사", font=font_sm, fill=(0, 0, 0))

    y_pos = 520
    for drug in drugs:
        name = drug["name"]
        frequency = random.choice(frequencies)
        timing = random.choice(timings)

        if confidence == "low" and random.random() > 0.5 and len(name) >= 2:
            name = name[:-2] + "??"

        draw.text((80, y_pos), name, font=font, fill=(0, 0, 0))
        draw.text((680, y_pos), "1정", font=font, fill=(0, 0, 0))
        draw.text((830, y_pos), frequency.split("회")[0] + "회", font=font, fill=(0, 0, 0))
        draw.text((980, y_pos), "30", font=font, fill=(0, 0, 0))
        draw.text((80, y_pos + 32), f"({drug['ingredient']}) {timing}", font=font_sm, fill=(80, 80, 80))
        y_pos += 80

    draw.text((500, 1750), "3", font=font, fill=(0, 0, 0))
    return img


def generate_prescription(output_path, confidence="high", pattern=None):
    drugs = fetch_random_drugs(count=random.randint(2, 4))
    img = Image.open(FORM_PATH).copy()
    img = draw_text_on_form(img, drugs, confidence)

    if confidence == "low" and pattern:
        img = LOW_CONFIDENCE_PATTERNS[pattern](img)
    elif confidence == "failed" and pattern:
        img = FAILED_PATTERNS[pattern](img)

    img.save(output_path)
    print(f"[{confidence}] {pattern or ''} → {output_path}")


def generate_all():
    base = "tests/mock_data/images"

    os.makedirs(f"{base}/high_confidence", exist_ok=True)
    os.makedirs(f"{base}/low_confidence", exist_ok=True)
    os.makedirs(f"{base}/failed", exist_ok=True)

    print("고신뢰도 처방전 생성 중...")
    for i in range(5):
        generate_prescription(f"{base}/high_confidence/prescription_{i + 1}.jpg", "high")

    print("저신뢰도 처방전 생성 중... (오독 여지 있음)")
    low_patterns = list(LOW_CONFIDENCE_PATTERNS.keys())
    for i, pattern in enumerate(low_patterns):
        generate_prescription(f"{base}/low_confidence/prescription_{i + 1}_{pattern}.jpg", "low", pattern)

    print("실패 케이스 생성 중... (보정 시도 필요)")
    fail_patterns = list(FAILED_PATTERNS.keys())
    for i, pattern in enumerate(fail_patterns):
        generate_prescription(f"{base}/failed/prescription_{i + 1}_{pattern}.jpg", "failed", pattern)

    print("전체 생성 완료")
    print("  고신뢰도: 5장")
    print(f"  저신뢰도: {len(low_patterns)}장")
    print(f"  실패:     {len(fail_patterns)}장")


if __name__ == "__main__":
    generate_all()
