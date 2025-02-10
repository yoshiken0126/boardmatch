from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied

class IsCustomUser(BasePermission):
    """
    ユーザーが 'custom_user' タイプの場合のみアクセスを許可する
    """
    def has_permission(self, request, view):
        if request.user and request.user.user_type == 'custom_user':
            return True
        else:
            # アクセスを拒否する場合、PermissionDenied を発生させる
            raise PermissionDenied(detail="アクセス権限がありません。'custom_user' タイプのユーザーのみアクセスできます。")


class IsStaffUser(BasePermission):
    """
    ユーザーが 'staff_user' タイプの場合のみアクセスを許可する
    """
    def has_permission(self, request, view):
        if request.user and request.user.user_type == 'staff_user':
            return True
        else:
            # アクセスを拒否する場合、PermissionDenied を発生させる
            raise PermissionDenied(detail="アクセス権限がありません。'staff_user' タイプのユーザーのみアクセスできます。")


class IsCustomUserOrIsStaffUser(BasePermission):
    """
    ユーザーが 'custom_user' タイプまたは 'staff_user' タイプの場合にアクセスを許可する
    """
    def has_permission(self, request, view):
        if request.user and (request.user.user_type == 'custom_user' or request.user.user_type == 'staff_user'):
            return True
        else:
            raise PermissionDenied(detail="アクセス権限がありません。'custom_user' タイプまたは 'staff_user' タイプのユーザーのみアクセスできます。")