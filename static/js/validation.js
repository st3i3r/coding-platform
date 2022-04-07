$(function () {
    $.validator.setDefaults({
        submitHandler: function () {
            alert('submitted!');
        }
    });
    $('#formregister').validate({
        rules: {
            username: {
                required: true,
                minlength: 6
            },
            password: {
                required: true,
                minlength: 8
            },
            confirm_password: {
                required: true,
                minlength: 8,
                equalTo: '#password'
            },
            email: {
                required: true,
                email: true
            }
        },
        messages: {
            username: {
                required: 'Please enter a username',
                minlength: 'Your username must consist of at least 6 characters'
            },
            password: {
                required: 'Please provide a password',
                minlength: 'Your password must be at least 8 characters long'
            },
            confirm_password: {
                required: 'Please provide a password',
                minlength: 'Your password must be at least 8 characters long',
                equalTo: 'Please enter the same password as above'
            },
            email: {
                required: 'Please enter a valid email address',
            },
        },
        errorElement: 'em',
        errorPlacement: function (error, element) {
            // Add the `invalid-feedback` class to the error element
            error.addClass('invalid-feedback');
            if (element.prop('type') === 'checkbox') {
                error.insertAfter(element.parent('label'));
            } else {
                error.insertAfter(element);
            }
        },
        highlight: function (element, errorClass, validClass) {
            $(element).addClass('is-invalid').removeClass('is-valid');
        },
        unhighlight: function (element, errorClass, validClass) {
            $(element).addClass('is-valid').removeClass('is-invalid');
        }
    });
});