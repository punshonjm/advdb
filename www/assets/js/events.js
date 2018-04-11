var page = {};

$(document).ready(function() {
    page.initialise();
});

page.initialise = function() {
    window.Templates.Load([
        { dir: '/assets/templates/events/', name: 'eventList' },
        { dir: '/assets/templates/events/race/', name: 'newRaceRow' },
        { dir: '/assets/templates/events/race/', name: 'raceRow' },
        { dir: '/assets/templates/events/race/leg/', name: 'newRaceLegs' },
        { dir: '/assets/templates/events/race/leg/', name: 'newRaceNewLegRow' },
        { dir: '/assets/templates/events/race/leg/', name: 'newRaceLegRow' },
    ]);

    page.initialise.dtp();
    page.events.Load();
};
page.initialise.dtp = function() {
    $('.dtp').each(function() {
        $(this).datetimepicker({
            format: 'DD/MM/YYYY',
        });
    });
}

$(document).on('click', '.addEvent', function() {
    page.create.event($(this));
}).on('click', '.showMore', function() {
    page.events.more.Show( $(this) );
}).on('click', '.hideMore', function() {
    page.events.more.Hide();
}).on('click', '.editEvent', function() {
    page.events.Edit($(this));
})

page.events = {};
page.events.Data = {};
page.events.Load = function() {
    $('#eventList').empty();
    $.get('/api/events', function(resp) {
        page.events.Data = resp;
        let html = window.Templates.Compile.eventList(resp);
        $('#eventList').html(html);
    });
};
page.events.more = {};
page.events.more.Show = function( $this ) {
    $('.hideOnShowMore').hide();
    $($this.data().target).show();
}
page.events.more.Hide = function() {
    $('.showMorePanel').hide();
    $('.hideOnShowMore').show();

}

page.create = {};
page.create.event = function($this) {
    $('.has-warning').removeClass("has-warning");

    var errors = [];
    var data = {};
    data.event = {};
    data.event.start = $('#newEventStart').val();
    data.event.end = $('#newEventEnd').val();
    data.event.location = $('#location').val();
    data.event.series = $('#series').val();
    data.races = {};

    $('#races tbody.list').children('tr.race').each(function() {
        var race = page.create.race.parseRow($(this));
        data.races[race.id] = race;

        if (race.legs.length < 1) {
            errors.push({ 'for': 'race', 'id': race.id });
        }
    });

    if (String.isNullOrEmpty(data.event.start)) {
        errors.push({for: 'value', id: '#newEventStart' });
    }
    if (String.isNullOrEmpty(data.event.end)) {
        errors.push({for: 'value', id: '#newEventEnd' });
    }
    if (String.isNullOrEmpty(data.event.location)) {
        errors.push({for: 'value', id: '#location' });
    }

    if (errors.length == 0) {
        $this.prop('disabled', true);
        $.post('/api/events/new', data, function(resp) {
            if (resp.status == 200) {
                $this.prop('disabled', false);
                $('#addEvent').modal('hide');
                page.events.Load();
                page.create.eventReset();
                $.toaster({ priority: 'success', title: 'Success', message: resp.message });
            } else {
                $this.prop('disabled', false);
                $.toaster({ priority: 'warning', title: 'Error', message: resp.message });
            }
        }).fail(function() {
            $this.prop('disabled', false);
            $.toaster({ priority: 'warning', title: 'Error', message: 'A server error occured, please try again!' });
        });
    } else {
        errors.map(function(error) {
            if (error.for == 'value') {
                $('#'+error.id).closest('.form-group').addClass('has-warning');
            }
            if (error.for == 'race') {
                $('#races tbody.list').find('#'+error.id).addClass('bg-warning');
                $.toaster({ priority: 'warning', title: 'Error', message: 'Ensure all races include at least one leg!' });
            }
        });

        $.toaster({ priority: 'warning', title: 'Error', message: 'Please address the errors before submitting again!' });
    }
}
page.create.eventReset = function() {
    $('#newEventStart').val('');
    $('#newEventEnd').val('');
    $('#location').val('');
    $('#addEvent tbody.list').empty();

    page.create.race.legs = {};
}

page.events.Edit = function($this) {
    var $event = $this.closest('.eventCard');
    var eventData = _.find(page.events.Data[$event.data().year], { EVENT_ID: $event.data().id });
    console.log(eventData);
}

$(document).on('click', '.addRace', function() {
    page.create.race.new();
}).on('click', '.newRace .saveNewRace', function() {
    page.create.race.new.save($(this));
}).on('click', '.race .removeRace', function() {
    page.create.race.new.remove($(this));
}).on('click', '.race .editRace', function() {
    page.create.race.new.edit($(this));
});

page.create.race = {};
page.create.race.parseRow = function($row) {
    var race = {};
    race.id = $row.data().id;
    race.date = $row.find('.raceDate').text();
    race.category = $row.find('.raceCategory').text();
    race.legCount = $row.find('.raceLegCount').text();

    if (race.id in page.create.race.legs) {
        race.legs = page.create.race.legs[race.id];
    } else {
        race.legs = [];
    }

    return race;
}
page.create.race.new = function() {
    if (!$('tr.newRace').is(':visible')) {
        $('#races tbody.list').append(window.Templates.Compile.newRaceRow());
        page.initialise.dtp();
    }
}
page.create.race.new.save = function($this) {
    $(".has-warning").removeClass('has-warning');

    var race = {};
    if ('id' in $('tr.newRace').data()) {
        race.id = $('tr.newRace').data().id;
    } else {
        race.id = _.uniqueId('race');
    }
    race.date = $('tr.newRace .raceDate').val();
    race.category = $('tr.newRace .raceCategory').val();
    race.legCount = $('tr.newRace .raceLegCount').text();

    if (!String.isNullOrEmpty(race.category) && !String.isNullOrEmpty(race.date)) {
        $this.closest('tr.newRace').remove();
        $('#races tbody.list').append(window.Templates.Compile.raceRow(race));
    } else {
        if (String.isNullOrEmpty(race.category)) {
            $('tr.newRace .raceCategory').closest(".form-group").addClass('has-warning');
            $.toaster({ priority: 'warning', title: "Error", message: "Please ensure you have entered a category." });
        }
        if (String.isNullOrEmpty(race.date)) {
            $('tr.newRace .raceDate').closest(".form-group").addClass('has-warning');
            $.toaster({ priority: 'warning', title: "Error", message: "Please ensure you have entered a date." });
        }
    }
}
page.create.race.new.remove = function($this) {
    $this.closest('.race').remove();
}
page.create.race.new.edit = function($this) {
    var $race = $this.closest('tr.race')
    var race = page.create.race.parseRow($race);
    $race.replaceWith(window.Templates.Compile.newRaceRow(race));
    page.initialise.dtp();
}

page.create.race.legs = {};
page.create.race.new.legs = {};
$(document).on('click', '.race .addRaceLegs', function() {
    page.create.race.new.legs.show($(this));
}).on('click', '#newRaceLegs .addLeg', function() {
    page.create.race.new.legs.add($(this));
}).on('click', '#newRaceLegs .saveNewLeg', function() {
    page.create.race.new.legs.saveNew($(this));
}).on('click', '#newRaceLegs .editLeg', function() {
    page.create.race.new.legs.edit($(this));
}).on('click', '#newRaceLegs .removeLeg', function() {
    page.create.race.new.legs.remove($(this));
}).on('click', '#newRaceLegs .saveNewLegs', function() {
    page.create.race.new.legs.save($(this));
})

page.create.race.new.legs.show = function($this) {
    var $race = $this.closest('tr.race')
    var race = page.create.race.parseRow($race);
    $('#legsPanel').html(window.Templates.Compile.newRaceLegs(race));
    $('#mainPanel').hide();
    $('#mainPanel').closest('.modal').find('.modal-footer').hide();
    $('#legsPanel').show();

    if (race.legs.length > 0) {
        race.legs.map(function(leg) {
            $("#newLegsTable tbody.list").append(window.Templates.Compile.newRaceLegRow(leg));
        });
    }
};
page.create.race.new.legs.add = function($this) {
    if (!$('tr.newLeg').is(':visible')) {
        $('#newLegsTable tbody.list').append(window.Templates.Compile.newRaceNewLegRow());
    }
};
page.create.race.new.legs.saveNew = function($this) {
    $(".has-warning").removeClass('has-warning');

    var leg = {};

    if ('id' in $('tr.newLeg').data()) {
        leg.id = $('tr.newLeg').data().id;
    } else {
        leg.id = _.uniqueId('leg');
    }

    leg.raceId = $this.closest('#newRaceLegs').data().id;
    leg.type = $('.newLeg .raceLegType').val();
    leg.distance = $('.newLeg .raceLegDistance').val();
    leg.unit = $('.newLeg .raceLegDistanceUnit').val();

    if (!String.isNullOrEmpty(leg.type) && !String.isNullOrEmpty(leg.distance) && !String.isNullOrEmpty(leg.unit)) {
        $this.closest('.newLeg').remove();
        $('#newLegsTable tbody.list').append(window.Templates.Compile.newRaceLegRow(leg));

        if (!(leg.raceId in page.create.race.legs)) {
            page.create.race.legs[leg.raceId] = [];
        }

        var i = _.findIndex(page.create.race.legs[leg.raceId], { id: leg.id });
        if (i > -1) {
            page.create.race.legs[leg.raceId][i] = leg;
        } else {
            page.create.race.legs[leg.raceId].push(leg);
        }

        var $td = $('#races tbody.list').find('tr.race[data-id="'+leg.raceId+'"]').find('.raceLegCount');
        $td.text(Number($td.text()) + 1);
    } else {
        if (String.isNullOrEmpty(leg.type)) {
            $('tr.newLeg .raceLegType').closest(".form-group").addClass('has-warning');
            $.toaster({ priority: 'warning', title: "Error", message: "Please ensure you have entered a type." });
        }
        if (String.isNullOrEmpty(leg.distance)) {
            $('tr.newLeg .raceLegDistance').closest(".form-group").addClass('has-warning');
            $.toaster({ priority: 'warning', title: "Error", message: "Please ensure you have entered a distance." });
        }
        if (String.isNullOrEmpty(leg.unit)) {
            $('tr.newLeg .raceLegDistanceUnit').closest(".form-group").addClass('has-warning');
            $.toaster({ priority: 'warning', title: "Error", message: "Please ensure you have entered a unit." });
        }
    }
};
page.create.race.new.legs.edit = function($this) {
    var $leg = $this.closest('.leg')
    var leg = _.find(page.create.race.legs[$this.closest('#newRaceLegs').data().id], { id: $leg.data().id });
    $leg.replaceWith(window.Templates.Compile.newRaceNewLegRow(leg));
};
page.create.race.new.legs.remove = function($this) {
    var $leg = $this.closest('.leg');
    _.remove(page.create.race.legs[$leg.closest('#newRaceLegs').data().id], function(n) {
        return (n.id == $leg.data().id);
    });

    var $td = $('#races tbody.list').find('tr.race[data-id="'+$leg.closest('#newRaceLegs').data().id+'"]').find('.raceLegCount');
    $td.text(Number($td.text()) - 1);

    $this.closest('.leg').remove();
};
page.create.race.new.legs.save = function($this) {
    $('#legsPanel').empty();
    $('#mainPanel').show();
    $('#mainPanel').closest('.modal').find('.modal-footer').show();
    $('#legsPanel').hide();
};
