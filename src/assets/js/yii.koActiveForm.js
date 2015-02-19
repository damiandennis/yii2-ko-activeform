/**
 * Created by damian on 17/02/15.
 */
yii.koActiveForm = (function ($) {
    var KoActiveForm = function(data) {
        var self = this;
        var start = 0;
        ko.utils.objectForEach(data, function(k, v) {
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
            ko.applyBindings(activeForm, $('#'+id)[0]);
            this.registrar.push(activeForm);
        }
    };
    return pub;
})(jQuery);

jQuery(document).ready(function () {
    yii.initModule(yii.koActiveForm);
});
