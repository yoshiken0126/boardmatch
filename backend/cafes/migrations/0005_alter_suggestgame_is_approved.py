# Generated by Django 5.1.3 on 2025-03-10 07:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cafes', '0004_suggestgame_is_approved'),
    ]

    operations = [
        migrations.AlterField(
            model_name='suggestgame',
            name='is_approved',
            field=models.BooleanField(default=None, null=True),
        ),
    ]
