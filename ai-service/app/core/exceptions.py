from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException


class AIServiceError(Exception):
    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code


def register_handlers(app: FastAPI) -> None:
    @app.exception_handler(AIServiceError)
    async def service_error(request: Request, exc: AIServiceError):
        return JSONResponse(status_code=exc.status_code, content={"error": {"message": str(exc)}})

    @app.exception_handler(RequestValidationError)
    async def invalid_input(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "error": {"message": "Provide 1-10 non-empty interests, each at most 50 characters"}
            },
        )

    @app.exception_handler(HTTPException)
    async def http_error(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code, content={"error": {"message": str(exc.detail)}}
        )
