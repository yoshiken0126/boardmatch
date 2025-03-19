from django.utils import timezone
from datetime import datetime
from accounts.models import BoardGameCafe,CustomUser,BoardGame,GameClass
from cafes.models import TableTimeSlot,CafeTable,Reservation,ReservationTimeSlot,Participant,Message
from match.models import UserCafeRelation, UserRelation
from match.views import get_user_free_time,get_available_table_counts_for_4_weeks,generate_time_slots_for_4_weeks,get_available_table_ids_for_4_weeks,create_all_cafes_six_weeks_later_timeslots
import random
import numpy as np
from mip import Model,maximize,xsum

# カテゴリのリスト



def run_optimization():
    game_classes = ['軽量級', '中量級', '重量級']
    random.shuffle(game_classes)
    
    for game_class in game_classes:
        

        cafes = BoardGameCafe.objects.all()
        active_users = CustomUser.objects.filter(is_optimize_active=True,game_class__name=game_class)
        if not active_users:
            continue  # 次のループに進む
        
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



        #ここからnext.js表示用
        
        for cafe in range(len(user_group_in_cafe)):
            for group in user_group_in_cafe[cafe]:
                available_table_list = get_available_table_ids_for_4_weeks(cafe_id_dict[result_user_cafe_dict[group[0]]])
                print(f'これはavailable_table_listです{available_table_list}')
                print(f'これはresult_user_day_dict[group[0]]です{result_user_day_dict[group[0]]}')
                

                cafe = BoardGameCafe.objects.get(id=cafe_id_dict[result_user_cafe_dict[group[0]]])
                table = CafeTable.objects.get(id=available_table_list[result_user_day_dict[group[0]]][0])
                game_class_instance = GameClass.objects.get(name=game_class)
                reservation = Reservation.objects.create(cafe=cafe,reservation_type='match',game_class=game_class_instance)
                timeslots = TableTimeSlot.objects.filter(table=table,timeslot_range__overlap=(start_times[result_user_day_dict[group[0]]], end_times[result_user_day_dict[group[0]]]))
                timeslots.update(is_reserved=True)
                for timeslot in timeslots:
                    reservation_timeslot = ReservationTimeSlot.objects.create(reservation=reservation,timeslot=timeslot)
                for user_index in group:
                    user = CustomUser.objects.get(username=userdict[user_index])
                    user.is_optimize_active = False
                    user.save()
                    participant = Participant.objects.create(reservation=reservation,user=user)

                reservation_time = reservation.get_reservation_time_string()
                participant_names = list(reservation.participant.values_list('username', flat=True))
                message = Message.objects.create(reservation=reservation,is_public=False,is_system_message=True,content=
                f'マッチングに成功しました。\n\n場所:{cafe.name}\n日時:{reservation_time}\nクラス:{game_class}\n参加者:{participant_names}\n\n遊ぶゲームを決定してください。')


                
                


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

        #ここまでnext.js表示用
        val = ff_true.astype(float, subok=False).round()
        game_x = gf_true.astype(float, subok=False).round()
        val_x = x.astype(float, subok=False).round()
        outcome = m.objective_value

        print(val_x)
    
    create_all_cafes_six_weeks_later_timeslots()
    
    users_update_false = CustomUser.objects.filter(is_optimize_active=True)
    users_update_false.update(is_optimize_active=False)


                



        
    return None
