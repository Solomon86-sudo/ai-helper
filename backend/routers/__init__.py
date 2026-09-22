"""
Инициализация роутеров.
"""
from routers.predev import router as predev_router
from routers.design import router as design_router

__all__ = [
    "predev_router",
    "design_router",
]
