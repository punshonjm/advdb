var page = {};

$(document).ready(function() {
    page.initialise();
});

page.initialise = function() {
    window.Templates.Load([
        { dir: '/assets/templates/events/race/', name: 'newRaceRow' },
        { dir: '/assets/templates/events/race/', name: 'raceRow' },
        { dir: '/assets/templates/events/race/leg/', name: 'newRaceLegs' },
        { dir: '/assets/templates/events/race/leg/', name: 'newRaceNewLegRow' },
        { dir: '/assets/templates/events/race/leg/', name: 'newRaceLegRow' },
    ]);
};

$(document).on('click', '.addEvent', function() {
    page.create.event($(this));
})

page.create = {};
page.create.event = function($this) {
    
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
}

page.create.race.legs = {};
page.create.race.new.legs = {};
$(document).on('click', '.race .addRaceLegs', function() {
    page.create.race.new.legs.show($(this));
}).on('click', '.newRaceLegs .addLeg', function() {
    page.create.race.new.legs.add($(this));
}).on('click', '.newRaceLegs .saveNewLeg', function() {
    page.create.race.new.legs.saveNew($(this));
}).on('click', '.newRaceLegs .editLeg', function() {
    page.create.race.new.legs.edit($(this));
}).on('click', '.newRaceLegs .removeLeg', function() {
    page.create.race.new.legs.remove($(this));
}).on('click', '.newRaceLegs .saveNewLegs', function() {
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
page.create.race.new.legs.parseRow = function($row) {

}
page.create.race.new.legs.add = function($this) {
    if(!$('tr.newLeg').is(':visible')) {
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

    leg.type = $('.newLeg .raceLegType').val();
    leg.distance = $('.newLeg .raceLegDistance').val();
    leg.unit = $('.newLeg .raceLegDistanceUnit').val();

    if (!String.isNullOrEmpty(leg.type) && !String.isNullOrEmpty(leg.distance) && !String.isNullOrEmpty(leg.unit)) {
        $this.closest('.newLeg').remove();
        $('#newLegsTable tbody.list').append(window.Templates.Compile.newRaceLegRow(leg));

        page.create.race.legs[$this.closest('#newRaceLegs').data().id].push(leg);
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

    var $tr = $('#races tbody.list').find('tr.race[data-id="'+$leg.closest('#newRaceLegs').data().id+'"]')
    $tr.text(Number($tr.text) - 1);

    $this.closest('.leg').remove();
};
page.create.race.new.legs.save = function($this) {
    $('#legsPanel').empty();
    $('#mainPanel').show();
    $('#mainPanel').closest('.modal').find('.modal-footer').show();
    $('#legsPanel').hide();
};
