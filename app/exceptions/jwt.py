from app.exceptions.common import BadRequestException, UnauthorizedException


class ExpiredTokenException(UnauthorizedException):
    def __init__(self, token_type: str):
        super().__init__(detail=f"{token_type} token has expired.")


class InvalidTokenException(BadRequestException):
    def __init__(self):
        super().__init__(detail="Provided invalid token.")
