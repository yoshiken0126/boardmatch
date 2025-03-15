from django.shortcuts import render,redirect
from accounts.models import CustomUser, BoardGameCafe, CafeStaff, BoardGame
from match.models import UserCafeRelation, UserFreeTime, MatchDay, MatchDayUser,UserRelation,UserGameRelation
from cafes.forms import CafeGameRelationForm,CafeGameRelation,StaffGameRelation,StaffGameRelationForm
from django.http import HttpResponse
# Create your views here.
from mip import Model,maximize,xsum
import numpy as np
import datetime,random
from .models import CafeTable,Message,SuggestGame
from .serializers import CafeTableSerializer,BoardGameCafeSerializer,MessageSerializer
from accounts.serializers import StaffUserSerializer
from accounts.permissions import IsStaffUser,IsCustomUser
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action



class CafeTableViewSet(viewsets.ModelViewSet):
    serializer_class = CafeTableSerializer
    
    def get_object(self):
        # ログインユーザーの情報を取得
        return self.request.user

    def get_queryset(self):
        user = self.get_object()
        print(f"{user}です。")
        staff = CafeStaff.objects.get(username=user.username)
        cafe = staff.cafe
        print(cafe)

        return CafeTable.objects.filter(cafe=cafe)  # カフェに関連するテーブルのみ返す

       

class StaffInfoViewSet(viewsets.GenericViewSet):
    permission_classes = [IsStaffUser]  # ログインユーザーのみアクセス可能
    serializer_class = StaffUserSerializer

    def get_object(self):
        # ログインユーザーの情報を取得
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        # ログインユーザーの情報を取得してシリアライズして返す
        user = self.get_object()
        staffuser = CafeStaff.objects.get(username=user.username)
        serializer = self.get_serializer(staffuser)
        return Response(serializer.data)

class BoardGameCafeViewSet(viewsets.ModelViewSet):
    serializer_class = BoardGameCafeSerializer  # 使用するシリアライザを指定

    def get_queryset(self):
        """
        ログインユーザーが管理するカフェの情報を取得する。
        """
        user = self.request.user
        staffuser = CafeStaff.objects.get(username=user.username)
        cafe = staffuser.cafe
        return BoardGameCafe.objects.filter(id=cafe.id)  # スタッフが管理するカフェのみ返す

    def retrieve(self, request, *args, **kwargs):
        """
        ログインユーザーに関連するカフェの詳細情報を返す。
        """
        user = self.request.user
        staffuser = CafeStaff.objects.get(username=user.username)
        cafe = staffuser.cafe

        # cafe情報をシリアライズして返す
        serializer = self.get_serializer(cafe)
        return Response(serializer.data)


#お試しで作成。ダメなら全消去

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status  
from accounts.models import GameClass
from cafes.models import Reservation,SuggestGameParticipant,SuggestGameInstructor
from match.serializers import BoardGameSerializer
from .serializers import ReservationSerializer,SuggestGameParticipantSerializer,SuggestGameInstructorSerializer,CafeHaveSuggestGameSerializer,UserHaveSuggestGameSerializer
from django.db.models import Count

class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer

    def list(self, request, *args, **kwargs):
        user = request.user  # リクエストから現在のユーザーを取得
        user_type = user.user_type  # ユーザータイプを取得

        # カスタムユーザーの場合、ユーザーが参加している予約のみ取得
        if user_type == 'custom_user':
            queryset = self.get_queryset().filter(user_relations__user=user, is_active=True)
        else:
            queryset = self.get_queryset()

        # シリアライズ
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer

    def get_queryset(self):
        """
        リクエストパラメータに基づいて、特定の予約に関連するメッセージのみを取得
        """
        queryset = super().get_queryset()

        # reservation_id がリクエストに含まれている場合
        reservation_id = self.request.query_params.get('reservation_id', None)

        if reservation_id:
            # reservation_id が指定されている場合、関連するメッセージをフィルタリング
            queryset = queryset.filter(reservation__id=reservation_id)

        return queryset

    def create(self, request, *args, **kwargs):
        """
        新しいメッセージを作成する処理
        """
        reservation_id = request.data.get('reservation')
        content = request.data.get('content')

        if not reservation_id or not content:
            return Response({"detail": "reservation and content are required."}, status=status.HTTP_400_BAD_REQUEST)

        # reservation_idが存在する予約を取得
        try:
            reservation = Reservation.objects.get(id=reservation_id)
        except Reservation.DoesNotExist:
            return Response({"detail": "Reservation not found."}, status=status.HTTP_404_NOT_FOUND)

        # メッセージの作成
        message = Message.objects.create(
            reservation=reservation,
            content=content,
            sender=request.user,  # 送信者は現在の認証ユーザー
        )

        # 作成したメッセージをシリアライズしてレスポンスを返す
        serializer = self.get_serializer(message)
        return Response(serializer.data)


#遊びたい見送るを決めるやつ
class SuggestGameParticipantViewSet(viewsets.ModelViewSet):
    #要パフォチュー
    queryset = SuggestGameParticipant.objects.all()
    serializer_class = SuggestGameParticipantSerializer
    permission_classes = [IsCustomUser]  # ユーザー認証を要求する

    def perform_create(self, serializer):
        # `create`メソッドでユーザーは自動的に処理されるため、追加処理は不要
        serializer.save()

class SuggestGameInstructorViewSet(viewsets.ModelViewSet):
    queryset = SuggestGameInstructor.objects.all()
    serializer_class = SuggestGameInstructorSerializer
    
    
    def get_queryset(self):
        """ログインユーザーに関連するデータのみ返す"""
        user = self.request.user
        return SuggestGameInstructor.objects.filter(instructor=user)
    
    @action(detail=True, methods=['patch'], url_path='accept')
    def accept_game(self, request, pk=None):
        """
        ゲームの指導を受け入れるカスタムエンドポイント
        URLパターン: /suggest_game_instructors/{suggestGameId}/accept/
        """
        try:
            # pkはURLから取得したsuggestGameId
            suggest_game = SuggestGame.objects.get(pk=pk)
            
            # このゲームに関連する講師レコードを探す
            # get_or_createではなく、getを使用して既存のレコードのみを取得
            try:
                instructor_record = SuggestGameInstructor.objects.get(
                    suggest_game=suggest_game,
                    instructor=request.user
                )
                
                # レコードを更新
                instructor_record.is_accepted = True
                instructor_record.save()
                
                suggest_game.is_approved = True
                suggest_game.save()
                
                serializer = self.get_serializer(instructor_record)
                return Response(serializer.data)
                
            except SuggestGameInstructor.DoesNotExist:
                return Response(
                    {"error": "このゲームに関連する指導者レコードが見つかりません。"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except SuggestGame.DoesNotExist:
            return Response(
                {"error": "指定されたゲームが見つかりません。"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['patch'], url_path='reject')
    def reject_game(self, request, pk=None):
        """
        ゲームの指導を拒否するカスタムエンドポイント
        URLパターン: /suggest_game_instructors/{suggestGameId}/reject/
        """
        try:
            # pkはURLから取得したsuggestGameId
            suggest_game = SuggestGame.objects.get(pk=pk)
            
            # このゲームに関連する講師レコードを探す
            # filterではなく、getを使用して例外処理を統一
            try:
                instructor_record = SuggestGameInstructor.objects.get(
                    suggest_game=suggest_game,
                    instructor=request.user
                )
                
                # レコードを更新
                instructor_record.is_accepted = False
                instructor_record.save()
                
                # 全ての指導者が拒否した場合はFalse、一部のみの場合はNone
                if suggest_game.suggestgameinstructor_set.filter(is_accepted=False).count() == suggest_game.suggestgameinstructor_set.count():
                    suggest_game.is_approved = False
                else:
                    suggest_game.is_approved = None
                
                suggest_game.save()
                
                serializer = self.get_serializer(instructor_record)
                return Response(serializer.data)
                
            except SuggestGameInstructor.DoesNotExist:
                return Response(
                    {"error": "このゲームに関連する指導者レコードが見つかりません。"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
        except SuggestGame.DoesNotExist:
            return Response(
                {"error": "指定されたゲームが見つかりません。"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class CafeHaveSuggestGameViewSet(viewsets.ModelViewSet):
    queryset = CafeGameRelation.objects.all()
    serializer_class = CafeHaveSuggestGameSerializer
    permission_classes = [IsCustomUser]  # 認証が必要

    def get_queryset(self):
        """
        `reservation_id`と`player_class`に基づいてゲーム情報をフィルタリングし、
        予約参加者の中でwant_to_play=Trueのユーザー数をカウントして降順にソートする。
        """
        reservation_id = self.kwargs['id']
        player_class = self.kwargs.get('class_param')

        # デフォルトでは空のクエリセットを返す
        queryset = CafeGameRelation.objects.none()

        # ゲームクラスのマッピング
        game_class_mapping = {
            'light': '軽量級',
            'medium': '中量級',
            'heavy': '重量級',
        }

        try:
            # 予約IDからカフェIDを特定
            reservation = Reservation.objects.get(id=reservation_id)
            cafe_id = reservation.cafe.id

            # 予約に参加しているユーザーを取得
            participants = reservation.participant.all()

            # "all"の場合、すべてのゲームを返す処理
            if player_class == 'all' or player_class == '全て' or player_class == '全部':
                # "all"の場合、カフェIDに基づいて関連するすべてのゲームを取得
                queryset = CafeGameRelation.objects.filter(cafe_id=cafe_id)
            else:
                # "all"以外の場合、マッピングされたゲームクラス名を取得
                if player_class in game_class_mapping:
                    mapped_class_name = game_class_mapping[player_class]
                    # プレイヤークラス名（日本語）に基づいてフィルタリング
                    try:
                        game_class_instance = GameClass.objects.get(name=mapped_class_name)
                        # カフェIDとゲームクラスに基づいて関連するゲームを取得
                        queryset = CafeGameRelation.objects.filter(
                            cafe_id=cafe_id,
                            game__game_class=game_class_instance
                        )
                    except GameClass.DoesNotExist:
                        # `GameClass`が存在しない場合、空のクエリセットを返す
                        pass
                else:
                    # マッピングされていない場合は空のクエリセットを返す
                    pass

            # ゲームごとにwant_to_play=Trueのユーザー数をカウント
            result = []
            for relation in queryset:
                game = relation.game

                # 参加者の中でwant_to_play=Trueのユーザーをカウント
                want_to_play_count = participants.filter(
                    game_relations__game=game, game_relations__want_to_play=True
                ).count()

                # 使用するデータ構造に合わせてゲームの詳細を返す
                result.append({
                    'game': BoardGameSerializer(game).data,  # Serializing the game data
                    'want_to_play_count': want_to_play_count
                })

            # want_to_play_countの降順でソート
            result.sort(key=lambda x: x['want_to_play_count'], reverse=True)

            return result

        except Reservation.DoesNotExist:
            # `Reservation`が存在しない場合、空のリストを返す
            return []


class UserHaveSuggestGameViewSet(viewsets.ModelViewSet):
    queryset = UserGameRelation.objects.all()
    serializer_class = UserHaveSuggestGameSerializer
    permission_classes = [IsCustomUser]  # 認証が必要

    def get_queryset(self):
        """
        参加者が持っているゲームで、かつカフェにはないゲームを取得し、  
        ゲームクラス（軽量級、中量級、重量級）ごとに分類し、  
        want_to_play=Trueのユーザー数で降順にソートして返す。
        """
        # URLパラメータから予約IDとゲームクラスのパラメータを取得
        reservation_id = self.kwargs['id']
        player_class = self.kwargs.get('class_param')

        # デフォルトでは空のクエリセットを返す
        queryset = UserGameRelation.objects.none()

        # ゲームクラスのマッピング（軽量級、中量級、重量級）
        game_class_mapping = {
            'light': '軽量級',
            'medium': '中量級',
            'heavy': '重量級',
        }

        try:
            # 予約IDからカフェIDを特定
            reservation = Reservation.objects.get(id=reservation_id)
            cafe_id = reservation.cafe.id

            # 予約に参加しているユーザーを取得
            participants = reservation.participant.all()

            # 参加者が持っているゲーム（is_having=True）のIDを取得
            participant_owned_game_ids = UserGameRelation.objects.filter(
                user__in=participants, is_having=True
            ).values_list('game__id', flat=True).distinct()

            # カフェにあるゲームのIDを取得
            cafe_game_ids = CafeGameRelation.objects.filter(
                cafe_id=cafe_id
            ).values_list('game__id', flat=True)

            # 参加者が持っていて、カフェにはないゲームのIDを取得
            not_in_cafe_game_ids = [
                game_id for game_id in participant_owned_game_ids 
                if game_id not in cafe_game_ids
            ]

            # このゲームIDに関連するUserGameRelationを取得
            # (参加者に限定しない一意のゲームレコードを取得するため)
            unique_game_relations = UserGameRelation.objects.filter(
                game__id__in=not_in_cafe_game_ids
            ).distinct('game__id')  # PostgreSQLの場合

            # ゲームクラスのフィルタリング
            filtered_relations = []
            if player_class in game_class_mapping:
                # ゲームクラスが指定されている場合、そのクラスにマッチするゲームだけをフィルタリング
                mapped_class_name = game_class_mapping[player_class]
                for relation in unique_game_relations:
                    if relation.game.game_class.name == mapped_class_name:
                        filtered_relations.append(relation)
            else:
                # ゲームクラスが指定されていない場合は全てのゲームを取得
                filtered_relations = list(unique_game_relations)

            # ゲームごとにwant_to_play=Trueのユーザー数をカウント
            result = []
            for relation in filtered_relations:
                game = relation.game

                # 参加者の中でwant_to_play=Trueのユーザーをカウント
                want_to_play_count = UserGameRelation.objects.filter(
                    user__in=participants,
                    game=game,
                    want_to_play=True
                ).count()

                # 使用するデータ構造に合わせてゲームの詳細を返す
                result.append({
                    'game': BoardGameSerializer(game).data,
                    'want_to_play_count': want_to_play_count
                })

            # want_to_play_countの降順でソート
            result.sort(key=lambda x: x['want_to_play_count'], reverse=True)

            return result

        except Reservation.DoesNotExist:
            # 予約IDに該当する予約が存在しない場合は空のクエリセットを返す
            return queryset



from rest_framework import viewsets
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import SuggestGame, Reservation
from .serializers import SuggestGameSerializer
from django.core.exceptions import ObjectDoesNotExist

class SuggestGameViewSet(viewsets.ModelViewSet):
    queryset = SuggestGame.objects.all()
    serializer_class = SuggestGameSerializer

    @action(detail=False, methods=['post'])
    def create_suggest_game(self, request):
        """
        POSTリクエストで予約IDとゲームIDを元にSuggestGameを作成
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # シリアライザのcreateメソッドを使用して作成
        suggest_game = serializer.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)









































































def otamesi(request):
    return HttpResponse('お試し')

def register_boardgame(request):
    if request.method == 'POST':
        form = CafeGameRelationForm(request.POST)
        if  form.is_valid():
            game = form.save(commit=False)
            user = request.user
            staff = CafeStaff.objects.get(username=user.username)
            game.cafe = staff.cafe
            game.save()
            return redirect('match:frontpage')  # 成功時のリダイレクト
        else:
            return HttpResponse(form.errors)
    else:
        user = request.user
        staff = CafeStaff.objects.get(username=user.username)
        games = BoardGame.objects.filter(cafe_relations__cafe=staff.cafe)
        form = CafeGameRelationForm(instance=staff.cafe)
    return render(request, 'cafes/register_boardgame.html', {'form': form,'games':games,'staff':staff})

def staff_can_instruct(request):
    if request.method == 'POST':
        form = StaffGameRelationForm(request.POST)
        if  form.is_valid():
            game = form.save(commit=False)
            user = request.user
            staff = CafeStaff.objects.get(username=user.username)
            game.staff = staff
            game.can_instruct = True
            game.save()
            return redirect('match:frontpage')  # 成功時のリダイレクト
        else:
            return HttpResponse(form.errors)
    else:
        user = request.user
        staff = CafeStaff.objects.get(username=user.username)
        game_list = BoardGame.objects.filter(staff_relations__staff = staff)
        form = StaffGameRelationForm(instance=staff)
    return render(request, 'cafes/staff_can_instruct.html', {'form': form,'game_list':game_list})

def show_cafe_schedule(request):
    user = request.user
    staff = CafeStaff.objects.get(username=user.username)
    matchdays = MatchDay.objects.filter(cafe=staff.cafe)

    return render(request,'cafes/show_cafe_schedule.html',{'matchdays':matchdays})