/**
 * Created by damian on 17/02/15.
 */
yii.koActiveForm = (function ($) {
    var KoActiveForm = function(data) {
        var self = this;
        var start = 0;
        data.models = data.models || [];
        ko.utils.objectForEach(data.models, function(k, v) {

            if (typeof Model[k] === 'undefined') {
                Model[k] = function(data) {
                    var model = this;
                    data = data || {};
                    data.jsClass = k;
                    model.init(data);
                    this.toJSON = function() {
                        this.base.toJSON.bind(this);
                        return this.base.toJSON();
                    };
                };
                ko.utils.extend(Model[k].prototype, new Model.BaseModel());
            }

            self['m'+start] = new Model[k](v);
            start++;
        });

        if (typeof this.onInit == 'function') {
            this.onInit.bind(this);
            this.onInit(data);
        }
    };
    var pub = {
        registrar: [],
        init: function() {
            console.log('initiating koActiveForm...');
        },
        setBinding: function(id, data) {
            if (typeof data.extendForm == 'function') {
                ko.utils.extend(KoActiveForm.prototype, new data.extendForm());
            }
            var activeForm = new KoActiveForm(data);
            var csrfParam = yii.getCsrfParam();
            var element = $('#'+id);
            if (csrfParam) {
                element.append('<input name="' + csrfParam + '" value="' + yii.getCsrfToken() + '" type="hidden">');
            }
            ko.applyBindings(activeForm, element[0]);
            this.registrar.push(activeForm);
        }
    };
    return pub;
})(jQuery);

jQuery(document).ready(function () {
    yii.initModule(yii.koActiveForm);
});
