# Generated by Django 5.1.3 on 2025-02-18 11:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0009_designer_gamecategory_gamemechanic_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='boardgame',
            name='max_players',
            field=models.IntegerField(default=4, help_text='最大人数'),
        ),
        migrations.AlterField(
            model_name='boardgame',
            name='min_players',
            field=models.IntegerField(default=2, help_text='最小人数'),
        ),
    ]
