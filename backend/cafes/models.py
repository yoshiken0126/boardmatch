from django.db import models
from django.contrib.postgres.fields import DateTimeRangeField
from django.utils import timezone
from datetime import timedelta, datetime
from django.db.models import Count
from django.db.models.signals import post_save
from django.dispatch import receiver
from match.models import UserGameRelation

# Create your models here.
class CafeGameRelation(models.Model):
    cafe = models.ForeignKey('accounts.BoardGameCafe',on_delete=models.CASCADE,related_name='game_relations')
    game = models.ForeignKey('accounts.BoardGame',on_delete=models.CASCADE,related_name='cafe_relations')
    can_instruct = models.BooleanField(default=False)
    is_recommended = models.BooleanField(default=False)

    class Meta:
        unique_together = ('cafe', 'game')

class StaffGameRelation(models.Model):
    staff = models.ForeignKey('accounts.CafeStaff',on_delete=models.CASCADE,related_name='game_relations')
    game = models.ForeignKey('accounts.BoardGame',on_delete=models.CASCADE,related_name='staff_relations')
    can_instruct = models.BooleanField(default=False)
    is_recommended = models.BooleanField(default=False)

    class Meta:
        unique_together = ('staff', 'game')


class CafeTable(models.Model):
    cafe = models.ForeignKey('accounts.BoardGameCafe',on_delete=models.CASCADE,related_name="table_relations",)
    table_name = models.CharField(max_length=10)
    capacity = models.PositiveIntegerField(default=4)


    def __str__(self):
        """
        テーブルの文字列表現
        """
        return f"{self.table_name} (Capacity: {self.capacity})"





    def __str__(self):
        return self.table_name

    def create_weekly_timeslots(self):
        # カフェテーブルが作成された日時
        created_at = self.created_at if hasattr(self, 'created_at') else timezone.now()

        # その週の月曜日を計算
        start_of_week = created_at - timedelta(days=created_at.weekday())

        # デフォルトの営業時間を取得
        default_opening = self.cafe.opening_time
        default_closing = self.cafe.closing_time

        # 曜日の対応表
        weekday_names = {
            0: 'monday',
            1: 'tuesday',
            2: 'wednesday',
            3: 'thursday',
            4: 'friday',
            5: 'saturday',
            6: 'sunday'
        }

        # 1週間ごとのタイムスロットを5週間分作成
        for week_offset in range(5):
            for day_offset in range(7):
                day_start = start_of_week + timedelta(weeks=week_offset, days=day_offset)
                weekday_name = weekday_names[day_start.weekday()]
                
                # その曜日の営業時間を取得
                day_opening = getattr(self.cafe, f"{weekday_name}_open")
                day_closing = getattr(self.cafe, f"{weekday_name}_close")

                # デフォルトの時間帯でタイムスロットを作成
                current_time = timezone.make_aware(datetime.combine(day_start, default_opening))
                end_time = timezone.make_aware(datetime.combine(day_start, default_closing))

                while current_time < end_time:
                    next_time = current_time + timedelta(minutes=60)
                    if next_time > end_time:
                        next_time = end_time

                    # タイムスロットが営業時間内かどうかを判定
                    is_closed = True  # デフォルトは閉店状態

                    if day_opening is not None and day_closing is not None:
                        # 営業日の場合、時間帯をチェック
                        slot_time = current_time.time()
                        if day_opening <= slot_time < day_closing:
                            is_closed = False

                    # タイムスロットを作成
                    TableTimeSlot.objects.create(
                        table=self,
                        timeslot_range=(current_time, next_time),
                        is_closed=is_closed
                    )
                    
                    current_time = next_time




class TableTimeSlot(models.Model):
    table = models.ForeignKey('cafes.CafeTable', on_delete=models.CASCADE, related_name='timeslot_relations')
    timeslot_range = DateTimeRangeField(null=True)  # start_time と end_time を範囲型で表現
    is_reserved = models.BooleanField(default=False)
    is_closed = models.BooleanField(default=False)

    

    def __str__(self):
        # タイムゾーンをローカルタイム（例: Asia/Tokyo）に変換
        start_time = timezone.localtime(self.timeslot_range.lower) if self.timeslot_range.lower else None
        end_time = timezone.localtime(self.timeslot_range.upper) if self.timeslot_range.upper else None
        
        # ローカルタイムでフォーマットした開始時刻と終了時刻を表示
        start_time_str = start_time.strftime('%Y-%m-%d %H:%M:%S') if start_time else 'N/A'
        end_time_str = end_time.strftime('%Y-%m-%d %H:%M:%S') if end_time else 'N/A'
        
        # テーブルIDを取得
        table_id = self.table.id if self.table else 'Unknown Table ID'
        
        return f"TableTimeSlot for Table ID {table_id} - {start_time_str} to {end_time_str} ({'Reserved' if self.is_reserved else 'Available'})"
        
    class Meta:
        # 開始時刻（範囲の開始時刻）順に並べる
        ordering = ['timeslot_range']

class Reservation(models.Model):
    cafe = models.ForeignKey('accounts.BoardGameCafe', on_delete=models.CASCADE)  # どのカフェで予約か
    count = models.IntegerField(default=4)
    participant = models.ManyToManyField('accounts.CustomUser',through='Participant')
    max_participants = models.PositiveIntegerField(default=4)  # 最大参加人数を示すフィールド
    timeslot = models.ManyToManyField('cafes.TableTimeSlot',through='ReservationTimeSlot')
    reserved_at = models.DateTimeField(auto_now_add=True)
    reservation_type = models.CharField(max_length=20, choices=[('match', 'マッチング予約'), ('user', 'アプリ予約'), ('staff', '店舗予約')], default='user')
    is_active = models.BooleanField(default=True)
    is_recruiting = models.BooleanField(default=False)  # 募集中を表すフィールド
    game_class = models.ForeignKey('accounts.GameClass', on_delete=models.SET_NULL, null=True, blank=True)
    choice_game = models.ManyToManyField('accounts.BoardGame', blank=True,related_name='choice_game_reservations')
    play_game = models.ManyToManyField('accounts.BoardGame', blank=True,related_name='play_game_reservations',through='PlayGame')

    def save(self, *args, **kwargs):
        # max_participants と count が同じ場合は is_recruiting を False に設定
        if self.max_participants == self.count:
            self.is_recruiting = False
        # count が max_participants より少ない場合は is_recruiting を True に設定
        elif self.count < self.max_participants:
            self.is_recruiting = True

        super().save(*args, **kwargs)  # 親クラスの save メソッドを呼び出す


class PlayGame(models.Model):
    reservation = models.ForeignKey('Reservation', on_delete=models.CASCADE)  # 予約に紐づく
    game = models.ForeignKey('accounts.BoardGame', on_delete=models.CASCADE, related_name='playgames')  # プレイするゲーム 
    provider = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, null=True, blank=True, related_name='provided_games')  # ゲームを持ち込むユーザー 
    instructor = models.ForeignKey('accounts.BaseUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='instructed_games')  # ルール説明者 
    game_provider_type = models.CharField(
        max_length=10,
        choices=[('cafe', 'カフェ'), ('user', 'ユーザー')],
        default='cafe'
    )  # ゲームを提供する主体（カフェかユーザーかを区別）

    class Meta:
        unique_together = ('reservation', 'game', 'game_provider_type')  # 予約、ゲーム、提供者タイプの組み合わせが一意であることを保証

    def save(self, *args, **kwargs):
        # userが指定されている場合、game_provider_typeを'user'に設定
        if self.provider:
            self.game_provider_type = 'user'
        # game_provider_typeが指定されていない場合、cafeをデフォルトに設定
        if not self.game_provider_type:
            self.game_provider_type = 'cafe'

        super().save(*args, **kwargs)  # 親クラスのsaveメソッドを呼び出す

        

class Participant(models.Model):
    reservation = models.ForeignKey('cafes.Reservation', on_delete=models.CASCADE,related_name='user_relations')
    user = models.ForeignKey('accounts.CustomUser',on_delete=models.CASCADE,related_name='reservatin_relations')
    

class ReservationTimeSlot(models.Model):
    reservation = models.ForeignKey('cafes.Reservation', on_delete=models.CASCADE,related_name='timeslot_relations')
    timeslot = models.ForeignKey('cafes.TableTimeSlot', on_delete=models.CASCADE,related_name='reservatin_relations')
    
    class Meta:
        unique_together = ('reservation', 'timeslot')  # 同じ予約とタイムスロットの組み合わせを一意に


class Message(models.Model):
    reservation = models.ForeignKey('cafes.Reservation', on_delete=models.CASCADE, related_name='messages')  # メッセージが紐づく予約
    sender = models.ForeignKey('accounts.BaseUser', on_delete=models.CASCADE, null=True, blank=True)  # ユーザーが送信したメッセージ
    sender_is_staff = models.BooleanField(default=False)  # スタッフが送信したメッセージかどうか
    content = models.TextField(null=True,blank=True)  # メッセージの内容
    sent_at = models.DateTimeField(auto_now_add=True)  # メッセージ送信日時
    
    # 誰に表示されるかを制御するフィールド
    receiver = models.ManyToManyField('accounts.BaseUser', related_name='direct_messages', blank=True)  # 特定のユーザー宛てのメッセージ
    is_public = models.BooleanField(default=True)  # 予約の全員に表示するメッセージかどうか
    
    read_by = models.ManyToManyField('accounts.CustomUser', related_name='read_messages', blank=True)  # メッセージを読んだユーザー
    read_by_staff = models.ManyToManyField('accounts.CafeStaff', related_name='read_messages', blank=True)
    is_suggest = models.BooleanField(default=False)  # ゲームの提案かどうか
    is_rule_approval = models.BooleanField(default=False)
    related_suggest_game = models.ForeignKey('cafes.SuggestGame', on_delete=models.SET_NULL, null=True, blank=True, related_name='rule_approval_messages')
    is_system_message = models.BooleanField(default=False)  # システムメッセージかどうか

    
    def __str__(self):
        sender_name = "スタッフ" if self.sender_is_staff else str(self.sender)
        return f"Message from {sender_name} on {self.sent_at}"

    def get_game_suggest(self):
        """is_suggestがTrueの場合に関連するSuggestGameを取得"""
        if self.is_suggest:
            return SuggestGame.objects.filter(message=self).first()  # SuggestGameを取得
        return None
    
    
    class Meta:
        ordering = ['sent_at']  # 送信日時順に並べる


class SuggestGame(models.Model):
    message = models.ForeignKey('Message', on_delete=models.CASCADE)  # ゲーム提案に紐づくメッセージ
    suggest_game = models.ForeignKey('accounts.BoardGame', on_delete=models.CASCADE)  # 提案されたゲーム
    participants = models.ManyToManyField('accounts.CustomUser', related_name='suggest_games',through='SuggestGameParticipant', blank=True)  # 承認した参加者
    instructors = models.ManyToManyField('accounts.BaseUser', related_name='explained_suggest_games', through='SuggestGameInstructor', blank=True)  # ルール説明者（Instructor）とその受け入れ状態を管理するためのフィールド
    providers = models.ManyToManyField('accounts.CustomUser', related_name='bring_suggest_games',through='SuggestGameProvider', blank=True)
    count_want_to_play = models.IntegerField(default=0)
    is_approved = models.BooleanField(null=True,default=None)
    def __str__(self):
        return f"Suggest Game for message {self.message.id} - Game: {self.suggest_game.name}"
    
    def is_game_accepted(self):
        # ルール説明者の中で一人でも説明を受け入れた場合にゲームが決定する
        return self.suggestgameinstructor_set.filter(is_accepted=True).exists()




    def check_and_create_rule_approval_message(self):
        """
        is_accepted=Trueの参加者が3名以上で、
        まだルール承認メッセージが作成されていない場合に
        ルール承認メッセージを作成するメソッド
        """
        # is_accepted=Trueの参加者数をカウント
        accepted_participants_count = self.suggestgameparticipant_set.filter(is_accepted=True).count()
        
        if accepted_participants_count >= 3:
            # すでにis_rule_approvalメッセージが存在するか確認
            existing_approval_msgs = Message.objects.filter(
                reservation=self.message.reservation,
                sender=None,  # システムメッセージなのでsenderはNone
                sender_is_staff=False,
                content=f"ゲーム「{self.suggest_game.name}」のルール説明を担当しますか？",
                is_public=False,
                is_rule_approval=True,
                related_suggest_game=self  # ここで明示的に自身を関連付け
            )
            print(existing_approval_msgs)
            
            # まだ承認メッセージが作成されていない場合のみ作成
            if not existing_approval_msgs.exists():
                return self.create_rule_approval_message()
                
        return None
    
    def create_rule_approval_message(self):
        """
        ルール承認メッセージを作成するメソッド
        """
        # 関連するReservationを取得
        reservation = self.message.reservation
        
        # is_rule_approval=TrueのMessageインスタンスを作成
        rule_approval_message = Message.objects.create(
            reservation=reservation,
            sender=None,  # システムメッセージなのでsenderはNone
            sender_is_staff=False,
            content=f"ゲーム「{self.suggest_game.name}」のルール説明を担当しますか？",
            is_public=False,
            is_rule_approval=True,
            related_suggest_game=self  # ここで明示的に自身を関連付け
        )

        instructors = self.instructors.all()  # SuggestGameのインストラクターを取得
        rule_approval_message.receiver.add(*instructors)  # receiversにインストラクターを追加
        
        return rule_approval_message


    def add_providers_if_needed(self):
        """
        `Reservation`の参加者で`UserGameRelation`において`is_having=True`のユーザーが、
        `CafeGameRelation`にゲームが存在しない場合、そのユーザーを`providers`に追加する。
        その後、そのユーザーが`providers`に追加されていれば、そのユーザーを`instructor`としても追加する。
        """
        # このSuggestGameに関連する予約を取得
        reservation = self.message.reservation

        # リザベーションに関連するカフェ情報を取得
        cafe = reservation.cafe

        # リザベーションに参加しているユーザーを取得
        participants = Participant.objects.filter(reservation=reservation)

        # 参加者の中から、is_having=Trueのユーザーを絞り込み
        for participant in participants:
            user = participant.user

            # ユーザーがそのゲームを所有しているか確認（is_having=True）
            user_game_relation = UserGameRelation.objects.filter(user=user, game=self.suggest_game, is_having=True).first()

            # ユーザーがそのゲームを所有していて、かつCafeGameRelationにゲームがない場合
            if user_game_relation:
                # ユーザーがそのカフェにゲームを持ち込んでいない場合
                if not CafeGameRelation.objects.filter(cafe=cafe, game=self.suggest_game).exists():
                    # SuggestGameProviderがすでに存在しない場合のみ作成
                    if not SuggestGameProvider.objects.filter(suggest_game=self, provider=user).exists():
                        suggest_game_provider = SuggestGameProvider.objects.create(
                            suggest_game=self,
                            provider=user
                        )

                        # ユーザーがproviderに追加された場合、そのユーザーをinstructorにも追加
                        if not SuggestGameInstructor.objects.filter(suggest_game=self, instructor=user).exists():
                            # ここでinstructorを追加
                            SuggestGameInstructor.objects.create(
                                suggest_game=self,
                                instructor=user,
                                is_accepted=None  # 初期状態では未承認
                            )

                        

    def add_instructors_if_possible(self):
        """
        `UserGameRelation`で`can_instruct=True`で、かつ予約の参加者である場合
        自動的に`SuggestGameInstructor`に追加するメソッド
        """
        # Reservationに紐づく全参加者を取得
        reservation_participants = self.message.reservation.participant.all()

        # ルール説明者として追加できるユーザーを検索
        for participant in reservation_participants:
            # `UserGameRelation`で`can_instruct=True`のユーザーを検索
            user_game_relation = UserGameRelation.objects.filter(
                user=participant,
                game=self.suggest_game,
                can_instruct=True
            ).first()

            if user_game_relation:
                # `UserGameRelation`が存在し、`can_instruct=True`ならインストラクターとして追加
                # 同じ`suggest_game`と`instructor`が既に存在するかチェック
                if not SuggestGameInstructor.objects.filter(suggest_game=self, instructor=participant).exists():
                    # 存在しない場合のみインスタンスを作成
                    SuggestGameInstructor.objects.create(
                        suggest_game=self,
                        instructor=participant,  # 参加者がインストラクター
                        is_accepted=None  # 初期状態では未承認
                    )


                

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Add providers if needed
        self.add_providers_if_needed()
        
        # Add instructors if possible
        if not self.providers.exists():
            self.add_instructors_if_possible()
        
       
        




class SuggestGameInstructor(models.Model):
    suggest_game = models.ForeignKey('SuggestGame', on_delete=models.CASCADE)  # ゲーム提案に紐づく
    instructor = models.ForeignKey('accounts.BaseUser', on_delete=models.CASCADE)  # ルール説明者（スタッフ）
    is_accepted = models.BooleanField(null=True, default=None) 
    
    def __str__(self):
        return f"Instructor {self.instructor} accepted: {self.is_accepted} for suggest {self.suggest_game.id}"

    

class SuggestGameProvider(models.Model):
    suggest_game = models.ForeignKey('SuggestGame', on_delete=models.CASCADE)  # ゲーム提案に紐づく
    provider = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)  # ルール説明者（スタッフ）
    
    def __str__(self):
        return f"Instructor {self.provider}  for suggest {self.suggest_game.id}"

class SuggestGameParticipant(models.Model):
    suggest_game = models.ForeignKey('SuggestGame', on_delete=models.CASCADE)  # ゲーム提案に紐づく
    participant = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE)  # ルール説明者（スタッフ）
    is_accepted = models.BooleanField(default=False)  # ルール説明を受け入れたかどうか

    def __str__(self):
        return f"Instructor {self.participant} accepted: {self.is_accepted} for suggest {self.suggest_game.id}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        print(f"SuggestGameParticipant save called. Is new: {is_new}")
        
        super().save(*args, **kwargs)
        
        if is_new:
            print("Checking for rule approval message creation")
            participants_count = self.suggest_game.participants.count()
            print(f"Current participants count: {participants_count}")
            self.suggest_game.check_and_create_rule_approval_message()

