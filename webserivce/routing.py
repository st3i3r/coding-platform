from rest_framework import routers
from backend.viewsets.challenges import QuestionViewSet
from backend.viewsets.compiles import CompileViewSet
from backend.viewsets.modules import ModuleViewSet
from backend.viewsets.skillsets import SkillSetViewSet
from backend.viewsets.submissions import SubmissionViewSet
from backend.viewsets.testcases import TestCaseViewSet
from backend.viewsets.testresult import TestResultViewSet


# application = ProtocolTypeRouter({
#     # WebSocket chat handler
#     "websocket": TokenAuthMiddlewareStack(
#         URLRouter([
#             re_path(r"tasks/", AIConsumer),
#         ])
#     )
# })

# REST API router
router = routers.DefaultRouter()
router.register(r'challenges', QuestionViewSet)
router.register(r'skillsets', SkillSetViewSet)
router.register(r'compiles', CompileViewSet)
router.register(r'submissions', SubmissionViewSet)
router.register(r'test-cases', TestCaseViewSet)
router.register(r'test-result', TestResultViewSet)
router.register(r'modules', ModuleViewSet)
