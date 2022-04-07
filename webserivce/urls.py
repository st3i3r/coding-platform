"""webserivce URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from backend.views import *
from filebrowser.sites import site
from rest_framework_simplejwt import views as jwt_views

from webserivce.routing import router as api_router

app_name = 'backend'

urlpatterns = [
	path('api/', include(api_router.urls)),
    path('token/', jwt_views.TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', jwt_views.TokenRefreshView.as_view(), name='token_refresh'),
	path('admin/tinymce/', include('tinymce.urls')),
	path('admin/filebrowser/', site.urls),
	path('admin/', admin.site.urls),
	path('home', home, name="Home"),
	path('profile', profile, name="Profile"),
	path('challenge/', challenge, name="challenge"),
	path('challenge/<slug:slug>/', challenge, name="challenge-get"),
	path('addbottomatch', addbottomatch, name="Add Bot to Match"),
	path('savebot', savebot, name="Play AI"),
	path('activebot/<int:id>', activebot, name="Active Bot"),
	path('replay/<str:user>/<str:id>', replaymatch, name="Replay Match"),
	path('viewlog/<str:id>', logsmatch, name="Logs Match"),
	path('custommatches', custom_matchlist, name="Custom Match Of User"),
	path('dashboard', dashboard, name="dashboard"),
	path('skillset/<int:id>/', skillset, name="List of questions of a skillset"),
    path('modules/<int:id>/', module, name="module-detail"),
	path('submission/<str:uid>/', submission, name="submission-detail"),
	path('matches/<str:botname>', matchlist, name="Search bot in list Match Of User"),
	path('login', login_request, name="Login"),
	path('logout', logout_request, name="Logout"),
	path('register', register, name="Register"),
	path('verify/<str:uidb64>/<str:token>', verifyemail, name='Verify Email'),
	path('forgotpassword', forgotpassword, name="Forgotpassword"),
	path('passwordresetconfirm/<str:uidb64>/<str:token>', passwordresetconfirm, name='Passwordresetconfirm'),
	path('docs/', learn_view, name="Play AI"),
	path('docs/article/<int:id>/<str:human>', article, name="Article"),	
	path('live', live, name="Live"),
	path('live/gettime', live_time, name="Get Realtime Video"),
	path('feedback', feedback, name="Feedback"),
	path('topten', topten, name="Topten"),
	path('', index, name="Home"),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

