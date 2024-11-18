from cafes.models import CafeGameRelation, StaffGameRelation
from django.contrib import admin


class CafeGameRelationAdmin(admin.ModelAdmin):
    list_display = ('cafe','game','can_instruct','is_recommended')

class StaffGameRelationAdmin(admin.ModelAdmin):
    list_display = ('staff','game','can_instruct','is_recommended')







admin.site.register(CafeGameRelation,CafeGameRelationAdmin)
admin.site.register(StaffGameRelation,StaffGameRelationAdmin)