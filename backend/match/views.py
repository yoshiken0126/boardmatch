

from accounts.models import CustomUser, BoardGame,GameClass
from django.http import HttpResponseForbidden, HttpResponse
from django.shortcuts import render,get_object_or_404,redirect
from django.template.context_processors import request
from django.urls import reverse_lazy
from django.views.generic import UpdateView,TemplateView,CreateView
from match.forms import UserCafeRelationForm, UserCafeRelationFormset, UserFreeTimeForm,UserGameRelationForm,UserUserRelationForm
from accounts.forms import BoardGameCafeForm
from match.models import UserCafeRelation, UserFreeTime, MatchDay, MatchDayUser, UserRelation, UserGameRelation, \
    GameChoice,UserFreeDay
from accounts.models import BoardGameCafe
from mip import Model,maximize,xsum
from django.contrib.auth.mixins import LoginRequiredMixin
import numpy as np
import datetime,random


from accounts.serializers import CustomUserSerializer
from .serializers import BoardGameSerializer,UserGameRelationSerializer,UserCafeRelationSerializer,UserFreeTimeSerializer,BoardGameCafeSerializer,UserRelationSerializer,ReservationSerializer,ParticipantSerializer,UserFreeDaySerializer,UserHaveGameSerializer,CafeHaveGameSerializer,UserGameClassSerializer
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions,viewsets
from .filters import UserGameRelationFilter
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import IsCustomUser,IsCustomUserOrIsStaffUser
from cafes.models import TableTimeSlot,CafeTable,Reservation,ReservationTimeSlot,Participant,CafeGameRelation,Message,SuggestGame
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework import status

class BoardGamePagination(PageNumberPagination):
    page_size = 12  # 1ページあたりのボードゲーム数
    page_size_query_param = 'page_size'  # クライアントがページサイズを変更できるようにするパラメータ
    max_page_size = 100  # 最大ページサイズの制限

# Create your views here.
class BoardGameViewSet(viewsets.ModelViewSet):
    queryset = BoardGame.objects.all()
    serializer_class = BoardGameSerializer
    pagination_class = BoardGamePagination  # ページネーションクラスを適用
    

class BoardGameCafeList(generics.ListCreateAPIView):
    queryset = BoardGameCafe.objects.all()
    serializer_class = BoardGameCafeSerializer


class UserGameRelationViewSet(viewsets.ModelViewSet):
    serializer_class = UserGameRelationSerializer
    permission_classes = [IsCustomUser]
    filter_backends = (DjangoFilterBackend,)  # フィルタリング用バックエンドを指定
    filterset_class = UserGameRelationFilter  # 使用するフィルタクラスを指定

    def get_queryset(self):
        # ログイン中のユーザーに関連するUserGameRelationを返す
        user = self.request.user
        return UserGameRelation.objects.filter(user=user)

    def partial_update(self, request, *args, **kwargs):
        # 現在のユーザーを取得
        user = self.request.user
        customuser = CustomUser.objects.get(username=user.username)
        
        # ゲームIDを取得 (URLのpkパラメータから)
        game_id = kwargs.get('pk')
        
        try:
            # 対象のゲーム取得
            game = BoardGame.objects.get(pk=game_id)
            
            # 既存の関係を探す、なければ新規作成
            relation, created = UserGameRelation.objects.get_or_create(
                user=customuser,
                game=game,
                defaults={
                    'can_instruct': False,
                    'want_to_play': False,
                    'not_for_me': False,
                    'is_having': False
                }
            )
            
            # リクエストデータから更新するフィールドを取得
            update_fields = {}
            for field in ['can_instruct', 'want_to_play', 'not_for_me', 'is_having']:
                if field in request.data:
                    update_fields[field] = request.data[field]
            
            # フィールドを更新
            for field, value in update_fields.items():
                setattr(relation, field, value)
            
            # 保存
            relation.save()
            
            # 全てのフィールドがFalseになった場合、レコードを削除
            relation.delete_if_all_false()
            
            # 更新/削除後のオブジェクトをシリアライズして返す
            if relation.pk:  # 削除されていない場合
                serializer = self.get_serializer(relation)
                return Response(serializer.data)
            else:  # 削除された場合
                return Response(status=status.HTTP_204_NO_CONTENT)
                
        except BoardGame.DoesNotExist:
            return Response(
                {"detail": "Game not found."},
                status=status.HTTP_404_NOT_FOUND
            )


class UserFreeDayViewSet(viewsets.ModelViewSet):
    queryset = UserFreeDay.objects.all()
    serializer_class = UserFreeDaySerializer
    permission_classes = [IsCustomUser]

    def perform_create(self, serializer):
        # 現在のユーザーを自動的に設定
        user = self.request.user
        customuser = CustomUser.objects.get(username=user.username)
        serializer.save(user=customuser)

    def get_queryset(self):
        # ログインしているユーザーに関連するUserFreeTimeだけを返す
        user = self.request.user
        customuser = CustomUser.objects.get(id=user.id)
        return UserFreeDay.objects.filter(user=customuser)

class UserFreeTimeViewSet(viewsets.ModelViewSet):
    queryset = UserFreeTime.objects.all()
    serializer_class = UserFreeTimeSerializer
    permission_classes = [IsCustomUser]

    def get_queryset(self):
        # ログインしているユーザーに関連するUserFreeTimeだけを返す
        return UserFreeTime.objects.filter(user=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        # 部分的な更新処理
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)  # 部分的更新
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    def perform_update(self, serializer):
        # ユーザーを自動的にセット
        user = self.request.user
        customuser = CustomUser.objects.get(username=user.username)
        serializer.save(user=customuser)


class UserCafeRelationViewSet(viewsets.ModelViewSet):
    serializer_class = UserCafeRelationSerializer
    permission_classes = [IsCustomUser]

    def get_queryset(self):
        # ログインユーザーに関連するUserCafeRelationを返す
        user = self.request.user
        customuser = CustomUser.objects.get(username=user.username)
        return UserCafeRelation.objects.filter(user=customuser)


class UserRelationViewSet(viewsets.ModelViewSet):
    queryset = UserRelation.objects.all()
    serializer_class = UserRelationSerializer
    permission_classes = [IsCustomUser]

    def get_queryset(self):
        # ログイン中のユーザーに関連するUserGameRelationを返す
        user = self.request.user
        return UserRelation.objects.filter(from_user=user)

class UserInfoViewSet(viewsets.GenericViewSet):
    permission_classes = [IsCustomUser]  # ログインユーザーのみアクセス可能
    serializer_class = CustomUserSerializer

    def get_object(self):
        # ログインユーザーの情報を取得
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        # ログインユーザーの情報を取得してシリアライズして返す
        user = self.request.user
        customuser = CustomUser.objects.get(username=user.username)
        serializer = self.get_serializer(customuser)
        return Response(serializer.data)

    def patch(self, request, *args, **kwargs):
        # is_optimize_active フィールドを更新するために、PATCHリクエストを処理
        user = self.request.user
        customuser = CustomUser.objects.get(username=user.username)
        

        # リクエストデータを使って部分的に更新
        serializer = self.get_serializer(customuser, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()  # ユーザー情報を保存
            return Response(serializer.data)  # 更新したデータを返す
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserHaveGameViewSet(viewsets.ModelViewSet):
    serializer_class = UserHaveGameSerializer

    def list(self, request, game_class):
        try:
            # ゲームクラスの識別子を日本語表記にマッピング
            game_class_mapping = {
                'light': '軽量級',
                'medium': '中量級',
                'heavy': '重量級',
            }

            # game_class がマッピングに存在するか確認
            if game_class not in game_class_mapping:
                return Response({"error": "無効なゲームクラスです"}, status=400)

            # ゲームクラス名を取得
            game_class_name = game_class_mapping[game_class]

            # ゲームクラスを取得
            game_class_instance = GameClass.objects.get(name=game_class_name)

            # ユーザーが所有しているゲームの関係を取得
            user = request.user
            customuser = CustomUser.objects.get(id=user.id)
            
            # ゲームクラスに関連するゲームかつユーザーが所有しているゲームをフィルタリング
            user_games = UserGameRelation.objects.filter(
                user=customuser,
                is_having=True,
                game__game_class=game_class_instance
            )

            # シリアライズして返す
            serializer = UserHaveGameSerializer(user_games, many=True)
            return Response(serializer.data)

        except GameClass.DoesNotExist:
            return Response({"error": "指定されたゲームクラスが存在しません"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class CafeHaveGameViewSet(viewsets.ModelViewSet):
    serializer_class = CafeHaveGameSerializer

    def list(self, request, cafe_id, player_class):
        try:
            # プレイヤークラスの識別子を日本語表記にマッピング
            game_class_mapping = {
                'light': '軽量級',
                'medium': '中量級',
                'heavy': '重量級',
            }

            # player_classがマッピングに存在するか確認
            if player_class not in game_class_mapping:
                return Response({"error": "無効なプレイヤークラスです"}, status=400)

            # ゲームクラス名を取得
            game_class_name = game_class_mapping[player_class]
            print(cafe_id)

            # ゲームクラスを取得
            game_class_instance = GameClass.objects.get(name=game_class_name)

            # カフェIDに基づいて関連するゲームを取得
            cafe_game_relations = CafeGameRelation.objects.filter(
                cafe_id=cafe_id,
                game__game_class=game_class_instance
            )

            # シリアライズして返す
            serializer = CafeHaveGameSerializer(cafe_game_relations, many=True)
            return Response(serializer.data)

        except GameClass.DoesNotExist:
            return Response({"error": "指定されたゲームクラスが存在しません"}, status=400)
        except CafeGameRelation.DoesNotExist:
            return Response({"error": "指定されたカフェに関連するゲームが存在しません"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()  # 予約の一覧を取得
    serializer_class = ReservationSerializer  # 使用するシリアライザを指定
    permission_classes = [IsCustomUserOrIsStaffUser]  # 認証を要求

    def perform_create(self, serializer):
        """
        予約の作成時に perform_create をオーバーライドして、
        予約のロジックをシリアライザに任せたまま、保存処理を行います
        """
        # シリアライザで定義された create メソッドを呼び出す
        serializer.save()

class ParticipantViewSet(viewsets.ModelViewSet):
    
    serializer_class = ParticipantSerializer

    def get_queryset(self):
        user = self.request.user  # 現在認証されているユーザー

        # ユーザーが訪れることができるカフェのリストを取得
        allowed_cafes = UserCafeRelation.objects.filter(user=user, can_visit=True).values('cafe')

        if self.request.method == 'GET' or self.request.method == 'POST':
            # GETまたはPOSTの場合: 参加していない予約、かつ訪れることができるカフェの予約のみを表示
            return Reservation.objects.filter(
                is_active=True,
                is_recruiting=True,
                cafe__in=allowed_cafes  # ユーザーが訪れることができるカフェに関連する予約のみ
            ).exclude(id__in=Participant.objects.filter(user=user).values('reservation_id'))

        elif self.request.method == 'DELETE':
            # DELETEの場合: ユーザーが参加しているすべての予約を取得
            # ReservationモデルのParticipantテーブルを介してuserに関連する予約を取得
            return Reservation.objects.filter(
                user_relations__user=user  # Participantを介してユーザーが参加している予約を取得
            )
            # デフォルトは空のクエリセットを返す (必要に応じて変更)
            return Reservation.objects.none()



    # 参加者を予約に追加するアクション
    @action(detail=True, methods=['post'])
    def add_participant(self, request, pk=None):
        reservation = self.get_object()
        user = request.user
        customuser = CustomUser.objects.get(id=user.id)

        # 予約がアクティブで募集中かチェック
        if not (reservation.is_active and reservation.is_recruiting):
            return Response({"message": "この予約は現在参加を受け付けていません。"}, status=400)

        # すでに参加しているかチェック
        if reservation.participant.filter(id=user.id).exists():
            return Response({"message": "あなたはすでに参加しています。"}, status=400)

        # 参加者数の上限チェック
        current_participants = reservation.participant.count()
        if current_participants >= reservation.max_participants:
            return Response({"message": "参加者数が上限に達しています。"}, status=400)

        # 参加者を追加
        Participant.objects.create(reservation=reservation, user=customuser)
        reservation.count += 1
        reservation.save()


        return Response({"message": "参加者として追加されました。"}, status=200)

    # 参加者を予約から削除するアクション
    @action(detail=True, methods=['delete'])
    def remove_participant(self, request, pk=None):
        reservation = self.get_object()  # 対象の予約を取得
        user = request.user  # 現在の認証ユーザー（自分自身）
        customuser = CustomUser.objects.get(id=user.id)

        try:
            # 参加者を削除
            participant = Participant.objects.get(reservation=reservation, user=customuser)
            participant.delete()  # 参加者を削除
            reservation.count -= 1
            reservation.save()
            return Response({"message": "予約から外れました。"}, status=200)
        except Participant.DoesNotExist:
            return Response({"message": "あなたはこの予約に参加していません。"}, status=400)


class UserGameClassViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserGameClassSerializer
    permission_classes = [IsCustomUser]

    # GETリクエストで特定のユーザー情報を取得
    def get_queryset(self):
        user = self.request.user  # ログインユーザー
        return CustomUser.objects.filter(id=user.id)

    # POST、PATCHリクエストでの更新を許可
    def perform_update(self, serializer):
        serializer.save()

























def show_frontpage(request):
    user = request.user
    matchdays = MatchDay.objects.filter(user=user).prefetch_related('user_relations','cafe','game')
    context = {'user':user,
               'matchdays':matchdays}

    return render(request,'match/frontpage.html',context)


def user_may_follow(request):
    if request.method == 'POST':
        form = UserUserRelationForm(request.POST)
        if  form.is_valid():
            follow = form.save(commit=False)
            user = request.user
            customuser = CustomUser.objects.get(username=user.username)
            follow.from_user = customuser
            follow.may_follow = True
            follow.save()
            return redirect('match:frontpage')  # 成功時のリダイレクト
        else:
            return HttpResponse(form.errors)
    else:
        user = request.user
        customuser = CustomUser.objects.get(username=user.username)
        form = UserUserRelationForm(instance=customuser)
        may_follow_list = CustomUser.objects.filter(to_user__from_user=customuser, to_user__may_follow=True)

    return render(request, 'match/user_may_follow.html', {'form': form,'may_follow_list':may_follow_list})


def user_must_follow(request):
    if request.method == 'POST':
        form = UserUserRelationForm(request.POST)
        if  form.is_valid():
            follow = form.save(commit=False)
            user = request.user
            customuser = CustomUser.objects.get(username=user.username)
            follow.from_user = customuser
            follow.must_follow = True
            follow.save()
            return redirect('match:frontpage')  # 成功時のリダイレクト
        else:
            return HttpResponse(form.errors)
    else:
        user = request.user
        customuser = CustomUser.objects.get(username=user.username)
        form = UserUserRelationForm(instance=customuser)
        must_follow_list = CustomUser.objects.filter(to_user__from_user=customuser, to_user__must_follow=True)

    return render(request, 'match/user_must_follow.html', {'form': form,'must_follow_list':must_follow_list})


def user_want_to_play(request):
    if request.method == 'POST':
        form = UserGameRelationForm(request.POST)
        if  form.is_valid():
            game = form.save(commit=False)
            user = request.user
            customuser = CustomUser.objects.get(username=user.username)
            game.user = customuser
            game.want_to_play = True
            game.save()
            return redirect('match:frontpage')  # 成功時のリダイレクト
        else:
            return HttpResponse(form.errors)
    else:
        user = request.user
        customuser = CustomUser.objects.get(username=user.username)
        form = UserGameRelationForm(instance=customuser)
        want_list = BoardGame.objects.filter(user_relations__user=customuser, user_relations__want_to_play=True)

    return render(request, 'match/user_want_to_play.html', {'form': form,'want_list':want_list})


def user_can_instruct(request):
    if request.method == 'POST':
        form = UserGameRelationForm(request.POST)
        if  form.is_valid():
            game = form.save(commit=False)
            user = request.user
            customuser = CustomUser.objects.get(username=user.username)
            game.user = customuser
            game.can_instruct = True
            game.save()
            return redirect('match:frontpage')  # 成功時のリダイレクト
        else:
            return HttpResponse(form.errors)
    else:
        user = request.user
        customuser = CustomUser.objects.get(username=user.username)
        form = UserGameRelationForm(instance=customuser)
        can_list = BoardGame.objects.filter(user_relations__user=customuser, user_relations__can_instruct=True)
    return render(request, 'match/user_can_instruct.html', {'form': form,'can_list':can_list})


def can_visit_cafe(request):
    if request.method == 'POST':
        formset = UserCafeRelationFormset(request.POST)
        if  formset.is_valid():
            formset.save()
            return redirect('match:frontpage')  # 成功時のリダイレクト
        else:
            return HttpResponse(formset.errors)
    else:
        user = request.user
        queryset = UserCafeRelation.objects.filter(user=user)
        formset = UserCafeRelationFormset(queryset=queryset)
    return render(request, 'match/can_visit_cafe.html', {'formset': formset})


def can_visit_time(request):
    if request.method == 'POST':
        user = request.user
        instance = UserFreeTime.objects.get(user=user)
        form = UserFreeTimeForm(request.POST,instance=instance)
        if form.is_valid():
            form.save()
            return redirect('match:frontpage')
        else:
            return HttpResponse(form.errors)
    else:
        user = request.user
        instance = UserFreeTime.objects.get(user=user)
        form = UserFreeTimeForm(instance=instance)
    return render(request,'match/can_visit_time.html',{'form':form})


def get_next_week_dates():
    today = datetime.date.today()
    weekday = today.weekday()  # 今日が週の何日目か（月曜日が0、日曜日が6）
    next_monday = today + datetime.timedelta(days=7 - today.weekday())
    next_week_dates = [next_monday + datetime.timedelta(days=i) for i in range(7)]
    return next_week_dates
#試し
def get_next_4_weeks_dates():
    today = datetime.date.today()
    weekday = today.weekday()  # 今日が週の何日目か（月曜日が0、日曜日が6）
    # 次の月曜日の日付を求める
    next_monday = today + datetime.timedelta(days=7 - today.weekday())
    # 4週間分の日付を作成
    all_dates = []
    for week in range(4):
        week_dates = [next_monday + datetime.timedelta(days=i + week * 7) for i in range(7)]
        all_dates.extend(week_dates)  # 1次元配列に追加
    
    return all_dates


def get_available_table_counts(cafe_id):
    from datetime import datetime, timedelta
    from django.utils import timezone
    # 現在の日時を取得
    now = timezone.now()

    # 現在の週の翌週の月曜日の日付を取得
    start_of_next_week = now + timedelta(days=(7 - now.weekday()))
    
    # 返すべき結果を格納するリスト
    available_table_counts = []

    # 月曜日から日曜日まで、各日の13時～18時と18時～23時について調べる
    for i in range(7):
        # 各日の開始時刻と終了時刻を設定
        current_day = start_of_next_week + timedelta(days=i)
        
        # 13:00～18:00のスロット
        start_time_13_18 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 13, 0))
        end_time_13_18 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 18, 0))
        
        # 18:00～23:00のスロット
        start_time_18_23 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 18, 0))
        end_time_18_23 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 23, 0))
        
        # 13:00～18:00の予約可能なテーブル数を計算
        available_count_13_18 = count_available_tables(cafe_id, start_time_13_18, end_time_13_18)
        
        # 18:00～23:00の予約可能なテーブル数を計算
        available_count_18_23 = count_available_tables(cafe_id, start_time_18_23, end_time_18_23)

        # 結果をリストに追加
        available_table_counts.append(available_count_13_18)
        available_table_counts.append(available_count_18_23)
    
    return available_table_counts
#試し
def get_available_table_counts_for_4_weeks(cafe_id):
    from django.utils import timezone
    from datetime import datetime, timedelta
    # 現在の日時を取得
    now = timezone.now()

    # 現在の週の翌週の月曜日の日付を取得
    start_of_next_week = now + timedelta(days=(7 - now.weekday()))
    
    # 返すべき結果を格納するリスト
    available_table_counts = []

    # 4週間分（28日分）の各日の13時～18時と18時～23時のスロットを調べる
    for week in range(4):
        for i in range(7):
            # 各日の開始時刻と終了時刻を設定
            current_day = start_of_next_week + timedelta(weeks=week, days=i)
            
            # 13:00～18:00のスロット
            start_time_13_18 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 13, 0))
            end_time_13_18 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 18, 0))
            
            # 18:00～23:00のスロット
            start_time_18_23 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 18, 0))
            end_time_18_23 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 23, 0))
            
            # 13:00～18:00の予約可能なテーブル数を計算
            available_count_13_18 = count_available_tables(cafe_id, start_time_13_18, end_time_13_18)
            
            # 18:00～23:00の予約可能なテーブル数を計算
            available_count_18_23 = count_available_tables(cafe_id, start_time_18_23, end_time_18_23)

            # 結果をリストに追加
            available_table_counts.append(available_count_13_18)
            available_table_counts.append(available_count_18_23)
    
    return available_table_counts
#上二つで使用
def count_available_tables(cafe_id, start_time, end_time):
    # 指定されたカフェIDに関連するテーブルを取得
    cafe_tables = CafeTable.objects.filter(cafe_id=cafe_id)

    # 指定された時間帯に重なる TableTimeSlot を取得
    timeslots = TableTimeSlot.objects.filter(timeslot_range__overlap=(start_time, end_time))

    available_table_count = 0

    # テーブルごとにフィルタリング
    for table in cafe_tables:
        # このテーブルに関連する timeslot を取得
        table_timeslots = timeslots.filter(table=table)

        # そのテーブルに関連するすべての時間帯が「予約されていない」かを確認
        all_available = True
        for slot in table_timeslots:
            if slot.is_reserved or slot.is_closed:
                all_available = False
                break
        
        # すべての時間帯が予約されていない場合、そのテーブルをカウント
        if all_available:
            available_table_count += 1
    
    return available_table_count

#空いているテーブルIDを取得する関数

def get_available_table_ids_for_week(cafe_id):

    from datetime import datetime, timedelta
    from django.utils import timezone
    from cafes.models import CafeTable, TableTimeSlot
    # 現在の日時を取得
    now = timezone.now()
    
    # 現在の週の翌週の月曜日の日付を取得
    start_of_next_week = now + timedelta(days=(7 - now.weekday()))
    
    # 返すべき結果を格納するリスト
    available_table_ids = []

    # 月曜日から日曜日まで、各日の13時～18時と18時～23時について調べる
    for i in range(7):
        # 各日の開始時刻と終了時刻を設定
        current_day = start_of_next_week + timedelta(days=i)
        
        # 13:00～18:00のスロット
        start_time_13_18 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 13, 0))
        end_time_13_18 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 18, 0))
        
        # 18:00～23:00のスロット
        start_time_18_23 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 18, 0))
        end_time_18_23 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 23, 0))
        
        # 予約可能なテーブルIDを取得（13:00～18:00）
        available_ids_13_18 = get_available_table_ids_for_slot(cafe_id, start_time_13_18, end_time_13_18)
        
        # 予約可能なテーブルIDを取得（18:00～23:00）
        available_ids_18_23 = get_available_table_ids_for_slot(cafe_id, start_time_18_23, end_time_18_23)

        # 結果をリストに追加
        available_table_ids.append(available_ids_13_18)
        available_table_ids.append(available_ids_18_23)
    
    return available_table_ids
#試し
def get_available_table_ids_for_4_weeks(cafe_id):
    from datetime import datetime, timedelta
    from django.utils import timezone
    from cafes.models import CafeTable, TableTimeSlot
    # 現在の日時を取得
    now = timezone.now()
    
    # 現在の週の翌週の月曜日の日付を取得
    start_of_next_week = now + timedelta(days=(7 - now.weekday()))
    
    # 返すべき結果を格納するリスト
    available_table_ids = []

    # 4週間分（28日間）の各日の13時～18時と18時～23時を調べる
    for week in range(4):  # 4週間分
        for i in range(7):  # 月曜日から日曜日まで
            # 各日の開始時刻と終了時刻を設定
            current_day = start_of_next_week + timedelta(weeks=week, days=i)
            
            # 13:00～18:00のスロット
            start_time_13_18 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 13, 0))
            end_time_13_18 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 18, 0))
            
            # 18:00～23:00のスロット
            start_time_18_23 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 18, 0))
            end_time_18_23 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 23, 0))
            
            # 予約可能なテーブルIDを取得（13:00～18:00）
            available_ids_13_18 = get_available_table_ids_for_slot(cafe_id, start_time_13_18, end_time_13_18)
            
            # 予約可能なテーブルIDを取得（18:00～23:00）
            available_ids_18_23 = get_available_table_ids_for_slot(cafe_id, start_time_18_23, end_time_18_23)

            # 結果をリストに追加
            available_table_ids.append(available_ids_13_18)
            available_table_ids.append(available_ids_18_23)
    
    return available_table_ids
#上二つで使用
def get_available_table_ids_for_slot(cafe_id, start_time, end_time):
    # 指定されたカフェIDに関連するテーブルを取得
    cafe_tables = CafeTable.objects.filter(cafe_id=cafe_id)

    # 指定された時間帯に重なる TableTimeSlot を取得
    timeslots = TableTimeSlot.objects.filter(timeslot_range__overlap=(start_time, end_time))

    available_table_ids = []

    # テーブルごとにフィルタリング
    for table in cafe_tables:
        # このテーブルに関連する timeslot を取得
        table_timeslots = timeslots.filter(table=table)

        # そのテーブルに関連するすべての時間帯が「予約されていない」かを確認
        all_available = True
        for slot in table_timeslots:
            if slot.is_reserved or slot.is_closed:
                all_available = False
                break
        
        # すべての時間帯が予約されていない場合、そのテーブルIDをリストに追加
        if all_available:
            available_table_ids.append(table.id)
    
    return available_table_ids


def generate_time_slots():
    from datetime import datetime, timedelta
    from django.utils import timezone
    # 現在の週の翌週の月曜日の日付を取得
    now = timezone.now()
    start_of_next_week = now + timedelta(days=(7 - now.weekday()))

    # スタートタイエンドタイムムとのリスト
    start_times = []
    end_times = []

    # 月曜日から日曜日まで、各日の13時～18時と18時～23時について調べる
    for i in range(7):
        current_day = start_of_next_week + timedelta(days=i)
        
        # 13:00～18:00のスロット
        start_time_13_18 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 13, 0))
        end_time_13_18 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 18, 0))
        
        # 18:00～23:00のスロット
        start_time_18_23 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 18, 0))
        end_time_18_23 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 23, 0))
        
        # リストに追加
        start_times.extend([start_time_13_18, start_time_18_23])
        end_times.extend([end_time_13_18, end_time_18_23])

    return start_times, end_times

#試し
def generate_time_slots_for_4_weeks():
    from datetime import datetime, timedelta
    from django.utils import timezone
    # 現在の日時を取得
    now = timezone.now()
    
    # 現在の週の翌週の月曜日の日付を取得
    start_of_next_week = now + timedelta(days=(7 - now.weekday()))
    
    # スタートタイムとエンドタイムのリスト
    start_times = []
    end_times = []

    # 4週間分（28日間）の各日の13時～18時と18時～23時を生成
    for week in range(4):  # 4週間分
        for i in range(7):  # 月曜日から日曜日まで
            current_day = start_of_next_week + timedelta(weeks=week, days=i)
            
            # 13:00～18:00のスロット
            start_time_13_18 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 13, 0))
            end_time_13_18 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 18, 0))
            
            # 18:00～23:00のスロット
            start_time_18_23 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 18, 0))
            end_time_18_23 = timezone.make_aware(datetime(current_day.year, current_day.month, current_day.day, 23, 0))
            
            # リストに追加
            start_times.extend([start_time_13_18, start_time_18_23])
            end_times.extend([end_time_13_18, end_time_18_23])

    return start_times, end_times

def get_user_free_time(user):
    from datetime import timedelta
    from django.utils import timezone
    from .models import UserFreeDay
    # 次の月曜日を求める
    now = timezone.now()
    start_of_next_week = now + timedelta(days=(7 - now.weekday()))  # 次の月曜日
    
    # 4週間分のデータを取得
    free_days = UserFreeDay.objects.filter(user=user, freeday__gte=start_of_next_week, freeday__lt=start_of_next_week + timedelta(weeks=4))
    
    # 週ごとのリストを作成
    result = []
    for week_offset in range(4):  # 4週間分
        for day_offset in range(7):  # 7日間
            day_of_week = start_of_next_week + timedelta(days=week_offset * 7 + day_offset)
            daytime = free_days.filter(freeday=day_of_week, daytime=True).exists()
            nighttime = free_days.filter(freeday=day_of_week, nighttime=True).exists()
            result.append(daytime)  # daytime
            result.append(nighttime)  # nighttime
    
    return result

def create_all_cafes_six_weeks_later_timeslots():
    from datetime import timedelta, datetime
    from django.utils import timezone
    # 全てのカフェテーブルを取得
    cafe_tables = CafeTable.objects.all()

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

    # 各カフェテーブルで6週間後のタイムスロットを作成
    for cafe_table in cafe_tables:
        # 6週間後の月曜日を計算
        created_at = cafe_table.created_at if hasattr(cafe_table, 'created_at') else timezone.now()
        start_of_week = created_at + timedelta(weeks=5) - timedelta(days=created_at.weekday())

        # デフォルトの営業時間を取得
        default_opening = cafe_table.cafe.opening_time
        default_closing = cafe_table.cafe.closing_time

        # 6週間後の1週間分のタイムスロットを作成
        for day_offset in range(7):  # 1週間分、7日間のタイムスロットを作成
            day_start = start_of_week + timedelta(days=day_offset)
            weekday_name = weekday_names[day_start.weekday()]

            # その曜日の営業時間を取得
            day_opening = getattr(cafe_table.cafe, f"{weekday_name}_open")
            day_closing = getattr(cafe_table.cafe, f"{weekday_name}_close")

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
                    table=cafe_table,
                    timeslot_range=(current_time, next_time),
                    is_closed=is_closed
                )

                current_time = next_time


def try_optimize(request):
    cafes = BoardGameCafe.objects.all()
    active_users = CustomUser.objects.filter(is_optimize_active=True,game_class__name='中量級')
    user_index_map = {user.id: index for index, user in enumerate(active_users)}
    num_users = len(active_users)
    num_cafes = len(cafes)
    num_days = 56

    list2 = []
    data = []
    false_list1 = [False]*num_cafes
    false_list2 = []
    freetime_list = []
    

    for user in active_users:
        user_freetime = get_user_free_time(user)
        freetime_list.append(user_freetime)
        
   
    

    for day in range(num_days):
        list2 = []
        for user_index,user in enumerate(active_users):
            relations = UserCafeRelation.objects.filter(user=user).order_by('cafe__id')
            can_visit_list = [relation.can_visit for relation in relations]

            if freetime_list[user_index][day] == True:
                list2.append(can_visit_list)
            elif freetime_list[user_index][day] == False:
                list2.append(false_list1)
        data.append(list2)

        #list2.append(can_visit_list)
        #false_list2.append(false_list1)


    data = np.array(data)


    m = Model()
    x = m.add_var_tensor((num_days,num_users,num_cafes),'x',var_type='B')
    y = m.add_var_tensor((num_days,num_cafes,),'y',var_type='I')
    ff_true = m.add_var_tensor((num_days,num_cafes,num_users),'ff_count',var_type='B')
    gf_true = m.add_var_tensor((num_days, num_cafes, num_users), 'gf_true', var_type='B')


#システムの基盤を定義
    m += 0 <= y

    for day in range(num_days):
        for user in range(num_users):
            m +=  0 <= xsum(x[day,user,:]) <= 1

    for user in range(num_users):
        for cafe in range(num_cafes):
            m +=  0 <= xsum(x[:,user,:].flat) <= 1


    for day in range(num_days):
        for cafe in range(num_cafes):
            m += xsum(x[day,:,cafe]) == 4*y[day,cafe]

    for day in range(num_days):
        for user in range(num_users):
            for cafe in range(num_cafes):
                if data[day,user,cafe] == 0:
                    m += x[day,user,cafe] == 0
                else:
                    pass

    #カフェの空きテーブルに応じたカフェ毎のマッチング総数を定義。まだ途中。

    from django.utils import timezone
    from datetime import datetime
    from cafes.models import TableTimeSlot
    from cafes.models import CafeTable

    # カフェIDを指定
    cafe_id = 10  # 例としてカフェIDを1に指定



    otinpo = get_available_table_counts_for_4_weeks(cafe_id)
    print(f'これはotinpoです{otinpo}')

    cafe_reservations_count_list = []
    for cafe in cafes:
        weekly_list = get_available_table_counts_for_4_weeks(cafe)
        cafe_reservations_count_list.append(weekly_list)

    print(cafe_reservations_count_list)

    

    



    for cafe in range(num_cafes):
        for day in range(num_days):
            m += xsum(x[day,:,cafe]) <= 4*cafe_reservations_count_list[cafe][day]



#game_followシステムを定義
    #user = request.user
    #customuser = CustomUser.objects.get(username=user.username)
    #cafe = BoardGameCafe.objects.get(name='らぽる')
    #cafegame = BoardGame.objects.filter(cafe_relations__cafe=cafe)
    #usergame = BoardGame.objects.filter(user_relations__user=customuser, user_relations__want_to_play=True)
    #game = cafegame & usergame
    #user_can_instruct = CustomUser.objects.filter(game_relations__game__in=game, game_relations__can_instruct=True,
     #                                             is_optimize_active=True).distinct()

    #やりたいゲームリストと説明できるゲームリストを照合し、どのユーザーとマッチングできると嬉しいかのリストを作成。
    can_instruct_list = []
    for cafe in cafes:
        cafe_list = []
        for user in active_users:
            cafegame = BoardGame.objects.filter(cafe_relations__cafe=cafe)
            usergame = BoardGame.objects.filter(user_relations__user=user, user_relations__want_to_play=True)
            game = cafegame & usergame
            user_can_instruct = CustomUser.objects.filter(game_relations__game__in=game,
                                                          game_relations__can_instruct=True,
                                                          is_optimize_active=True).distinct()
            user_index = [user_index_map[user.id] for user in user_can_instruct]
            cafe_list.append(user_index)
        can_instruct_list.append(cafe_list)

    #上で作成したリストをもとに、変数を割り当てる。
    game_list4 = []
    for day in range(num_days):
        game_list3 = []
        for cafe, users_in_cafe in enumerate(can_instruct_list):
            game_list2 = []
            for users_can_instruct in users_in_cafe:
                game_list1 = [x[day, i, cafe] for i in users_can_instruct]
                game_list2.append(game_list1)
            game_list3.append(game_list2)
        game_list4.append(game_list3)

    #game_followシステムの中核
    for day in range(num_days):
        for cafe in range(num_cafes):
            for user in range(num_users):
                m += x[day, user, cafe] >= gf_true[day, cafe, user]
                m += xsum(game_list4[day][cafe][user]) >= gf_true[day, cafe, user]
                for follow in game_list4[day][cafe][user]:
                    m += gf_true[day, cafe, user] >= x[day, user, cafe] + follow - 1

    #may_followシステムを定義
    # フォローフォロワー関係にあるユーザーがアクティブユーザーにおけるどのインデックスに属するかを取得する
    may_follow_list2 = []

    for user in active_users:
        may_follow_relations = UserRelation.objects.filter(from_user=user)
        may_follow_list1 = [user_index_map[relation.to_user.id] for relation in may_follow_relations if relation.may_follow and relation.to_user.id in user_index_map]
        may_follow_list2.append(may_follow_list1)

    #それぞれのインデックスを基に対応するインデックスの変数を取得する。
    may_list4 = []
    for day in range(num_days):
        may_list3 = []
        for cafe in range(num_cafes):
            may_list2 = []
            for follow_list1 in may_follow_list2:
                may_list1 = [x[day,i,cafe] for i in follow_list1]
                may_list2.append(may_list1)
            may_list3.append(may_list2)
        may_list4.append(may_list3)

    #may_followシステムの中核
    for day in range(num_days):
        for cafe in range(num_cafes):
            for user in range(num_users):
                m += x[day,user,cafe] >= ff_true[day,cafe,user]
                m += xsum(may_list4[day][cafe][user]) >= ff_true[day,cafe,user]
                for follow in may_list4[day][cafe][user]:
                    m += ff_true[day,cafe,user] >= x[day,user,cafe]+follow-1

#must_followシステムを定義
    #must_followのユーザーインデックスを取得
    must_follow_list2 = []
    user_index_map = {user.id: index for index, user in enumerate(active_users)}
    for user in active_users:
        must_follow_relations = UserRelation.objects.filter(from_user=user)
        must_follow_list1 = [user_index_map[relation.to_user.id] for relation in must_follow_relations if
                            relation.must_follow]
        must_follow_list2.append(must_follow_list1)

    #must_followインデックスに対応する変数を抽出
    must_list4 = []
    for day in range(num_days):
        must_list3 = []
        for cafe in range(num_cafes):
            must_list2 = []
            for follow_list1 in must_follow_list2:
                must_list1 = [x[day, i, cafe] for i in follow_list1]
                must_list2.append(must_list1)
            must_list3.append(must_list2)
        must_list4.append(must_list3)

    #must_followシステムの中核
    for day in range(num_days):
        for cafe in range(num_cafes):
            for user in range(num_users):
                if must_list4[day][cafe][user]:
                    m += x[day,user,cafe] == must_list4[day][cafe][user][0]

#Blockedシステムを定義
    #blockedのリストを取得する。
    '''must_follow_list2 = []
    user_index_map = {user.id: index for index, user in enumerate(active_users)}
    for user in active_users:
        must_follow_relations = UserRelation.objects.filter(from_user=user)
        must_follow_list1 = [user_index_map[relation.to_user.id] for relation in must_follow_relations if
                             relation.must_follow]
        must_follow_list2.append(must_follow_list1)'''



    m.objective = maximize(xsum(x.flat)+xsum(ff_true.flat)+xsum(gf_true.flat))
    m.optimize(max_solutions=20,max_seconds=10)



    #ユーザーインデックスの辞書を作成
    userdict = {i:user.username for i,user in enumerate(active_users)}
    #カフェインデックスの辞書を作成
    cafe_id_dict = {i:cafe.id for i,cafe in enumerate(cafes)}
    cafedict = {i:cafe.name for i,cafe in enumerate(cafes)}
    daydict = get_next_week_dates()
    start_times, end_times = generate_time_slots_for_4_weeks()

    result_list = np.array([[[int(cafe.x) for cafe in user] for user in day] for day in x])
    result_index_np = np.where(result_list == 1)
    result_index = [result_index_np[0].tolist(),result_index_np[1].tolist(),result_index_np[2].tolist()]
    result_user_dict = {i:result_index[1][i] for i in range(len(result_index[1]))}
    result_user_day_dict = {user_index:day_index for user_index,day_index in zip(result_index[1],result_index[0])}
    result_user_cafe_dict = {user_index:cafe_index for user_index,cafe_index in zip(result_index[1],result_index[2])}

#最適化実行結果から、ユーザーをランダムに4人1組にグループ分け
    user_group_in_cafe = []
    for cafe in range(num_cafes):
        for day in range(num_days):
            user_index_in_cafe1 = [user_index for day_index,user_index,cafe_index in zip(result_index[0],result_index[1],result_index[2]) if cafe_index == cafe if day_index == day]
            if user_index_in_cafe1:
                random.shuffle(user_index_in_cafe1)
                user_index_in_cafe2 = [user_index_in_cafe1[i:i + 4] for i in range(0, len(user_index_in_cafe1), 4)]
                user_group_in_cafe.append(user_index_in_cafe2)

    print(f'これはuser_group_in_cafeです{user_group_in_cafe}')
    print(f'これはresult_listです{result_list}')
    print(f'これはresult_indexです{result_index}')
    print(f'これはdaydictです{daydict}')
    print(f'これはresult_user_day_dictです{result_user_day_dict}')
    print(f'これはresult_user_cafe_dictです{result_user_cafe_dict}')
    
    '''
    for cafe in range(len(user_group_in_cafe)):
        for group in user_group_in_cafe[cafe]:
            cafe = BoardGameCafe.objects.get(name=cafedict[result_user_cafe_dict[group[0]]])
            day = daydict[result_user_day_dict[group[0]]]
            matchday = MatchDay.objects.create(day=day,cafe=cafe)

            choice_game_want_toplay = BoardGame.objects.none()
            choice_game_can_instruct = BoardGame.objects.none()
            cafegame = BoardGame.objects.filter(cafe_relations__cafe=cafe)
            for user_index in group:
                user = CustomUser.objects.get(username=userdict[user_index])
                matchday_user = MatchDayUser.objects.create(matchday=matchday,user=user)


                wantgame = BoardGame.objects.filter(user_relations__user=user, user_relations__want_to_play=True)
                cangame = BoardGame.objects.filter(user_relations__user=user, user_relations__can_instruct=True)
                #choice_game_want_toplay.update(cafegame & wantgame)
                #choice_game_can_instruct.update(cafegame & cangame)
                choice_game_want_toplay = wantgame | choice_game_want_toplay
                choice_game_can_instruct = cangame | choice_game_can_instruct

            game_choice = (choice_game_want_toplay & choice_game_can_instruct & cafegame).distinct()
            for game in game_choice:
                matchday_choice = GameChoice.objects.create(matchday=matchday,game=game)'''


    #ここからnext.js表示用
    omanko = get_available_table_ids_for_week(cafe_id)
    print(f'これはomankoです{omanko}')
    print(cafe_id_dict[0])
    print(start_times)

    for cafe in range(len(user_group_in_cafe)):
        for group in user_group_in_cafe[cafe]:
            available_table_list = get_available_table_ids_for_4_weeks(cafe_id_dict[result_user_cafe_dict[group[0]]])
            print(f'これはavailable_table_listです{available_table_list}')
            print(f'これはresult_user_day_dict[group[0]]です{result_user_day_dict[group[0]]}')
            

            cafe = BoardGameCafe.objects.get(id=cafe_id_dict[result_user_cafe_dict[group[0]]])
            table = CafeTable.objects.get(id=available_table_list[result_user_day_dict[group[0]]][0])
            reservation = Reservation.objects.create(cafe=cafe,reservation_type='match')
            timeslots = TableTimeSlot.objects.filter(table=table,timeslot_range__overlap=(start_times[result_user_day_dict[group[0]]], end_times[result_user_day_dict[group[0]]]))
            timeslots.update(is_reserved=True)
            for timeslot in timeslots:
                reservation_timeslot = ReservationTimeSlot.objects.create(reservation=reservation,timeslot=timeslot)
            for user_index in group:
                user = CustomUser.objects.get(username=userdict[user_index])
                participant = Participant.objects.create(reservation=reservation,user=user)
            message = Message.objects.create(reservation=reservation,is_public=False,is_system_message=True,content=
            f'マッチングに成功しました。\n場所:{cafe.name}\n日時:\n遊びたいゲームを選択してください。')


            suggest_games = BoardGame.objects.all()
            for suggest_game in suggest_games:
                message = Message.objects.create(reservation=reservation,is_public=False,is_suggest=True)
                game = SuggestGame.objects.create(message=message,suggest_game=suggest_game)
            


            # グループ内の各ユーザーの組み合わせに対してUserRelationを作成
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    user1 = CustomUser.objects.get(username=userdict[group[i]])
                    user2 = CustomUser.objects.get(username=userdict[group[j]])
                
                    # user1 → user2のリレーションをチェック
                    if not UserRelation.objects.filter(from_user=user1, to_user=user2).exists():
                        UserRelation.objects.create(
                            from_user=user1,
                            to_user=user2
                        )
                
                    # user2 → user1のリレーションをチェック
                    if not UserRelation.objects.filter(from_user=user2, to_user=user1).exists():
                        UserRelation.objects.create(
                            from_user=user2,
                            to_user=user1
                        )

            '''cafe = BoardGameCafe.objects.get(name=cafedict[result_user_cafe_dict[group[0]]])
            day = daydict[result_user_day_dict[group[0]]]
            matchday = MatchDay.objects.create(day=day,cafe=cafe)

            choice_game_want_toplay = BoardGame.objects.none()
            choice_game_can_instruct = BoardGame.objects.none()
            cafegame = BoardGame.objects.filter(cafe_relations__cafe=cafe)
            for user_index in group:
                user = CustomUser.objects.get(username=userdict[user_index])
                matchday_user = MatchDayUser.objects.create(matchday=matchday,user=user)


                wantgame = BoardGame.objects.filter(user_relations__user=user, user_relations__want_to_play=True)
                cangame = BoardGame.objects.filter(user_relations__user=user, user_relations__can_instruct=True)
                #choice_game_want_toplay.update(cafegame & wantgame)
                #choice_game_can_instruct.update(cafegame & cangame)
                choice_game_want_toplay = wantgame | choice_game_want_toplay
                choice_game_can_instruct = cangame | choice_game_can_instruct

            game_choice = (choice_game_want_toplay & choice_game_can_instruct & cafegame).distinct()
            for game in game_choice:
                matchday_choice = GameChoice.objects.create(matchday=matchday,game=game)'''



    #ここまでnext.js表示用
    val = ff_true.astype(float, subok=False).round()
    game_x = gf_true.astype(float, subok=False).round()
    val_x = x.astype(float, subok=False).round()
    outcome = m.objective_value

    a = get_next_4_weeks_dates()
    print(val_x)
    return HttpResponse(val_x)
