# Generated by Django 2.2.4 on 2022-02-16 10:14

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0055_auto_20220216_1714'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='compile',
            name='id',
        ),
        migrations.AlterField(
            model_name='compile',
            name='uid',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
    ]
