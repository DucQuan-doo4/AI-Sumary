from app.users.models import User, UserRole


MANAGEMENT_ROLES = {UserRole.ADMIN, UserRole.MANAGER}


def is_management_user(user: User) -> bool:
    return user.role in MANAGEMENT_ROLES


def is_admin(user: User) -> bool:
    return user.role == UserRole.ADMIN
