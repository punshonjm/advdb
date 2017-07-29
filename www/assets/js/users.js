var page = {
    config: {
        currentlyOpen: null,
    },
    data: {
        searchResults: null,
    },
    form: {
        action: {
            saveEdit: function($this) {
                $this.prop('disable', true);
                $('.has-danger').removeClass('has-danger');
                $('.processingSpinner').show();

                var data = {
                    uid: page.config.currentlyOpen,
                    first_name: $('#edit_first_name').val(),
                    last_name: $('#edit_last_name').val(),
                    email:  $('#edit_email').val(),
                    dob: $('#edit_dob').val(),
                    gender: $('#edit_gender').val(),
                    ph_home: $('#edit_ph_home').val(),
                    ph_mobile: $('#edit_ph_mobile').val(),
                    ph_work: $('#edit_ph_work').val(),
                    addr_l1: $('#edit_addr_l1').val(),
                    addr_town: $('#edit_addr_town').val(),
                    addr_state: $('#edit_addr_state').val(),
                    addr_post: $('#edit_addr_post').val(),
                    defence: (!$('#edit_defence').is(':checked')) ? 'No' : $('#edit_defence_section').val(),
                }

                var required = ['first_name', 'last_name', 'dob', 'gender', 'defence'];
                var valid = required.filter(function(field) {
                    if (String.isNullOrEmpty(data[field])) {
                        $('#edit_'+field).parent('.form-group').addClass('has-danger');
                        return true;
                    } else {
                        return false;
                    }
                }).length;

                if (valid > 0) {
                    $this.prop('disable', false);
                    $('.processingSpinner').hide();
                    $.toaster({
                        priority: 'danger', title: 'Error', icon: 'fa fa-close',
                        message: 'Please ensure required fields are filled.',
                    });
                } else {
                    $.ajax('/api/users/update', {
                        type: 'POST',
                        dataType: 'JSON',
                        data: data,
                    }).always(function(xhr) {
                        if ('user_id' in xhr) {
                            $.toaster({
                                priority: 'success', title: 'success', icon: 'fa fa-save',
                                message: xhr.message,
                            });

                            let user = {};
                            var lKeys = Object.keys(data);
                            lKeys.map(function(lKey) {
                                if (lKey != 'uid') {
                                    let uKey = lKey.toUpperCase();
                                    user[uKey] = data[lKey];
                                }
                            });
                            user.USER_ID = xhr.user_id;

                            $('#tr.userRow[data-uid="'+page.config.currentlyOpen+'"]').remove();
                            var tr = page.parse.userRow(user);
                            $('#searchResults').append(tr);

                            if (page.config.currentlyOpen != xhr.user_id) {
                                delete page.data.searchResults[page.config.currentlyOpen];
                                page.config.currentlyOpen = xhr.user_id;
                            }
                            page.data.searchResults[xhr.user_id] = user;

                            var html = page.parse.userDetails(user);
                            $('#userDetails').html(html);
                        } else {
                            $this.prop('disabled', false);
                            $('.processingSpinner').hide();
                            var message = (xhr.responseJSON.message) ? xhr.responseJSON.message : 'A server error occured, please try again.';
                            $.toaster({
                                priority: 'danger', title: 'Error', icon: 'fa fa-close',
                                message: message,
                            });
                        }
                    });
                }
            },
            addUser: function($this) {
                $this.prop('disable', true);
                $('.has-danger').removeClass('has-danger');

                var data = {
                    first_name: $('#first_name').val(),
                    last_name: $('#last_name').val(),
                    email:  $('#email').val(),
                    dob: $('#dob').val(),
                    gender: $('#gender').val(),
                    ph_home: $('#ph_home').val(),
                    ph_mobile: $('#ph_mobile').val(),
                    ph_work: $('#ph_work').val(),
                    addr_l1: $('#addr_l1').val(),
                    addr_town: $('#addr_town').val(),
                    addr_state: $('#addr_state').val(),
                    addr_post: $('#addr_post').val(),
                    defence: (!$('#defence').is(':checked')) ? 'No' : $('#defence_section').val(),
                }

                var required = ['first_name', 'last_name', 'dob', 'gender', 'defence'];
                var valid = required.filter(function(field) {
                    if (String.isNullOrEmpty(data[field])) {
                        $('#'+field).parent('.form-group').addClass('has-danger');
                        return true;
                    } else {
                        return false;
                    }
                }).length;

                if (valid > 0) {
                    $this.prop('disable', false);
                    $.toaster({
                        priority: 'danger', title: 'Error', icon: 'fa fa-close',
                        message: 'Please ensure required fields are filled.',
                    });
                } else {
                    $.ajax('/api/users/new', {
                        type: 'POST',
                        dataType: 'JSON',
                        data: data,
                    }).always(function(xhr) {
                        if ('user_id' in xhr) {
                            $.toaster({
                                priority: 'success', title: 'Success', icon: 'fa fa-save',
                                message: xhr.message,
                            });

                            let user = {};
                            var lKeys = Object.keys(data);
                            lKeys.map(function(lKey) {
                                if (lKey != 'uid') {
                                    let uKey = lKey.toUpperCase();
                                    user[uKey] = data[lKey];
                                }
                            });
                            user.USER_ID = xhr.user_id;
                            page.data.searchResults[xhr.user_id] = user;

                            var html = page.parse.userDetails(user);

                            $('#usersTable').hide();
                            $('#userDetails').show();
                            $("#addUser").modal('hide');

                            var tr = page.parse.userRow(user);
                            $('#searchResults').append(tr);

                            $('#ph_home, #ph_mobile, #ph_work, #addr_l1, #addr_town, #addr_state, #addr_post, #defence_section, #dob, #email, #first_name, #last_name').val(null);
                            $('#defence').prop('checked', false);
                            $('#gender').val('').change();
                            // TODO: open current user from xhr.user_id & reset form
                        } else if (xhr.status == 409) {
                            $this.prop('disable', false);
                            $.toaster({
                                priority: 'danger', title: 'Error', icon: 'fa fa-close',
                                message: xhr.responseJSON.message,
                            });

                            let user = xhr.responseJSON.user;
                            user.ADDED_DATE = moment(user.ADDED_DATE, 'YYYY-MM-DD HH:mm:ss').format('dddd, MMMM Do YYYY, h:mm a');
                            var html = page.parse.singleUserDuplicate(user);
                            $('#formFeedback').html(html);
                            $('#form-body').hide();
                            $('#formFeedback').show();
                        } else {
                            $this.prop('disabled', false);
                            var message = (xhr.responseJSON.message) ? xhr.responseJSON.message : 'A server error occured, please try again.';
                            $.toaster({
                                priority: 'danger', title: 'Error', icon: 'fa fa-close',
                                message: message,
                            });
                        }
                    });
                }
            },
        },
    },
    action: {
        change: {
            Back: function($this) {
                var hide = $this.data('hide');
                if (!String.isNullOrEmpty(hide)) {
                    $(hide).hide();
                }
                var show = $this.data('show');
                if (!String.isNullOrEmpty(show)) {
                    $(show).show();
                }
            },
            Edit: function($this) {
                var user = page.data.searchResults[page.config.currentlyOpen];
                var html = page.parse.userEdit(user);
                $('#userDetails').html(html);
                page.setup.DatePickers();
            },
            CancelEdit: function() {
                var user = page.data.searchResults[page.config.currentlyOpen];
                var html = page.parse.userDetails(user);
                $('#userDetails').html(html);
            },
        },
        user: {
            Close: function() {
                $('#userDetails').hide();
                $('#usersTable').show();
                $('#userDetails').html('');
                page.config.currentlyOpen = null;
            },
            Open: function($this) {
                $parent = $this.closest('.userRow');
                var uid = $parent.data('uid');
                var user = page.data.searchResults[uid];

                page.config.currentlyOpen = uid;
                var html = page.parse.userDetails(user);
                $('#userDetails').html(html);

                $('#usersTable').hide();
                $('#userDetails').show();
            },
        },
        Search: function($this) {
            $('#searchOutput').html('')
            var data = {};
            $('.search').each(function() {
                var name = $(this).attr('name');
                if (!String.isNullOrEmpty($(this).val())) {
                    data[name] = $(this).val().trim();
                }
            });

            if (Object.keys(data).length > 0) {
                $this.prop('disabled', true);
                $('#searchResults').empty();
                page.data.searchResults = null;

                $.ajax('/api/users/search', {
                    type: 'GET',
                    dataType: 'JSON',
                    data: data,
                }).always(function(xhr) {
                    $this.prop('disabled', false);
                    if ('users' in xhr) {
                        page.data.searchResults = {};
                        xhr.users.map((user) => {
                            page.data.searchResults[user.USER_ID] = user;
                            var tr = page.parse.userRow(user);
                            $('#searchResults').append(tr);
                        });

                        if ($('#searchResults').is(':visible') != true) {
                            page.action.user.Close();
                        }
                    } else {
                        var message = (xhr.responseJSON.message) ? xhr.responseJSON.message : 'A server error occured, please try again.';
                        if (xhr.responseJSON.noResults) {
                            $('#searchOutput').html('<p class="text-danger text-center">'+xhr.responseJSON.message+'</p>')
                        }
                        $.toaster({
                            priority: 'danger', title: 'Error', icon: 'fa fa-close',
                            message: message,
                        });
                    }
                });
            } else {
                $.toaster({
                    priority: 'warning', title: 'Hey', icon: 'fa fa-close',
                    message: "You haven't entered any search terms!",
                });
            }
        },
    },
    parse: {},
    setup: {
        DatePickers: function() {
            $('.date-picker').each(function() {
                $(this).datepicker({
                    templates: {
                        leftArrow: '<i class="now-ui-icons arrows-1_minimal-left"></i>',
                        rightArrow: '<i class="now-ui-icons arrows-1_minimal-right"></i>'
                    }
                }).on('show', function() {
                    $('.datepicker').addClass('open');

                    datepicker_color = $(this).data('datepicker-color');
                    if( datepicker_color.length != 0){
                        $('.datepicker').addClass('datepicker-'+ datepicker_color +'');
                    }
                }).on('hide', function() {
                    $('.datepicker').removeClass('open');
                });
            });
        },
        Templates: function() {
            var templates = [
                { dir: '/assets/templates/users/add/', name: 'singleUserDuplicate' },
                { dir: '/assets/templates/users/', name: 'userRow' },
                { dir: '/assets/templates/users/', name: 'userDetails' },
                { dir: '/assets/templates/users/', name: 'userEdit' },
            ];

            templates.map((template) => {
                $.get(template.dir + template.name + '.partial', function(templateFile) {
                    var compile = Handlebars.compile(templateFile);
                    page.parse[template.name] = function(data) {
                        var html = compile(data);
                        return html;
                    };
                });
            });
        },
    }
}

page.initialise = function() {
    page.setup.Templates();
    page.setup.DatePickers();
}

$(document).ready(function() {
    page.initialise();
}).on('click', '.addUser', function() {
    page.form.action.addUser($(this));
}).on('click', '.back', function() {
    page.action.change.Back($(this));
}).on('click', '.search_users', function() {
    page.action.Search($(this));
}).on('click', '.open', function() {
    page.action.user.Open($(this));
}).on('click', '.closeUser', function() {
    page.action.user.Close($(this));
}).on('keydown', '.search', function(e) {
    if (e.keyCode == 13) {
        $('.search_users').click();
    }
}).on('click', '.editUser', function() {
    page.action.change.Edit($(this));
}).on('click', '.cancelEdit', function() {
    page.action.change.CancelEdit($(this));
}).on('click', '.saveEdit', function() {
    page.form.action.saveEdit($(this));
})