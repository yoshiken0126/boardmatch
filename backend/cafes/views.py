from django.shortcuts import render,redirect
from accounts.models import CustomUser, BoardGameCafe, CafeStaff, BoardGame
from match.models import UserCafeRelation, UserFreeTime, MatchDay, MatchDayUser,UserRelation
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
from cafes.models import Reservation,SuggestGameParticipant,SuggestGameInstructor
from .serializers import ReservationSerializer,SuggestGameParticipantSerializer,SuggestGameInstructorSerializer

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
    permission_classes = [IsCustomUser]  # 特定のユーザー認証を要求
    
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