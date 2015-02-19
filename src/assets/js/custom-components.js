/**
 * Created by damian on 19/02/15.
 */
ko.components.register('field-input-row', {
    viewModel: function(params) {
        this.model = params.model;
        this.field = params.field;
        this.type = params.type || 'text';
    },
    template: '<div class="form-group" data-bind="css: model.statusClass(field)">\
                <label for="username" class="control-label" data-bind="text: model.l(field)"></label>\
                <input id="username" class="form-control" data-bind="value: model.v(field), attr: {type: type}" />\
               </div>'
});
