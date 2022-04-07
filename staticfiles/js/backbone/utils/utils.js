app.utils.sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

app.utils.passedColor = '#1ba94c';
app.utils.failedColor = '#d11534';

app.utils.disposeView = function(view) {
   Backbone.View.prototype.close = function () {
      this.unbind();
      this.undelegateEvents();
   };

   /* --Destroy current view */
   if(this.currentView !== undefined) {
      this.currentView.close();
   }

   /* --Create new view */
   this.currentView = view;
   this.currentView.delegateEvents();

   return this.currentView;
}

app.utils.navigateHref = function(e) {
    var href = $(e.currentTarget).attr('href');
    app.router.navigate(href, { trigger: true, replace: true });
}

app.utils.setupURL = function(url, selector="#ui-view") {
    if (url === undefined) return;

    $('nav .nav li .nav-link').removeClass('active');
    $('nav .nav li.nav-dropdown').removeClass('open');
    $('nav .nav li:has(a[href="' + url.split('?')[0] + '"])').addClass('open');
    $('nav .nav a[href="' + url.split('?')[0] + '"]').addClass('active');
    url = url.replace('/#', '');
    url = url.replace('#', '');

    if (url && url.length > 4 && url.substr(0, 4) == 'form') {
        submitAjax = function (formInput) {
            var formData = new FormData(formInput[0]);
            $.ajax({
                url: formInput.attr('action'),
                type: "POST",
                headers: {"Authorization": app.utils.getCookie('access')},
                data: formData,
                cache: false,
                async: true,
                contentType: false,
                processData: false,
                success: function (msg) {
                    if (msg.type == 'error') {
                        $("#text-msg").html(msg.data);
                    } else if (msg.type == 'toast') {
                        if (msg.data !== null && msg.data !== undefined && msg.data !== '')  {
                            if (msg.status == 'error') {
                                toastr.error(msg.data);
                            } else if (msg.status == 'success') {
                                toastr.success(msg.data);
                            } else {
                                toastr.info(msg.data);
                            }
                        }
                    } else if (msg.type == 'reload') {
                        location.reload();
                    } else if (msg.type === 'login') {
						var tokens = JSON.parse(msg.tokens);
						app.utils.setCookie('refresh', tokens.refresh);
						app.utils.setCookie('access', tokens.access);
                        location.reload();
					}
                }
            });
        };
        return submitAjax($('#' + url));
    } else if (url) {
        var stateObj = {
            url: window.location.hash,
            innerhtml: document.getElementById("ui-view").innerHTML
        };
        window.history.pushState(stateObj, null, null);
        Pace.restart();
        $('html, body').animate({
            scrollTop: 0
        }, 0);

        return $.ajax({
            url: url,
            async: false,
            type: "GET",
            headers: {"Authorization": app.utils.getCookie('access')},
            success: function (msg) {
                if (msg.type == 'toast') {
                    if (msg.data !== '' && msg.data !== undefined && msg.data !== null) {
                        if (msg.status == 'error') {
                            toastr.error(msg.data);
                        } else if (msg.status == 'success') {
                            toastr.success(msg.data);
                        } else {
                            toastr.info(msg.data);
                        }
                    }
                } else if (msg.type == 'reload') {
                    window.location.href = "/"
                } else if (msg.type == 'logout') {
					eraseCookie('refresh');
					eraseCookie('access');
                    window.location.href = "/";
				} else {
                    // window.location.hash = url;
                    $(selector).html(msg);
                    $("body").addClass("footer-fixed");
                }
            }
        });
    }
}

app.utils.getCookie = function(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

app.utils.eraseCookie = function(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

app.utils.parseCookie = function(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

app.utils.isTokenExpired = function(token) {
    var jsonToken = parseCookie(token);
    if ( jsonToken.exp < Date.now() / 1000) return true;

    return false
}

app.utils.getAccessToken = function() {
    var accessToken = app.utils.getCookie('access');
    // Check if access token is expired
    if (accessToken === null || isTokenExpired(accessToken) === true) {
        // Get new access token using refresh token, if there is no refresh token, re-login is required
        var refreshToken = app.utils.getCookie('refresh');
        if (refreshToken === null) {
            // Redirect to login page
            toastr.error('Re-login required');
        } else {
            var data = {'refresh': refreshToken}
            $.ajax({
                url: 'token/refresh/',
                type: "POST",
                data: JSON.stringify(data),
                cache: false,
                async: false,
                contentType: 'application/json',
                processData: false,
                headers: {"Authorization": app.utils.getCookie('access')},
                success: function (data) {
                    app.utils.setCookie('access', data.access);
                }
            });
        };
    accessToken = app.utils.getCookie('access');
    }

    return accessToken
}
