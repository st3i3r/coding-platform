# Generated by Django 2.2.4 on 2022-02-08 09:40

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0034_auto_20220208_1533'),
    ]

    operations = [
        migrations.AlterField(
            model_name='submission',
            name='question',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='submissions', to='backend.Question'),
        ),
        migrations.AlterField(
            model_name='submission',
            name='status',
            field=models.IntegerField(blank=True, choices=[(1, 'Wrong Answer'), (2, 'Compilation Error'), (0, 'Accepted')], default=None, null=True),
        ),
    ]
