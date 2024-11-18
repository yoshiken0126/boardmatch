from accounts.models import CustomUser, BoardGame, BoardGameCafe, CafeStaff
from django.contrib import admin

# Register your models here.
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username','gender','is_optimize_active','is_active')

class CustomCafeAdmin(admin.ModelAdmin):
    list_display = ('name',)

class CafeStaffAdmin(admin.ModelAdmin):
    list_display = ('username', 'cafe')



admin.site.register(BoardGameCafe,CustomCafeAdmin)
admin.site.register(BoardGame)
admin.site.register(CustomUser,CustomUserAdmin)
admin.site.register(CafeStaff,CafeStaffAdmin)
