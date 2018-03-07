var page = {};

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

page.initialise = function() {
    window.Templates.Load([
        { dir: '/assets/templates/users/add/', name: 'singleUserDuplicate' },
        { dir: '/assets/templates/users/', name: 'userRow' },
        { dir: '/assets/templates/users/', name: 'userDetails' },
        { dir: '/assets/templates/users/', name: 'userEdit' },
    ]);

    page.initialise.DatePickers();
}
page.initialise.DatePickers = function() {
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
}

page.config = {
    currentlyOpen: null,
}
page.data: {
    searchResults: {},
};

page.form = {};
page.form.action = {};
page.form.action.saveEdit = function($this) {
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
        dnd: ($('#edit_dnd').is(':checked')) ? '1' : '0',
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
                        if (uKey == 'DND') {
                            data[lKey] = Number(data[lKey]);
                        }
                        user[uKey] = data[lKey];
                    }
                });
                user.USER_ID = xhr.user_id;

                $('#tr.userRow[data-uid="'+page.config.currentlyOpen+'"]').remove();
                var tr = window.Templates.Compile.userRow(user);
                $('#searchResults').append(tr);

                if (page.config.currentlyOpen != xhr.user_id) {
                    delete page.data.searchResults[page.config.currentlyOpen];
                    page.config.currentlyOpen = xhr.user_id;
                }
                page.data.searchResults[xhr.user_id] = user;
                var html = window.Templates.Compile.userDetails(user);
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
};
page.form.action.addUser = function($this) {
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
        dnd: ($('#dnd').is(':checked')) ? '1' : '0',
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

                // Parse returned content
                let user = {};
                var lKeys = Object.keys(data);
                lKeys.map(function(lKey) {
                    if (lKey != 'uid') {
                        let uKey = lKey.toUpperCase();
                        if (uKey == 'DND') {
                            data[lKey] = Number(data[lKey]);
                        }
                        user[uKey] = data[lKey];
                    }
                });
                user.USER_ID = xhr.user_id;
                page.data.searchResults[xhr.user_id] = user;

                // Parse user details to page
                var html = window.Templates.Compile.userDetails(user);
                $('#userDetails').html(html);

                // Show newly added user's details
                $('#usersTable').hide();
                $('#userDetails').show();
                $("#addUser").modal('hide');

                // Add row
                var tr = window.Templates.Compile.userRow(user);
                $('#searchResults').append(tr);

                // Reset form
                $('#ph_home, #ph_mobile, #ph_work, #addr_l1, #addr_town, #addr_state, #addr_post, #defence_section, #dob, #email, #first_name, #last_name').val(null);
                $('#defence').prop('checked', false);
                $('#gender').val('').change();
            } else if (xhr.status == 409) {
                $this.prop('disable', false);
                $.toaster({
                    priority: 'danger', title: 'Error', icon: 'fa fa-close',
                    message: xhr.responseJSON.message,
                });

                let user = xhr.responseJSON.user;
                user.ADDED_DATE = moment(user.ADDED_DATE, 'YYYY-MM-DD HH:mm:ss').format('dddd, MMMM Do YYYY, h:mm a');
                var html = window.Templates.Compile.singleUserDuplicate(user);
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
};

page.action = {};
page.action.change = {};
page.action.change.Back = function($this) {
    var hide = $this.data('hide');
    if (!String.isNullOrEmpty(hide)) {
        $(hide).hide();
    }
    var show = $this.data('show');
    if (!String.isNullOrEmpty(show)) {
        $(show).show();
    }
};
page.action.change.Edit = function($this) {
    var user = page.data.searchResults[page.config.currentlyOpen];
    var html = window.Templates.Compile.userEdit(user);
    $('#userDetails').html(html);
    page.setup.DatePickers();
};
page.action.change.CancelEdit = function() {
    var user = page.data.searchResults[page.config.currentlyOpen];
    var html = window.Templates.Compile.userDetails(user);
    $('#userDetails').html(html);
};
page.action.user = {};
page.action.user.Close = function() {
    $('#userDetails').hide();
    $('#usersTable').show();
    $('#userDetails').html('');
    page.config.currentlyOpen = null;
};
page.action.user.Open = function($this) {
    $parent = $this.closest('.userRow');
    var uid = $parent.data('uid');
    var user = page.data.searchResults[uid];

    page.config.currentlyOpen = uid;
    var html = window.Templates.Compile.userDetails(user);
    $('#userDetails').html(html);

    $('#usersTable').hide();
    $('#userDetails').show();
};
page.action.Search = function($this) {
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

                if (xhr.users.length > 0) {
                    xhr.users.map((user) => {
                        page.data.searchResults[user.USER_ID] = user;
                        var tr = window.Templates.Compile.userRow(user);
                        $('#searchResults').append(tr);
                    });

                    if ($('#searchResults').is(':visible') != true) {
                        page.action.user.Close();
                    }
                } else {
                    var tr = "<tr class='text-center' style='min-height:60px;' colspan='5'>Your search returned no results.</tr>"
                    $('#searchResults').append(tr);
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
};
