/**
 * Created by damian on 17/02/15.
 */
yii.koActiveForm = (function ($) {
    var KoActiveForm = function(data) {
        var self = this;
        var start = 0;
        ko.utils.objectForEach(data, function(k, v) {

            if (typeof Model[k] === 'undefined') {
                Model[k] = function(data) {
                    var model = this;
                    data = data || {};
                    var defaultAttributes = data.attributes || {};
                    var defaultRelations = data.relations || {};
                    model.rules = data.rules || [];
                    model.attributeLabels = data.attributeLabels || {};
                    model.isNewRecord(data.isNewRecord);
                    model.mapDataToModels(defaultAttributes, defaultRelations, data.values || {});
                };
                ko.utils.extend(Model[k].prototype, new Model.BaseModel());
            }

            self['m'+start] = new Model[k](v);
            start++;
        });
    };
    var pub = {
        registrar: [],
        init: function() {
            console.log('initiating koActiveForm...');
        },
        setBinding: function(id, data) {
            var activeForm = new KoActiveForm(data);
            var csrfParam = yii.getCsrfParam();
            if (csrfParam) {
                $('#'+id).append('<input name="' + csrfParam + '" value="' + yii.getCsrfToken() + '" type="hidden">');
            }
            ko.applyBindings(activeForm, $('#'+id)[0]);
            this.registrar.push(activeForm);
        }
    };
    return pub;
})(jQuery);

jQuery(document).ready(function () {
    yii.initModule(yii.koActiveForm);
});
