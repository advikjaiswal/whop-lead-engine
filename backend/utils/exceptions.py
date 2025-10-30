class AppException(Exception):
    """Base application exception"""
    def __init__(self, message: str, status_code: int = 500, detail: str = None):
        self.message = message
        self.status_code = status_code
        self.detail = detail
        super().__init__(self.message)


class AuthenticationError(AppException):
    """Authentication related errors"""
    def __init__(self, message: str = "Authentication failed", detail: str = None):
        super().__init__(message, 401, detail)


class AuthorizationError(AppException):
    """Authorization related errors"""
    def __init__(self, message: str = "Access denied", detail: str = None):
        super().__init__(message, 403, detail)


class ValidationError(AppException):
    """Validation related errors"""
    def __init__(self, message: str = "Validation failed", detail: str = None):
        super().__init__(message, 422, detail)


class NotFoundError(AppException):
    """Resource not found errors"""
    def __init__(self, message: str = "Resource not found", detail: str = None):
        super().__init__(message, 404, detail)


class ConflictError(AppException):
    """Resource conflict errors"""
    def __init__(self, message: str = "Resource conflict", detail: str = None):
        super().__init__(message, 409, detail)


class ExternalAPIError(AppException):
    """External API errors"""
    def __init__(self, message: str = "External API error", detail: str = None):
        super().__init__(message, 502, detail)