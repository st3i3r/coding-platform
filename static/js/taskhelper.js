

{
    //Init Toastr
    toastr.options = {
        "positionClass": "toast-bottom-right",
        "closeButton": false,
        "debug": false,
        "newestOnTop": true,
        "progressBar": true,
        "preventDuplicates": false,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };

	function setCookie(name, value, days) {
		var expires = "";
		if (days) {
			var date = new Date();
			date.setTime(date.getTime() + (days*24*60*60*1000));
			expires = "; expires=" + date.toUTCString();
		}
		document.cookie = name + "=" + (value || "")  + expires + "; path=/";
	}

	function getCookie(name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') c = c.substring(1, c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
		}
		return null;
	}

	function eraseCookie(name) {   
		document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
	}
	
	function parseCookie(token) {
		var base64Url = token.split('.')[1];
		var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));

		return JSON.parse(jsonPayload);
	};
	
	function isTokenExpired(token) {
		var jsonToken = parseCookie(token);
		if ( jsonToken.exp < Date.now() / 1000) return true;
		
		return false
	}
	
	function getAccessToken() {
		var accessToken = getCookie('access');
		// Check if access token is expired
		if (accessToken === null || isTokenExpired(accessToken) === true) {
			// Get new access token using refresh token, if there is no refresh token, re-login is required
			var refreshToken = getCookie('refresh');
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
					headers: {"Authorization": getCookie('access')},
					success: function (data) {
						setCookie('access', data.access);
					}
				});
			};
		accessToken = getCookie('access');
		}
		
		return accessToken
	}
    
	// When we're using HTTPS, use WSS too.
	// TODO: update
	var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";

	var accessToken = getAccessToken();

	var ws_path = ws_scheme + '://127.0.0.1:8888/tasks/' + `?token=${accessToken}`;
	var socket = new ReconnectingWebSocket(ws_path, null, {reconnectInterval: 3000, timeoutInterval: 5000, maxReconnectAttempts: 10});

	socket.onmessage = function (message) {
		var data = JSON.parse(message.data);
		
		if (data.type_msg === "console") {
			var result = JSON.parse(data.data);
			if (result.compile_status === 'failed') {
				consoleLogDisplay(result);
			}
        }

        if (data.type_msg == "toast" && data.message && data.status) {
            if (data.status == 'error') {
                toastr.error(data.message);
            } else if (data.status == 'success') {
                toastr.success(data.message);
            } else if (data.status == 'info') {
                toastr.info(data.message);
            }
        };
        
        if (data.type_msg === "test-summary") {
			var result = JSON.parse(data.data);
			testSummaryDisplay(result);
		} else if (data.type_msg === "testcase-detail") {
			testcaseDetailDisplay(JSON.parse(data.data));
		}
		
		if (data.type_msg === "submission-summary") {
			var submissionData = JSON.parse(data.data);
			submissionSummaryHandler(submissionData);
		} else if (data.type_msg === "submission-detail") {
		    var submission = JSON.parse(data.data);
		    submissionDetailHandler(submission);
		}
	};
    
	socket.onclose = function (e) {
		toastr.options = {
			"positionClass": "toast-bottom-right"
		};
	};
	
	function getActionHandler(action) {
		var actionMap = {
			"solve-challenge": solveChallengeHandle,
			"submit": submitHandle,
			"get-testcase-detail": getTestcaseDetail,
			"get-submissions": getSubmissions,
			"get-submission-detail": getSubmissionDetail
		}
		
		return actionMap[action];
	}

	function btnClick(e) {
		var command = e.getAttribute("action");
		var handler = getActionHandler(command);
		handler(e);
	}
	
	function solveChallengeHandle(e) {
		var message;
		var questionSlug = e.dataset.questionSlug;
		var submissionId = e.dataset.submissionId;

        var url;
        var tab;
		if (submissionId !== undefined) {
            url = `#challenge/${questionSlug}?submission_id=${submissionId}`;
            tab = 'tabcodeeditor';
            setUpUrl(url, 'tabcodeeditor');
		} else {
            url = `#challenge/${questionSlug}`;
            setUpUrl(url);
		}
	}
		
	function submitHandle(e) {
		$('#iframeResult').html(processingAnimation("Processing"));
		$('#test-card-detail').remove();

		var questionSlug = e.dataset.questionSlug;
		var message = {
			action: 'submit',
			data: {
				'editor': editor.getValue(),
				'language': $('#language').val(),
				'question_slug': questionSlug,
			},
		};

		// setUpUrl('#challenge','tabgameview')
		toastr.info("Send to Server");
		socket.send(JSON.stringify(message));
	}

	function getSubmissions(e) {
	    $('#submission').html(processingAnimation('Fetching submission data ...'));
		var questionSlug = e.dataset.questionSlug;
		var message = {
			action: 'get-submissions',
			data: {
				'question_slug': questionSlug,
			},
		};
		socket.send(JSON.stringify(message));
	}

	function getTestcaseDetail(e) {
		// Check clicked element
		if (e.tagName !== "B") return;

        var message;
        var command = e.getAttribute("action");
        var submissionId = e.dataset.submissionId;
		var tcNo = e.parentElement.getAttribute("id").split("_")[1];

		message = {
			action: command,
			data: {
				'action': command,
				'testcase_no': tcNo,
				'submission_id': submissionId
			}
		};

		socket.send(JSON.stringify(message));

		const tcDetailHeader = $('#testcase-detail-header');
		tcDetailHeader.css('fontWeight', 'bold');
		tcDetailHeader.html(`Test case ${tcNo}`);

		const tcDetailBody = $('#testcase-detail-body');
		tcDetailBody.html(processingAnimation(""));
	}

	function getSubmissionDetail(e) {
	    var submissionId = e.dataset.submissionId;
	    var message = {
	        action: 'get-submission-detail',
	        data: {
	            'submission_id': submissionId
	        }
	    }
	    socket.send(JSON.stringify(message));
	}

	function submissionSummaryHandler(submissions) {
        $('#submission').html('').append(submissionTableElement());
	    var tableElement = $('#submission-table-body');
        $('#submission').pagination({
            dataSource: submissions,
            pageSize: 8,
            showPageNumbers: true,
            showNavigator: true,
            callback: function(submissions, pagination) {
                tableElement.html('');



                submissions.forEach(function(submission) {
                    var trElement = $('<tr></tr>');
                    var statusElement = $('<td></td>').html(_submissionStatusHTML(submission.status));
                    var scoreElement = $('<td></td>').text(submission.score);
                    var langElement = $('<td></td>').text(submission.language);
                    var timeElement = $('<td></td>').text(submission.created_at);

                    var urlElement = $('<td></td>');
                    var aElement = $('<button></button>').addClass('btn btn-lge btn-sm').attr('action', 'get-submission-detail').attr('data-submission-id', submission.id).text('View Result');
                    aElement.on('click', function(e) {btnClick(e.target)});
                    urlElement.append(aElement);

                    trElement.append(statusElement);
                    trElement.append(scoreElement);
                    trElement.append(langElement);
                    trElement.append(timeElement);
                    trElement.append(urlElement);

                    tableElement.append(trElement);
                })
            }
        })
	}

	function submissionDetailHandler(data) {
	    const rowElement = $('<div></div>').addClass('row');
	    const colElement = $('<div></div>').addClass('col-md-12');

	    const div1Element = $('<div></div>').addClass('d-flex flex-column justify-content-begin mb-3').append(
	                           $('<div></div>').text("You made this submission 2 days ago")
                            ).append(
                               $('<div></div>').html(`<span class='mr-5'><b>Score: </b>${data.score}</span><span><b>Status: </b>${_submissionStatusHTML(data.status)}</span>`)
                            )

        const submittedCodeElement = $('<div></div>').addClass('').append(
                                        $('<div></div>').addClass('font-weight-bold h6 mb-2').text('Submitted Code')
                                    ).append(
                                        _submittedCodeHeaderElement(data.language, data.question_slug, data.id)
                                    ).append(
                                        $('<div></div>').addClass('card').attr('id', 'submitted-code')
                                    )

	    colElement.append(div1Element);
	    colElement.append(submittedCodeElement);
	    rowElement.append(colElement);

        $('#submission').html(rowElement);

        var submittedCode = ace.edit('submitted-code');
        if (data.language === 'cpp') {
            submittedCode.getSession().setMode('ace/mode/c_cpp');
        } else if (data.language === 'java') {
            submittedCode.getSession().setMode('ace/mode/java');
        }
        submittedCode.setReadOnly(true);
        submittedCode.setValue(data.code, -1);

        var height = $(window).height() / 1.7;
        $('#submitted-code').css('minHeight', `${height}px`);

        // Show result summary and remove testcase detail
        testSummaryDisplay(data.test_results);
        $('#test-card-detail').remove();
	}

	function processingAnimation(msg) {
		return `<svg width=\"20px\" height=\"20px\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" preserveAspectRatio=\"xMidYMid\" class=\"loader-svg-icon\"><rect x=\"0\" y=\"0\" width=\"100\" height=\"100\" fill=\"none\" class=\"bk\"></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(0 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(30 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.08333333333333333s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(60 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.16666666666666666s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(90 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.25s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(120 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.3333333333333333s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(150 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.4166666666666667s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(180 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.5s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(210 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.5833333333333334s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(240 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.6666666666666666s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(270 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.75s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(300 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.8333333333333334s\" repeatCount=\"indefinite\"></animate></rect><rect x=\"46.5\" class=\"loader-piece\" y=\"40\" width=\"7\" height=\"20\" rx=\"5\" ry=\"5\" fill=\"#666666\" transform=\"rotate(330 50 50) translate(0 -30)\"><animate attributeName=\"opacity\" from=\"1\" to=\"0\" dur=\"1s\" begin=\"0.9166666666666666s\" repeatCount=\"indefinite\"></animate></rect></svg><span class=\"ui-icon-label tab-item-label\"> ${msg}</span>`;
	}
	
	function consoleLogDisplay(result) {
		var iframeResult = $('#iframeResult');
		iframeResult.html('');


		if (result.compile_status === 'failed') {
			var compMsg = $('<div></div>').addClass('mb-3').css('color', failedColor()).css('fontWeight', 'bold').text("Compilation Error");
		} else {
			var compMsg = $('<div></div>').text("Successfully Compiled");
		};
		
		var console = $('<div></div>').addClass('card-body').css('background', '#f0f3f5');
		console.html('<p>' + result.message.replace(/(?:\r\n|\r|\n)/g, '<br />') + "</p>");
		
		var consoleCard = $('<div></div>').addClass('card');
		consoleCard.append(console);
		
		iframeResult.append(compMsg);
		iframeResult.append(consoleCard);
	}
	
	function testcaseDetailDisplay(tcResult) {



        const tcDetailHeader = $('<div></div>').addClass('card-header font-weight-bold').attr('id', 'testcase-detail-header')
                                                .css('color', tcResult.passed === true ? passedColor() : failedColor())
                                                .text(`Test case ${tcResult.tc_id}`);
		const compMsgElement = document.createElement('p');
		compMsgElement.className = 'card-title';
		compMsgElement.innerHTML = 'Compiler Message';
		const compMsgValueElement = document.createElement('p');
		compMsgValueElement.className = 'list-group-item mb-4';
		compMsgValueElement.style.fontWeight = 'bold';
		compMsgValueElement.innerHTML = tcResult.passed ? "Success" : "Wrong Answer";
		
		const tcInputElement = document.createElement('p');
		tcInputElement.className = 'card-title';
		tcInputElement.innerHTML = 'Input (stdin)';
		const tcInputValueElement = document.createElement('p');
		tcInputValueElement.className = 'list-group-item mb-4';	
		tcInputValueElement.style.fontWeight = 'bold';
		tcInputValueElement.innerHTML = tcResult.input || "Hidden";
		
		const tcOutputElement = document.createElement('p');
		tcOutputElement.className = 'card-title';
		tcOutputElement.innerHTML = 'Your Output (stdout)';
		const tcOutputValueElement = document.createElement('p');
		tcOutputValueElement.className = 'list-group-item mb-4';	
		tcOutputValueElement.style.fontWeight = 'bold';
		tcOutputValueElement.innerHTML = tcResult.output === null ? 'Hidden' : tcResult.output === '' ? '<i>No Output</i>' : tcResult.output;
		
		const tcExpOutputElement = document.createElement('p');
		tcExpOutputElement.className = 'card-title';
		tcExpOutputElement.innerHTML = 'Expected Output';
		const tcExpOutputValueElement = document.createElement('p');
		tcExpOutputValueElement.className = 'list-group-item mb-4';	
		tcExpOutputValueElement.style.fontWeight = 'bold';
		tcExpOutputValueElement.innerHTML = tcResult.expected_output || "Hidden";


		const tcDetailBody = $('<div></div>').addClass('card-body').attr('id', 'testcase-detail-body');
		tcDetailBody.append(compMsgElement);
		tcDetailBody.append(compMsgValueElement);
		tcDetailBody.append(tcInputElement);
		tcDetailBody.append(tcInputValueElement);
		tcDetailBody.append(tcOutputElement);
		tcDetailBody.append(tcOutputValueElement);
		tcDetailBody.append(tcExpOutputElement);
		tcDetailBody.append(tcExpOutputValueElement);

        $('#test-card-detail').remove();
	    $('#iframeResult').after(
	        $('<div></div>').addClass('card-header').attr('id', 'test-card-detail')
	                        .append(tcDetailHeader)
	                        .append(tcDetailBody)
        )
	}

	function passedIconHTML() {
		return ` <svg viewBox="0 0 24 24" width="1em" height="1em" role="img" aria-label="Passed" class="ui-svg-icon" fill=${passedColor()}><path d="M12 23C5.9 23 1 18.1 1 12c0-3 1.1-5.7 3.2-7.8C6.3 2.1 9.1 1 12 1c1.6 0 3.1.3 4.5 1 .5.2.7.8.5 1.3-.2.5-.8.7-1.3.5-1.2-.5-2.4-.8-3.7-.8-5 0-9 4-9 9s4 9 9 9 9-4 9-9v-.9c0-.6.4-1 1-1s1 .4 1 1v.9c0 6.1-4.9 11-11 11z"></path><path d="M12 15c-.3 0-.5-.1-.7-.3l-3-3c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0l2.3 2.3L22.3 2.3c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-11 11c-.2.2-.4.3-.7.3z"></path></svg>`;
	}
	
	function failedIconHTML() {
		return ` <svg viewBox="0 0 100 100" width="1em" height="1em" role="img" aria-label="Failed" class="ui-svg-icon" fill=${failedColor()}><path d="M88.184 81.468a3.008 3.008 0 0 1 0 4.242l-2.475 2.475a3.008 3.008 0 0 1-4.242 0l-69.65-69.65a3.008 3.008 0 0 1 0-4.242l2.476-2.476a3.008 3.008 0 0 1 4.242 0l69.649 69.651z"></path><path d="M18.532 88.184a3.01 3.01 0 0 1-4.242 0l-2.475-2.475a3.008 3.008 0 0 1 0-4.242l69.65-69.651a3.008 3.008 0 0 1 4.242 0l2.476 2.476a3.01 3.01 0 0 1 0 4.242l-69.651 69.65z"></path></svg>`;
	}
	
	function lockedIconHTML() {
		return ` <svg viewBox="0 0 24 24" width="1em" height="1em" role="img" class=" ui-svg-icon" fill="currentColor"><path d="M19 10h-1V7c0-3.3-2.7-6-6-6S6 3.7 6 7v3H5c-1.7 0-3 1.3-3 3v7c0 1.7 1.3 3 3 3h14c1.7 0 3-1.3 3-3v-7c0-1.7-1.3-3-3-3zM8 7c0-2.2 1.8-4 4-4s4 1.8 4 4v3H8V7zm12 13c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1v-7c0-.6.4-1 1-1h14c.6 0 1 .4 1 1v7z"></path></svg>`
	}

	function testSummaryDisplay(testSummary) {
		var outputDiv = $('#iframeResult');
		outputDiv.html("");

		if (testSummary) {
            const rowElement = $('<div></div>').addClass('row');
			testSummary.forEach(function(test) {
					const colElement = $('<div></div>').addClass('col-4');
					const pElement = $('<p></p>').attr('id', `TC_${test.tc_id}`);

					const bElement = $('<b></b>').addClass('testcase-item').css('cursor', 'pointer');
					bElement.css('color', test.passed === true ? passedColor() : failedColor());
					bElement.attr('action', 'get-testcase-detail');
					bElement.attr('data-submission-id', test.submission_id);
					bElement.text(`Test case ${test.tc_id}`);

					var resultIconHTML;
					if (test.hidden === true) {
						resultIconHTML = lockedIconHTML();
					} else {
						resultIconHTML = test.passed === true ? passedIconHTML() : failedIconHTML();
					}

					pElement.append(bElement);
					pElement.append(resultIconHTML);

					colElement.append(pElement);
					rowElement.append(colElement);
					outputDiv.append(rowElement);

					bElement.on("click", function(e) {btnClick(e.target)});
			})

		}
    }

    function _submissionStatusHTML(status) {
        var statusMap = {
            "Accepted": "text-success",
            "Wrong Answer": "text-danger",
            "Compilation Error": "text-secondary"
        }
        return `<span class=${statusMap[status]}>${status}</span>`
    }

    function _submissionHeaderHTML() {
        return `
            <thead>
                <tr>
                    <th>RESULT</th>
                    <th>SCORE</th>
                    <th>LANGUAGE</th>
                    <th>TIME</th>
                    <th></th>
                </tr>
            </thead>
        `
    }

    function submissionTableElement() {
        const rowElement = $('<div></div>').addClass('row').append(
            $('<div></div>').addClass('col-md-12').append(
                $('<table></table>').addClass('table table-responsive-sm').html(_submissionHeaderHTML()).append(
                    $('<tbody></tbody>').attr('id', 'submission-table-body')
                )
            )
        )
        return rowElement
    }

    function _submittedCodeHeaderElement(language, questionSlug, submissionId) {
        const _header = $('<div></div>').addClass('card-header d-flex flex-row justify-content-between').append(
            $('<div></div>').addClass('').html(`<span><b>Language: </b>${language}</span>`)
        ).append(
            $('<div></div>').addClass('').append(
                $('<button></button>').addClass('btn btn-lge btn-sm')
                                      .attr('action', 'solve-challenge').attr('data-question-slug', questionSlug)
                                      .attr('data-submission-id', submissionId).on('click', function(e) {btnClick(e.target)}).text("Open in editor")
            )
        )

        return _header;
    }
}

