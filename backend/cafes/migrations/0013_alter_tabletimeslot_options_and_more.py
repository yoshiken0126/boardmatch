# Generated by Django 5.1.3 on 2024-12-12 11:15

import django.contrib.postgres.fields.ranges
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('cafes', '0012_rename_timeslot_tabletimeslot'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='tabletimeslot',
            options={'ordering': ['timeslot_range']},
        ),
        migrations.RemoveField(
            model_name='tabletimeslot',
            name='end_time',
        ),
        migrations.RemoveField(
            model_name='tabletimeslot',
            name='start_time',
        ),
        migrations.AddField(
            model_name='tabletimeslot',
            name='timeslot_range',
            field=django.contrib.postgres.fields.ranges.DateTimeRangeField(null=True),
        ),
    ]
