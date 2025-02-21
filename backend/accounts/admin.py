from accounts.models import CustomUser, BoardGame, BoardGameCafe, CafeStaff,Designer, GameClass, GameTag,Prefecture
from django.contrib import admin



class CustomUserAdmin(admin.ModelAdmin):
    # 管理画面で表示する項目
    list_display = ('username', 'email', 'is_optimize_active', 'profile_picture')

    # ゲームクラスと都道府県を編集フォームに追加
    fields = ('username', 'email', 'is_optimize_active', 'game_class', 'prefecture', 'profile_picture')

    # 検索機能を追加
    search_fields = ('username', 'email')





class CafeStaffAdmin(admin.ModelAdmin):
    list_display = ('username', 'cafe')



class PrefectureAdmin(admin.ModelAdmin):
    # デフォルトの設定で入力と表示のみを行う
    list_display = ('id', 'name')  # 都道府県名とIDを表示



class BoardGameCafeAdmin(admin.ModelAdmin):
    # リストに表示するカラムを定義
    list_display = (
        'id',
        'name',
        'postal_code',
        'prefecture',  # 都道府県
        'city',  # 市区町村
        'address',  # 番地
        'building',  # ビル名やアパート名
        'walking_minutes',  # 駅からの徒歩分数
        'monday_hours', 'tuesday_hours', 'wednesday_hours', 
        'thursday_hours', 'friday_hours', 'saturday_hours', 'sunday_hours',
        'image1_preview', 'image2_preview'  # 画像のプレビュー
    )
    
    # 曜日ごとの営業時間を取得するメソッド
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

    # 画像フィールドのプレビューを表示するメソッド
    def image1_preview(self, obj):
        if obj.image1:
            return f'<img src="{obj.image1.url}" width="50" />'
        return "No Image"
    image1_preview.short_description = 'Image 1'
    image1_preview.allow_tags = True

    def image2_preview(self, obj):
        if obj.image2:
            return f'<img src="{obj.image2.url}" width="50" />'
        return "No Image"
    image2_preview.short_description = 'Image 2'
    image2_preview.allow_tags = True


class DesignerAdmin(admin.ModelAdmin):
    list_display = ('name',)  # 一覧表示するフィールド
    search_fields = ('name',)  # 検索可能なフィールド

# GameCategory モデルの管理
class GameClassAdmin(admin.ModelAdmin):
    list_display = ('name',)  # 一覧表示するフィールド
    search_fields = ('name',)  # 検索可能なフィールド

# GameMechanic モデルの管理
class GameTagAdmin(admin.ModelAdmin):
    list_display = ('name',)  # 一覧表示するフィールド
    search_fields = ('name',)  # 検索可能なフィールド

# BoardGame モデルの管理
class BoardGameAdmin(admin.ModelAdmin):
    list_display = ('name', 'min_players', 'max_players', 'min_playtime', 'max_playtime')  # 一覧表示するフィールド
    search_fields = ('name', 'description')  # 検索可能なフィールド
    list_filter = ('game_class', 'game_tags', 'designers')  # フィルタリングできるフィールド
    filter_horizontal = ('game_class', 'game_tags', 'designers')  # ManyToMany フィールドの選択を横並びに
    list_per_page = 20  # 1ページに表示する項目数


# モデルを管理画面に登録
admin.site.register(Designer, DesignerAdmin)
admin.site.register(GameClass, GameClassAdmin)
admin.site.register(GameTag, GameTagAdmin)
admin.site.register(BoardGame, BoardGameAdmin)
admin.site.register(BoardGameCafe, BoardGameCafeAdmin)
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(CafeStaff,CafeStaffAdmin)
admin.site.register(Prefecture, PrefectureAdmin)