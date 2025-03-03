from cafes.models import CafeGameRelation, StaffGameRelation,Message,PlayGame,GameProposal, GameProposalInstructor
from django.contrib import admin
from django.utils import timezone

class CafeGameRelationAdmin(admin.ModelAdmin):
    list_display = ('cafe','game','can_instruct','is_recommended')

class StaffGameRelationAdmin(admin.ModelAdmin):
    list_display = ('staff','game','can_instruct','is_recommended')



from .models import CafeTable, TableTimeSlot, Reservation, Participant, ReservationTimeSlot

# CafeTable 管理画面設定
class CafeTableAdmin(admin.ModelAdmin):
    list_display = ('id','table_name', 'cafe', 'capacity')
    search_fields = ('table_name', 'cafe__name')  # カフェ名で検索可能
    list_filter = ('cafe',)  # カフェで絞り込み



class TableTimeSlotAdmin(admin.ModelAdmin):
    list_display = ('get_cafe_name', 'table', 'get_start_time', 'get_end_time', 'is_reserved', 'is_closed')
    list_filter = ('table__cafe__name', 'is_reserved', 'is_closed')  # テーブルや予約状況でフィルタリング
    search_fields = ('table__table_name', 'timeslot_range')  # テーブル名や予約時間帯で検索可能

    def get_cafe_name(self, obj):
        return obj.table.cafe.name  # 'cafe' フィールドからカフェの名前を取得
    get_cafe_name.short_description = 'Cafe Name'  # カラム名を「Cafe Name」と表示

    # 時間帯（開始時刻）を表示するメソッド
    def get_start_time(self, obj):
        start_time = timezone.localtime(obj.timeslot_range.lower)  # タイムゾーンを適用
        return start_time.strftime('%Y-%m-%d %H:%M:%S')  # 開始時刻
    get_start_time.short_description = 'Start Time'

    # 時間帯（終了時刻）を表示するメソッド
    def get_end_time(self, obj):
        end_time = timezone.localtime(obj.timeslot_range.upper)  # タイムゾーンを適用
        return end_time.strftime('%Y-%m-%d %H:%M:%S')  # 終了時刻
    get_end_time.short_description = 'End Time'

# Reservation 管理画面設定
class ReservationAdmin(admin.ModelAdmin):
    list_display = ('cafe', 'count', 'reserved_at', 'reservation_type', 'get_participants', 'get_timeslots', 'get_playgames', 'is_active', 'is_recruiting', 'game_class', 'max_participants')
    search_fields = ('cafe__name',)
    list_filter = ('cafe', 'reservation_type', 'is_active', 'is_recruiting')  # カフェや予約タイプでフィルタリング
    date_hierarchy = 'reserved_at'  # 予約日で絞り込み

    # 参加者を表示するカスタムメソッド
    def get_participants(self, obj):
        # 参加者リストを改行で区切って表示
        participants = obj.participant.all()
        return "\n".join([user.username for user in participants])
    get_participants.short_description = 'Participants'  # カラム名を指定

    # タイムスロットを表示するカスタムメソッド
    def get_timeslots(self, obj):
        # タイムスロットリストを改行で区切って表示
        timeslots = obj.timeslot.all()
        # timeslot.timeslot_range.lower を使って開始時刻を表示
        return "\n".join([str(timezone.localtime(timeslot.timeslot_range.lower).strftime('%Y-%m-%d %H:%M:%S')) for timeslot in timeslots])
    get_timeslots.short_description = 'Time Slots'  # カラム名を指定

    # プレイゲームを表示するカスタムメソッド
    def get_playgames(self, obj):
        # 予約に関連する PlayGame の情報を取得
        playgames = PlayGame.objects.filter(reservation=obj)
        # プレイゲームのゲーム名、提供者、インストラクターを表示
        return "\n".join([f"{playgame.game.name} (提供者: {playgame.provider.username if playgame.provider else 'カフェ'}, インストラクター: {playgame.instructor.username if playgame.instructor else 'なし'})" for playgame in playgames])
    get_playgames.short_description = 'Play Games'  # カラム名を指定


class PlayGameAdmin(admin.ModelAdmin):
    list_display = ('reservation', 'game', 'provider', 'instructor', 'game_provider_type')
    list_filter = ('game_provider_type', 'game', 'provider')  # ゲーム提供元や提供者でフィルタリング



# Participant 管理画面設定
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ('reservation', 'user')
    search_fields = ('reservation__cafe__name', 'user__username')  # 予約のカフェ名やユーザー名で検索可能
    list_filter = ('reservation__cafe',)  # 予約したカフェでフィルタリング

# ReservationTimeSlot 管理画面設定
class ReservationTimeSlotAdmin(admin.ModelAdmin):
    list_display = ('reservation', 'get_timeslot_start_time')  # timeslotの開始時刻を表示
    search_fields = ('reservation__cafe__name', 'get_timeslot_start_time')  # カフェ名と開始時刻で検索
    list_filter = ('reservation__cafe',)  # 予約したカフェでフィルタリング

    # timeslotの開始時刻を表示するカスタムメソッド
    def get_timeslot_start_time(self, obj):
        # timeslot.timeslot_range.lower を使って開始時刻を表示
        start_time = timezone.localtime(obj.timeslot.timeslot_range.lower)  # タイムゾーンを適用
        return start_time.strftime('%Y-%m-%d %H:%M:%S')  # 開始時刻
    get_timeslot_start_time.short_description = 'Start Time'  # カラム名を指定




class MessageAdmin(admin.ModelAdmin):
    list_display = (
        'reservation', 'sender', 'sender_is_staff', 'content', 'sent_at',
        'is_public', 'get_recipient_list', 'get_read_by_count', 'get_read_by_staff_count', 'is_proposal', 'is_system_message'
    )
    list_filter = ('sender_is_staff', 'is_public', 'is_proposal', 'is_system_message', 'sent_at')
    search_fields = ('content', 'sender__username', 'reservation__id')
    raw_id_fields = ('reservation', 'sender', 'recipient')
    date_hierarchy = 'sent_at'
    ordering = ('-sent_at',)
    
    # 受信者のリストを表示するためのカスタムメソッド
    def get_recipient_list(self, obj):
        return ", ".join([str(user) for user in obj.recipient.all()])
    get_recipient_list.short_description = 'Recipients'  # フィールド名を変更

    # メッセージが読まれたユーザーの数を表示
    def get_read_by_count(self, obj):
        return obj.read_by.count()
    get_read_by_count.short_description = 'Read by Users'

    # スタッフによって読まれたメッセージ数を表示
    def get_read_by_staff_count(self, obj):
        return obj.read_by_staff.count()
    get_read_by_staff_count.short_description = 'Read by Staff'




class GameProposalAdmin(admin.ModelAdmin):
    list_display = ('message', 'game', 'is_game_accepted')
    list_filter = ('participants',)
    search_fields = ('game__name', 'message__content')
    raw_id_fields = ('message', 'game','instructors')
    filter_horizontal = ('participants',)

class GameProposalInstructorAdmin(admin.ModelAdmin):
    list_display = ('game_proposal', 'instructor', 'is_accepted')
    list_filter = ('is_accepted',)
    raw_id_fields = ('game_proposal', 'instructor')








# モデルを管理画面に登録
admin.site.register(CafeTable, CafeTableAdmin)
admin.site.register(TableTimeSlot, TableTimeSlotAdmin)
admin.site.register(Reservation, ReservationAdmin)
admin.site.register(Participant, ParticipantAdmin)
admin.site.register(ReservationTimeSlot, ReservationTimeSlotAdmin)
admin.site.register(PlayGame, PlayGameAdmin)
admin.site.register(Message, MessageAdmin)
admin.site.register(GameProposal, GameProposalAdmin)
admin.site.register(GameProposalInstructor, GameProposalInstructorAdmin)






admin.site.register(CafeGameRelation,CafeGameRelationAdmin)
admin.site.register(StaffGameRelation,StaffGameRelationAdmin)