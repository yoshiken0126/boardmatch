from django.shortcuts import render,redirect
from accounts.models import CustomUser, BoardGameCafe, CafeStaff, BoardGame
from match.models import UserCafeRelation, UserFreeTime, MatchDay, MatchDayUser,UserRelation
from cafes.forms import CafeGameRelationForm,CafeGameRelation,StaffGameRelation,StaffGameRelationForm
from django.http import HttpResponse
# Create your views here.
from mip import Model,maximize,xsum
import numpy as np
import datetime,random
from .models import CafeTable
from .serializers import CafeTableSerializer
from accounts.permissions import IsStaffUser
from rest_framework import viewsets



class CafeTableViewSet(viewsets.ModelViewSet):
    serializer_class = CafeTableSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        user = self.request.user
        staff = CafeStaff.objects.get(username=user.username)

        # ユーザーが CafeStaff モデルのインスタンスかどうかを確認
        if isinstance(staff, CafeStaff):  # ユーザーが CafeStaff の場合
            cafe = staff.cafe  # カフェ情報を取得
            return CafeTable.objects.filter(cafe=cafe)  # カフェに関連するテーブルのみ返す

        # ユーザーがスタッフでない場合、空のクエリセットを返す
        return CafeTable.objects.none()
























































































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