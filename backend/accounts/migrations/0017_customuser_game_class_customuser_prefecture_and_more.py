# Generated by Django 5.1.3 on 2025-02-21 10:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0016_rename_gamecategory_gameclass_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='game_class',
            field=models.ManyToManyField(blank=True, related_name='customusers', to='accounts.gameclass'),
        ),
        migrations.AddField(
            model_name='customuser',
            name='prefecture',
            field=models.ManyToManyField(blank=True, related_name='customusers', to='accounts.prefecture'),
        ),
        migrations.AddField(
            model_name='customuser',
            name='profile_picture',
            field=models.ImageField(blank=True, null=True, upload_to='profile_pics/', verbose_name='プロフィール画像'),
        ),
    ]
