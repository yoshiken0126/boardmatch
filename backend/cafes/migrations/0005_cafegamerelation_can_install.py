# Generated by Django 4.2.16 on 2024-10-19 10:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cafes', '0004_alter_staffgamerelation_unique_together'),
    ]

    operations = [
        migrations.AddField(
            model_name='cafegamerelation',
            name='can_install',
            field=models.BooleanField(default=False),
        ),
    ]
