from django.contrib import admin
from django.contrib.auth.forms import UserCreationForm
from match.models import UserFreeTime, UserCafeRelation, MatchDay, MatchDayUser, UserRelation, UserGameRelation, \
    GameChoice,UserFreeDay
from accounts.models import BoardGameCafe

class CustomRelationAdmin(admin.ModelAdmin):
    list_display = ('user', 'cafe','can_visit','scheduled')
    ordering = ('user','cafe','can_visit')
    list_filter = ('user','can_visit',)

class CustomFreeAdmin(admin.ModelAdmin):
    list_display = ('user','monday_daytime', 'monday_nighttime',
                         'tuesday_daytime', 'tuesday_nighttime',
                         'wednesday_daytime', 'wednesday_nighttime', 
                         'thursday_daytime', 'thursday_nighttime', 
                         'friday_daytime', 'friday_nighttime', 
                         'saturday_daytime', 'saturday_nighttime', 
                         'sunday_daytime', 'sunday_nighttime')

class MatchDayAdmin(admin.ModelAdmin):
    list_display = ('day','cafe','game','group','choices')

    def group(self, obj):
        return "\n".join([i.username for i in obj.user.all()])

    def choices(self, obj):
        return "\n".join([i.name for i in obj.choice.all()])

class MatchDayUserAdmin(admin.ModelAdmin):
    list_display = ('matchday','user')

class UserRelationAdmin(admin.ModelAdmin):
    list_display = ('from_user', 'to_user', 'may_follow', 'must_follow', 'blocked', 'memo')  # 一覧表示するフィールド
    search_fields = ('from_user__username', 'to_user__username')  # 検索可能なフィールド
    list_filter = ('may_follow', 'must_follow', 'blocked')  # フィルタリングできるフィールド
    ordering = ('from_user', 'to_user')  # 並び順を設定

class UserGameRelationAdmin(admin.ModelAdmin):
    list_display = ('user','game','can_instruct','want_to_play','not_for_me')
    list_filter = ('can_instruct', 'want_to_play','not_for_me','user','game')

class GameChoiceAdmin(admin.ModelAdmin):
    list_display = ('matchday', 'game')
# Register your models here.

class UserFreeDayAdmin(admin.ModelAdmin):
    list_display = ('user', 'freeday', 'daytime', 'nighttime')  # モデルの項目を管理画面に表示
    list_filter = ('user', 'freeday')  # フィルター項目を設定
    search_fields = ('user__username', 'freeday')  # 検索できる項目を設定

admin.site.register(UserFreeTime,CustomFreeAdmin)
admin.site.register(UserCafeRelation,CustomRelationAdmin)
admin.site.register(MatchDay,MatchDayAdmin)
admin.site.register(MatchDayUser,MatchDayUserAdmin)
admin.site.register(UserRelation,UserRelationAdmin)
admin.site.register(UserGameRelation,UserGameRelationAdmin)
admin.site.register(GameChoice,GameChoiceAdmin)
admin.site.register(UserFreeDay, UserFreeDayAdmin)