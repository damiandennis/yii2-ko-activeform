/**
 * Created by damian on 19/02/15.
 */
ko.components.register('field-input-row', {
    viewModel: function(params) {
        this.model = params.model;
        this.field = params.field;
        this.fieldOptions = params.fieldOptions || {};
        this.fieldOptions.type = params.type || 'text';
        this.fieldOptions.name = this.model.class + '[' + this.field + ']';
        this.useLabel = params.useLabel !== undefined ? params.useLabel : true;
        if (!ko.isObservable(this.useLabel)) {
            this.useLabel = ko.observable(this.useLabel);
        }
        this.element = params.element !== undefined ? params.element : null;
        if (!ko.isObservable(this.element)) {
            this.element = ko.observable(this.element);
        }
    },
    template: '<div class="form-group" data-bind="css: model.statusClass(field)">\
                <label for="username" class="control-label" data-bind="visible: useLabel, text: model.label(field)"></label>\
                <input id="username" class="form-control" data-bind="value: model.value(field), attr: fieldOptions, element: element" />\
               </div>'
});

ko.components.register('field-textarea-row', {
    viewModel: function(params) {
        this.model = params.model;
        this.field = params.field;
        this.fieldOptions = params.fieldOptions || {};
        this.fieldOptions.type = params.type || 'text';
        this.fieldOptions.name = this.model.class + '[' + this.field + ']';
        this.useLabel = params.useLabel !== undefined ? params.useLabel : true;
        if (!ko.isObservable(this.useLabel)) {
            this.useLabel = ko.observable(this.useLabel);
        }
    },
    template: '<div class="form-group" data-bind="css: model.statusClass(field)">\
                <label for="username" class="control-label" data-bind="visible: useLabel, text: model.label(field)"></label>\
                <textarea id="username" class="form-control" data-bind="value: model.value(field), attr: fieldOptions"></textarea>\
               </div>'
});

ko.components.register('error-summary', {
    viewModel: function(params) {
        this.model = params.model;
        this.showErrors = params.showErrors || false;
        if (!ko.isObservable(this.showErrors)) {
            this.showErrors = ko.observable(this.showErrors);
        }
    },
    template: '<div class="alert alert-danger clearfix" data-bind="visible: model.errors().length > 0 && showErrors" role="alert">\
                <span class="glyphicon glyphicon-exclamation-sign pull-left" aria-hidden="true"></span>\
                <div class="pull-left" style="padding-left: 10px;">\
                <!-- ko foreach: model.errors -->\
                    <div data-bind="text: $data"></div>\
                <!-- /ko -->\
                </div>\
                <a href="#" class="close pull-right" data-bind="click: function () { showErrors(!showErrors()) }">&times;</a>\
               </div>'
});

ko.components.register('id-marker', {
    viewModel: function(params) {
        this.model = params.model;
        this.index = ko.isObservable(params.index) ? params.index() : params.index;
        this.key = this.model.getPrimaryKeyString();
    },
    template: '<input type="hidden" data-bind="value: model.getID, attr: {name: model.generateName(key, index)}" />'
});

ko.components.register('delete-marker', {
    viewModel: function(params) {
        this.model = params.model;
        this.index = ko.isObservable(params.index) ? params.index() : params.index;
        this.key = 'deleted';
    },
    template: '<input type="hidden" data-bind="value: model.deleted, attr: {name: model.generateName(key, index)}" />'
});

