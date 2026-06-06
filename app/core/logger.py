import logging
import re
import sys

# 마스킹 패턴 정의
_MASK_PATTERNS = [
    # JWT 토큰 (eyJ로 시작하는 긴 문자열)
    (re.compile(r"eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+"), "***TOKEN***"),
    # 이메일
    (re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"), "***EMAIL***"),
    # 비밀번호 필드 (password": "..." 패턴)
    (re.compile(r'("password"\s*:\s*")[^"]+(")', re.IGNORECASE), r"\1***\2"),
]


def mask_sensitive(message: str) -> str:
    for pattern, replacement in _MASK_PATTERNS:
        message = pattern.sub(replacement, message)
    return message


class MaskingFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        return mask_sensitive(original)


def setup_logger(
    name: str = "ai_worker",
    level: int = logging.INFO,
) -> logging.Logger:
    _logger = logging.getLogger(name)
    # 중복 핸들러 방지 (중요)
    if _logger.handlers:
        return _logger
    _logger.setLevel(level)
    formatter = MaskingFormatter("[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s")
    # 콘솔 출력
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    _logger.addHandler(console_handler)
    _logger.propagate = False  # root logger로 중복 전달 방지
    return _logger


# 앱 전역에서 사용할 로거
default_logger = setup_logger()
