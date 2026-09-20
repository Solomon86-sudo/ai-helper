"""
Инициализация роутеров.
"""
from routers.predev import router as predev_router
from routers.design import router as design_router
from routers.commerce import router as commerce_router
from routers.construction import router as construction_router
from routers.budget import router as budget_router
from routers.schedule import router as schedule_router

__all__ = [
    "predev_router",
    "design_router",
    "commerce_router",
    "construction_router",
    "budget_router",
    "schedule_router"
]
