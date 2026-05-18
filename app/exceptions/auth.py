from app.exceptions.common import BadRequestException, ConflictException, ForbiddenException, UnauthorizedException


class InvalidConsentException(BadRequestException):
    def __init__(self):
        super().__init__(detail="필수 약관에 모두 동의해주세요.")


class InvalidCredentialsException(UnauthorizedException):
    def __init__(self):
        super().__init__(detail="계정 또는 비밀번호가 일치하지 않습니다.")


class WithdrawnUserException(ForbiddenException):
    def __init__(self):
        super().__init__(detail="탈퇴한 계정입니다.")


class DuplicateEmailException(ConflictException):
    def __init__(self):
        super().__init__(detail="이미 사용중인 이메일입니다.")
