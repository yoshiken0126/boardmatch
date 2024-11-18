from django.contrib import admin
from django.contrib.auth.forms import UserCreationForm
from match.models import UserFreeTime, UserCafeRelation, MatchDay, MatchDayUser, UserRelation, UserGameRelation, \
    GameChoice
from accounts.models import BoardGameCafe

class CustomRelationAdmin(admin.ModelAdmin):
    list_display = ('user', 'cafe','can_visit','scheduled')
    ordering = ('user','cafe','can_visit')
    list_filter = ('user','can_visit',)

class CustomFreeAdmin(admin.ModelAdmin):
    list_display = ('user', 'monday','tuesday','wednesday','thursday','friday','saturday','sunday')

class MatchDayAdmin(admin.ModelAdmin):
    list_display = ('day','cafe','game','group','choices')

    def group(self, obj):
        return "\n".join([i.username for i in obj.user.all()])

    def choices(self, obj):
        return "\n".join([i.name for i in obj.choice.all()])

class MatchDayUserAdmin(admin.ModelAdmin):
    list_display = ('matchday','user')

class UserRelationAdmin(admin.ModelAdmin):
    list_display = ('from_user','to_user','may_follow','must_follow','blocked')
    list_filter = ('may_follow','must_follow','blocked','from_user' )

class UserGameRelationAdmin(admin.ModelAdmin):
    list_display = ('user','game','can_instruct','want_to_play','not_for_me')
    list_filter = ('can_instruct', 'want_to_play','not_for_me','user','game')

class GameChoiceAdmin(admin.ModelAdmin):
    list_display = ('matchday', 'game')
# Register your models here.

admin.site.register(UserFreeTime,CustomFreeAdmin)
admin.site.register(UserCafeRelation,CustomRelationAdmin)
admin.site.register(MatchDay,MatchDayAdmin)
admin.site.register(MatchDayUser,MatchDayUserAdmin)
admin.site.register(UserRelation,UserRelationAdmin)
admin.site.register(UserGameRelation,UserGameRelationAdmin)
admin.site.register(GameChoice,GameChoiceAdmin)