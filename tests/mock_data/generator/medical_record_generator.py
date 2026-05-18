import os
import random

import numpy as np
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

load_dotenv()

FORM_PATH = "tests/mock_data/medical_record_form.png"

DISEASES = [
    "고혈압(I10)",
    "제2형 당뇨병(E11)",
    "고지혈증(E78)",
    "위식도역류질환(K21)",
    "요통(M54)",
    "관절염(M19)",
    "갑상선기능저하증(E03)",
    "빈혈(D64)",
    "천식(J45)",
    "만성폐쇄성폐질환(J44)",
]

OPINIONS = {
    "고혈압(I10)": [
        "저염식 권고. 나트륨 하루 2,000mg 이하 섭취 권장. 유산소 운동 주 5회 이상 권고.",
        "혈압 조절을 위한 규칙적인 복약 필수. 음주 및 흡연 자제 권고. 스트레스 관리 필요.",
        "백의고혈압 가능성 있음. 가정 혈압 측정 권고. 저염식 및 체중 관리 필요.",
    ],
    "제2형 당뇨병(E11)": [
        "혈당 조절 필수. 당분 섭취 제한 권고. 규칙적인 식사 및 유산소 운동 주 3회 이상 권장.",
        "공복혈당 관리 필요. 탄수화물 섭취 제한. 발 관리 주의. 정기적인 혈당 측정 권고.",
        "인슐린 저항성 개선 위해 체중 감량 권고. 식이 조절 및 운동 병행 필수.",
    ],
    "고지혈증(E78)": [
        "고지방식 자제 권고. 트랜스지방 섭취 금지. 규칙적인 유산소 운동 권장.",
        "LDL 콜레스테롤 관리 필요. 포화지방 섭취 제한. 오메가3 섭취 권장.",
        "식이 조절 및 운동으로 콜레스테롤 수치 관리. 금주 권고.",
    ],
    "위식도역류질환(K21)": [
        "취침 2시간 전 금식 권고. 카페인 및 알코올 자제. 식후 바로 눕지 않도록 주의.",
        "소식 다회 식사 권고. 자극적인 음식 자제. 상체 높여 수면 권장.",
        "역류 증상 악화 시 즉시 내원 요망. 식이 조절 및 체중 관리 필요.",
    ],
    "요통(M54)": [
        "무리한 운동 자제. 올바른 자세 유지 권고. 코어 근육 강화 운동 권장.",
        "장시간 앉아있는 자세 주의. 규칙적인 스트레칭 권고. 온찜질 도움.",
        "급성기 안정 필요. 진통제 복용 시 공복 복용 금지. 물리치료 병행 권장.",
    ],
    "관절염(M19)": [
        "관절에 무리가 가는 운동 자제. 체중 관리 필요. 온열 치료 권장.",
        "계단 이용 자제. 수영 또는 자전거 등 저충격 운동 권장.",
        "관절 보호대 착용 권고. 무리한 보행 자제. 정기적인 추적 관찰 필요.",
    ],
    "갑상선기능저하증(E03)": [
        "규칙적인 복약 필수. 갑상선 수치 정기 확인 권고. 요오드 과다 섭취 주의.",
        "피로감 및 체중 증가 시 용량 조절 필요. 정기 혈액 검사 권장.",
        "공복 복약 필수. 칼슘제 복용 시 4시간 간격 유지. 정기적인 추적 관찰.",
    ],
    "빈혈(D64)": [
        "철분 섭취 권고. 비타민C와 함께 복용 시 흡수율 향상. 녹차 및 커피와 함께 복용 금지.",
        "철분 함유 식품 섭취 권장. 과도한 운동 자제. 어지러움 시 안정 필요.",
        "규칙적인 혈액 검사 필요. 철분제 공복 복용 권고. 출혈 원인 추가 검사 고려.",
    ],
    "천식(J45)": [
        "흡입기 상시 휴대 권고. 미세먼지 심한 날 외출 자제. 금연 필수.",
        "찬 공기 노출 주의. 격렬한 운동 전 흡입기 사용 권고. 알레르기 유발 물질 회피.",
        "증상 악화 시 즉시 내원. 규칙적인 폐기능 검사 권고. 실내 습도 관리 필요.",
    ],
    "만성폐쇄성폐질환(J44)": [
        "금연 필수. 호흡 재활 운동 권고. 독감 및 폐렴 예방접종 권장.",
        "미세먼지 노출 최소화. 규칙적인 흡입기 사용. 호흡곤란 시 즉시 내원.",
        "규칙적인 폐기능 검사 필요. 산소포화도 모니터링 권고. 격렬한 운동 자제.",
    ],
}

HOSPITALS = ["서울중앙병원", "연세의원", "한강병원", "강남세브란스", "삼성서울병원"]
DOCTORS = ["김철수", "이영희", "박민준", "최수연", "정대호"]
PATIENT_NAMES = ["홍길동", "김민수", "이지은", "박서준", "최유리"]
GENDERS = ["남", "여"]


def apply_noise(img, intensity=3000):
    draw = ImageDraw.Draw(img)
    for _ in range(intensity):
        x = random.randint(0, img.width)
        y = random.randint(0, img.height)
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
        x1 = random.randint(0, img.width - 200)
        y1 = random.randint(200, 800)
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


def draw_text_on_form(img, disease, opinion, confidence="high"):
    """진료확인서 양식 위에 텍스트 오버레이"""
    draw = ImageDraw.Draw(img)

    hospital = random.choice(HOSPITALS)
    doctor = random.choice(DOCTORS)
    patient = random.choice(PATIENT_NAMES)
    gender = random.choice(GENDERS)
    birth = f"{random.randint(1950, 2000)}.{random.randint(1, 12):02d}.{random.randint(1, 28):02d}"
    outpatient = random.randint(1, 30)
    inpatient = random.randint(0, 14)
    districts = ["강남구", "서초구", "송파구", "마포구", "종로구"]

    try:
        font = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 26)
        font_sm = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 20)
    except:
        font = ImageFont.load_default()
        font_sm = font

    # 진료자 정보
    draw.text((220, 195), patient, font=font, fill=(0, 0, 0))
    draw.text((680, 195), birth, font=font_sm, fill=(0, 0, 0))
    draw.text((1100, 195), gender, font=font, fill=(0, 0, 0))
    draw.text(
        (220, 255),
        f"서울특별시 {random.choice(districts)} 테스트로 {random.randint(1, 100)}",
        font=font_sm,
        fill=(0, 0, 0),
    )

    # 질병명
    disease_text = disease
    if confidence == "low" and random.random() > 0.5:
        disease_text = disease[:-3] + "??"
    draw.text((220, 320), disease_text, font=font, fill=(0, 0, 0))

    # 소견 (원문 그대로, 줄바꿈 처리)
    opinion_lines = [opinion[i : i + 35] for i in range(0, len(opinion), 35)]
    y_opinion = 380
    for line in opinion_lines[:3]:
        draw.text((220, y_opinion), line, font=font_sm, fill=(0, 0, 0))
        y_opinion += 32

    # 진료일수
    draw.text((350, 520), str(outpatient), font=font, fill=(0, 0, 0))
    draw.text((550, 520), str(inpatient), font=font, fill=(0, 0, 0))

    # 의료기관 정보
    draw.text((220, 700), hospital, font=font, fill=(0, 0, 0))
    draw.text(
        (220, 755),
        f"서울특별시 {random.choice(districts)} 테스트로 {random.randint(1, 100)}",
        font=font_sm,
        fill=(0, 0, 0),
    )
    draw.text((220, 810), doctor, font=font, fill=(0, 0, 0))

    return img


def generate_medical_record(output_path, confidence="high", pattern=None):
    """진료확인서 이미지 생성"""
    disease = random.choice(DISEASES)
    opinion_list = OPINIONS.get(disease, ["특이사항 없음."])
    opinion = random.choice(opinion_list)

    img = Image.open(FORM_PATH).copy()
    img = draw_text_on_form(img, disease, opinion, confidence)

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

    print("고신뢰도 진료확인서 생성 중...")
    for i in range(5):
        generate_medical_record(f"{base}/high_confidence/medical_record_{i + 1}.jpg", "high")

    print("저신뢰도 진료확인서 생성 중... (오독 여지 있음)")
    low_patterns = list(LOW_CONFIDENCE_PATTERNS.keys())
    for i, pattern in enumerate(low_patterns):
        generate_medical_record(f"{base}/low_confidence/medical_record_{i + 1}_{pattern}.jpg", "low", pattern)

    print("실패 케이스 생성 중... (보정 시도 필요)")
    fail_patterns = list(FAILED_PATTERNS.keys())
    for i, pattern in enumerate(fail_patterns):
        generate_medical_record(f"{base}/failed/medical_record_{i + 1}_{pattern}.jpg", "failed", pattern)

    print("전체 생성 완료")
    print("  고신뢰도: 5장")
    print(f"  저신뢰도: {len(low_patterns)}장")
    print(f"  실패:     {len(fail_patterns)}장")


if __name__ == "__main__":
    generate_all()
