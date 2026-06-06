from fastapi import HTTPException
from starlette import status


class NotFoundException(HTTPException):
    def __init__(self, detail: str = "리소스를 찾을 수 없습니다."):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class UnauthorizedException(HTTPException):
    def __init__(self, detail: str = "인증이 필요합니다."):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class ForbiddenException(HTTPException):
    def __init__(self, detail: str = "접근 권한이 없습니다."):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class BadRequestException(HTTPException):
    def __init__(self, detail: str = "잘못된 요청입니다."):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class ConflictException(HTTPException):
    def __init__(self, detail: str = "이미 존재하는 리소스입니다."):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class TooManyRequestsException(HTTPException):
    def __init__(
        self, detail: str = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", retry_after: int | None = None
    ):
        detail_body = {"detail": detail}
        if retry_after is not None:
            detail_body["retry_after"] = retry_after
        super().__init__(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail_body)


class NicknameTooSoonException(HTTPException):
    def __init__(self, next_date: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": f"닉네임은 30일에 1회만 변경할 수 있어요. 다음 변경 가능일: {next_date}",
                "error_code": "NICKNAME_CHANGE_TOO_SOON",
            },
        )


class FileTooLargeException(HTTPException):
    def __init__(self, detail: str = "10MB 이하 파일만 업로드 가능합니다."):
        super().__init__(status_code=413, detail=detail)
