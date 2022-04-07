# Generated by Django 2.2.4 on 2022-02-16 03:05

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0045_auto_20220215_0953'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='compile',
            name='id',
        ),
        migrations.AlterField(
            model_name='testresult',
            name='submission',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='test_results', to='backend.Submission', to_field='id'),
        ),
    ]
