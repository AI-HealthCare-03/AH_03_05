import json
import os
import time
import warnings

warnings.filterwarnings("ignore")

from PIL import Image

IMAGE_BASE = "tests/mock_data/images"
RESULT_PATH = "tests/mock_data/ocr_comparison_result.json"

PRESCRIPTION_KEYWORDS = [
    "처방", "처방전", "의약품", "투약", "식후", "식전",
    "1일", "복용", "mg", "정", "캡슐", "요양기관"
]

MEDICAL_RECORD_KEYWORDS = [
    "진료", "확인서", "질병", "소견", "외래", "입원",
    "의료비", "의료기관", "병원", "진단", "개설자"
]


def get_keywords(image_path):
    fname = os.path.basename(image_path)
    if "prescription" in fname:
        return PRESCRIPTION_KEYWORDS, "처방전"
    else:
        return MEDICAL_RECORD_KEYWORDS, "진료확인서"


def load_test_images():
    images = {}
    for category in ["high_confidence", "low_confidence", "failed"]:
        folder = os.path.join(IMAGE_BASE, category)
        if os.path.exists(folder):
            images[category] = [
                os.path.join(folder, f)
                for f in sorted(os.listdir(folder))
                if f.endswith(".jpg")
            ]
    return images


def calc_keyword_score(text, keywords):
    if not text:
        return 0.0
    found = sum(1 for kw in keywords if kw.lower() in text.lower())
    return round(found / len(keywords), 3)


def run_paddleocr(image_path):
    try:
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(use_textline_orientation=True, lang="korean")
        start = time.time()
        result = ocr.ocr(image_path)
        elapsed = round(time.time() - start, 3)
        text = ""
        confidence = 0.0
        count = 0
        if result:
            for item in result:
                if isinstance(item, dict):
                    t = item.get("text", "")
                    c = item.get("score", 0.0)
                    text += t + " "
                    confidence += c
                    count += 1
                elif isinstance(item, list):
                    for line in item:
                        if line and len(line) >= 2:
                            t = line[1][0] if isinstance(line[1], (list, tuple)) else ""
                            c = line[1][1] if isinstance(line[1], (list, tuple)) else 0.0
                            text += t + " "
                            confidence += c
                            count += 1
        avg_conf = round(confidence / count, 3) if count > 0 else 0.0
        keywords, doc_type = get_keywords(image_path)
        return {
            "doc_type": doc_type,
            "text": text.strip(),
            "confidence": avg_conf,
            "time": elapsed,
            "keyword_score": calc_keyword_score(text, keywords)
        }
    except Exception as e:
        return {"error": str(e), "doc_type": "", "text": "", "confidence": 0, "time": 0, "keyword_score": 0}


def run_easyocr(image_path):
    try:
        import easyocr
        reader = easyocr.Reader(["ko", "en"], verbose=False)
        start = time.time()
        result = reader.readtext(image_path)
        elapsed = round(time.time() - start, 3)
        text = ""
        confidence = 0.0
        for (_, t, conf) in result:
            text += t + " "
            confidence += conf
        avg_conf = round(confidence / len(result), 3) if result else 0.0
        keywords, doc_type = get_keywords(image_path)
        return {
            "doc_type": doc_type,
            "text": text.strip(),
            "confidence": avg_conf,
            "time": elapsed,
            "keyword_score": calc_keyword_score(text, keywords)
        }
    except Exception as e:
        return {"error": str(e), "doc_type": "", "text": "", "confidence": 0, "time": 0, "keyword_score": 0}


def run_tesseract(image_path):
    try:
        import pytesseract
        img = Image.open(image_path)
        start = time.time()
        text = pytesseract.image_to_string(img, lang="kor+eng")
        data = pytesseract.image_to_data(
            img, lang="kor+eng",
            output_type=pytesseract.Output.DICT
        )
        elapsed = round(time.time() - start, 3)
        confs = [int(c) for c in data["conf"] if str(c).isdigit() and int(c) > 0]
        avg_conf = round(sum(confs) / len(confs) / 100, 3) if confs else 0.0
        keywords, doc_type = get_keywords(image_path)
        return {
            "doc_type": doc_type,
            "text": text.strip(),
            "confidence": avg_conf,
            "time": elapsed,
            "keyword_score": calc_keyword_score(text, keywords)
        }
    except Exception as e:
        return {"error": str(e), "doc_type": "", "text": "", "confidence": 0, "time": 0, "keyword_score": 0}


MODELS = {
    "PaddleOCR": run_paddleocr,
    "EasyOCR":   run_easyocr,
    "Tesseract": run_tesseract,
}


def run_comparison():
    images = load_test_images()
    results = {}

    for category, paths in images.items():
        print(f"\n{'='*60}")
        print(f"카테고리: {category} ({len(paths)}장)")
        print(f"{'='*60}")
        results[category] = {}

        prescription_paths = [p for p in paths if "prescription" in os.path.basename(p)]
        medical_paths = [p for p in paths if "medical_record" in os.path.basename(p)]
        print(f"  처방전: {len(prescription_paths)}장 | 진료확인서: {len(medical_paths)}장")

        sample_paths = prescription_paths[:3] + medical_paths[:3]

        for model_name, model_fn in MODELS.items():
            print(f"\n  [{model_name}] 실행 중...")
            model_results = []

            for img_path in sample_paths:
                fname = os.path.basename(img_path)
                result = model_fn(img_path)
                model_results.append({"file": fname, **result})
                doc_type = result.get("doc_type", "")
                status = "✅" if result.get("keyword_score", 0) > 0.3 else "❌"
                print(f"    {status} [{doc_type}] {fname[:30]} | "
                      f"키워드: {result.get('keyword_score', 0)} | "
                      f"신뢰도: {result.get('confidence', 'N/A')} | "
                      f"속도: {result.get('time', 0)}초")

            p_results = [r for r in model_results if r.get("doc_type") == "처방전"]
            m_results = [r for r in model_results if r.get("doc_type") == "진료확인서"]

            def avg(lst, key):
                vals = [r.get(key, 0) for r in lst if r.get(key) is not None]
                return round(sum(vals) / len(vals), 3) if vals else 0.0

            results[category][model_name] = {
                "prescription": {
                    "avg_keyword_score": avg(p_results, "keyword_score"),
                    "avg_confidence":    avg(p_results, "confidence"),
                    "avg_time":          avg(p_results, "time"),
                },
                "medical_record": {
                    "avg_keyword_score": avg(m_results, "keyword_score"),
                    "avg_confidence":    avg(m_results, "confidence"),
                    "avg_time":          avg(m_results, "time"),
                },
                "details": model_results
            }

    for doc_label, doc_key in [("처방전", "prescription"), ("진료확인서", "medical_record")]:
        print(f"\n{'='*70}")
        print(f"최종 비교 결과 — {doc_label}")
        print(f"{'='*70}")
        print(f"{'모델':<15} {'고신뢰도':>10} {'저신뢰도':>10} {'실패':>10} {'평균속도':>10}")
        print("-" * 70)
        for model_name in MODELS.keys():
            row = []
            times = []
            for cat in ["high_confidence", "low_confidence", "failed"]:
                v = results.get(cat, {}).get(model_name, {}).get(doc_key, {})
                row.append(v.get("avg_keyword_score", 0))
                times.append(v.get("avg_time", 0))
            avg_t = round(sum(times) / len(times), 3)
            print(f"{model_name:<15} {row[0]:>10} {row[1]:>10} {row[2]:>10} {avg_t:>9}초")

    with open(RESULT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n결과 저장 완료: {RESULT_PATH}")


if __name__ == "__main__":
    run_comparison()
