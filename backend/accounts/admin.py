from accounts.models import CustomUser, BoardGame, BoardGameCafe, CafeStaff
from django.contrib import admin

# Register your models here.
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username','is_optimize_active','is_active')


class CafeStaffAdmin(admin.ModelAdmin):
    list_display = ('username', 'cafe')

class BoardGameCafeAdmin(admin.ModelAdmin):
    list_display = ('name', 'monday_hours', 'tuesday_hours', 'wednesday_hours', 'thursday_hours', 'friday_hours', 'saturday_hours', 'sunday_hours')

    def monday_hours(self, obj):
        return obj.get_opening_hours('monday')
    monday_hours.short_description = 'Monday'

    def tuesday_hours(self, obj):
        return obj.get_opening_hours('tuesday')
    tuesday_hours.short_description = 'Tuesday'

    def wednesday_hours(self, obj):
        return obj.get_opening_hours('wednesday')
    wednesday_hours.short_description = 'Wednesday'

    def thursday_hours(self, obj):
        return obj.get_opening_hours('thursday')
    thursday_hours.short_description = 'Thursday'

    def friday_hours(self, obj):
        return obj.get_opening_hours('friday')
    friday_hours.short_description = 'Friday'

    def saturday_hours(self, obj):
        return obj.get_opening_hours('saturday')
    saturday_hours.short_description = 'Saturday'

    def sunday_hours(self, obj):
        return obj.get_opening_hours('sunday')
    sunday_hours.short_description = 'Sunday'



admin.site.register(BoardGameCafe, BoardGameCafeAdmin)
admin.site.register(BoardGame)
admin.site.register(CustomUser,CustomUserAdmin)
admin.site.register(CafeStaff,CafeStaffAdmin)
