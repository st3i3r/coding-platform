# Generated by Django 2.2.4 on 2022-02-08 08:02

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0031_compile_question'),
    ]

    operations = [
        migrations.CreateModel(
            name='Submission',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('status', models.IntegerField(choices=[(0, 'Wrong Answer'), (1, 'Compilation Error'), (2, 'Accepted')], default=None, verbose_name='Status')),
                ('score', models.FloatField(blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='TestResult',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('output', models.CharField(blank=True, max_length=255)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('passed', models.BooleanField(default=None)),
                ('submission', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='test_results', to='backend.Submission')),
                ('testcase', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='backend.TestCase')),
            ],
        ),
        migrations.RemoveField(
            model_name='live',
            name='match',
        ),
        migrations.RemoveField(
            model_name='match',
            name='User',
        ),
        migrations.RemoveField(
            model_name='match',
            name='bot',
        ),
        migrations.RemoveField(
            model_name='match',
            name='group',
        ),
        migrations.RemoveField(
            model_name='match',
            name='round',
        ),
        migrations.RemoveField(
            model_name='predict',
            name='user',
        ),
        migrations.RemoveField(
            model_name='predict',
            name='winner',
        ),
        migrations.RemoveField(
            model_name='rank',
            name='bot',
        ),
        migrations.RemoveField(
            model_name='rank',
            name='match',
        ),
        migrations.RemoveField(
            model_name='rival',
            name='bot',
        ),
        migrations.RemoveField(
            model_name='rival',
            name='match',
        ),
        migrations.RemoveField(
            model_name='winrate',
            name='botID',
        ),
        migrations.AddField(
            model_name='compile',
            name='exit_status',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='compile',
            name='log',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.DeleteModel(
            name='Bot',
        ),
        migrations.DeleteModel(
            name='Live',
        ),
        migrations.DeleteModel(
            name='Match',
        ),
        migrations.DeleteModel(
            name='Predict',
        ),
        migrations.DeleteModel(
            name='Rank',
        ),
        migrations.DeleteModel(
            name='Rival',
        ),
        migrations.AddField(
            model_name='submission',
            name='compile_log',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='backend.Compile'),
        ),
        migrations.AddField(
            model_name='submission',
            name='question',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='backend.Question'),
        ),
    ]
