from rest_framework import serializers
from backend.models import TestResult
from backend.serializers.testcases import TestCaseSerializer


class TestResultSerializer(serializers.ModelSerializer):
    testcase = TestCaseSerializer(many=False, read_only=True)
    output = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = TestResult
        fields = '__all__'

    @staticmethod
    def get_output(obj):
        return "Hidden" if obj.testcase.hidden else obj.output

    @staticmethod
    def get_status(obj):
        return "Success" if obj.passed else "Compilation Error"



