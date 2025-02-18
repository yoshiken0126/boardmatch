from accounts.models import CustomUser, BoardGame, BoardGameCafe, CafeStaff,Designer, GameCategory, GameMechanic
from django.contrib import admin

# Register your models here.
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username','is_optimize_active','is_active')


class CafeStaffAdmin(admin.ModelAdmin):
    list_display = ('username', 'cafe')

class BoardGameCafeAdmin(admin.ModelAdmin):
    list_display = ('id','name', 'monday_hours', 'tuesday_hours', 'wednesday_hours', 'thursday_hours', 'friday_hours', 'saturday_hours', 'sunday_hours')

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

class DesignerAdmin(admin.ModelAdmin):
    list_display = ('name',)  # 一覧表示するフィールド
    search_fields = ('name',)  # 検索可能なフィールド

# GameCategory モデルの管理
class GameCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)  # 一覧表示するフィールド
    search_fields = ('name',)  # 検索可能なフィールド

# GameMechanic モデルの管理
class GameMechanicAdmin(admin.ModelAdmin):
    list_display = ('name',)  # 一覧表示するフィールド
    search_fields = ('name',)  # 検索可能なフィールド

# BoardGame モデルの管理
class BoardGameAdmin(admin.ModelAdmin):
    list_display = ('name', 'min_players', 'max_players', 'min_playtime', 'max_playtime')  # 一覧表示するフィールド
    search_fields = ('name', 'description')  # 検索可能なフィールド
    list_filter = ('game_categories', 'game_mechanics', 'designers')  # フィルタリングできるフィールド
    filter_horizontal = ('game_categories', 'game_mechanics', 'designers')  # ManyToMany フィールドの選択を横並びに
    list_per_page = 20  # 1ページに表示する項目数


# モデルを管理画面に登録
admin.site.register(Designer, DesignerAdmin)
admin.site.register(GameCategory, GameCategoryAdmin)
admin.site.register(GameMechanic, GameMechanicAdmin)
admin.site.register(BoardGame, BoardGameAdmin)
admin.site.register(BoardGameCafe, BoardGameCafeAdmin)
admin.site.register(CustomUser,CustomUserAdmin)
admin.site.register(CafeStaff,CafeStaffAdmin)
