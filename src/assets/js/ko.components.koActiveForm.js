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
                <label for="username" class="control-label" data-bind="visible: useLabel, text: model.l(field)"></label>\
                <input id="username" class="form-control" data-bind="value: model.v(field), attr: fieldOptions, element: element" />\
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
                <label for="username" class="control-label" data-bind="visible: useLabel, text: model.l(field)"></label>\
                <textarea id="username" class="form-control" data-bind="value: model.v(field), attr: fieldOptions"></textarea>\
               </div>'
});

ko.components.register('error-summary', {
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
                <label for="username" class="control-label" data-bind="visible: useLabel, text: model.l(field)"></label>\
                <textarea id="username" class="form-control" data-bind="value: model.v(field), attr: fieldOptions"></textarea>\
               </div>'
});
