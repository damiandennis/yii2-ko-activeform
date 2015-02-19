
/**
 *
 * @constructor
 */
var Model = Model || {};
Model.BaseModel = function(data) {

    if (typeof ko.validation == 'undefined') {
        throw "ko.validation library is required to use base model."
    }
    if (typeof ko.mapping == 'undefined') {
        throw "ko.mapping library is required to use base model."
    }

    ko.validation.init({
        errorMessageClass: 'help-block',
        grouping: {
            deep: false,
            observable: true,
            live: true
        }
    });

    var model = this;
    var groupValidator;
    model.errors = ko.observableArray();
    model.rules = ko.observableArray();
    model.attributes = ko.observable();
    model.relations = ko.observable();
    model.validateFields = ko.observableArray();
    model.saveUrl = ko.observable('');

    model.statusClass = function(attribute) {
        var isModified = this.attributes()[attribute].isModified();
        var isValid = this.attributes()[attribute].isValid();
        return !isModified ? '' : (isValid ? 'has-success' : 'has-error');
    };

    var setRules = function(_this) {
        ko.utils.arrayForEach(_this.rules(), function(rule) {
            ko.utils.arrayForEach(rule[0], function(field) {
                var extend = {};
                extend[rule[1]] = rule[2] || {};

                var label = _this.attributeLabels()[field];
                $.extend(extend[rule[1]], {attribute: label});

                if (_.isFunction(extend[rule[1]].onlyIf)) {
                    extend[rule[1]].params = {attribute: extend[rule[1]].attribute};
                    var copy = extend[rule[1]].onlyIf;
                    extend[rule[1]].onlyIf = function() {
                        return copy() && _.contains(model.validateFields(), field);
                    }
                } else {
                    extend[rule[1]].params = {attribute: extend[rule[1]].attribute};
                    extend[rule[1]].onlyIf = function() {
                        return _.contains(model.validateFields(), field);
                    }
                }

                _this.attributes()[field].extend(extend);

            });
        });

        var groupValidator = ko.validation.group(_this.attributes);
        groupValidator.showAllMessages(false);

    };

    model.v = function(attribute) {
        return this.attributes()[attribute];
    };

    model.l = function(attribute) {
        return this.attributeLabels()[attribute];
    };


    /**
     * Maps data to appropriate places.
     *
     * @param {Object} defaultAttributes
     * @param {Object} defaultRelations
     * @param {Object} data
     */
    model.mapDataToModels = function(defaultAttributes, defaultRelations, data) {

        var attributes = _.clone(defaultAttributes);
        attributes = _.extend({}, attributes, data);
        var relations = _.clone(defaultRelations);

        // Clear meta data.
        _.forEach(relations, function(relation, index) { relations[index] = null; });
        relations = _.extend({}, relations, data);

        var attributeArray = _.keys(defaultAttributes);

        model.validateFields(attributeArray);

        //Ignore relations.
        var attributeMapping = {
            'ignore': _.keys(defaultRelations)
        };

        //Ignore attributes.
        var relationMapping = {
            'ignore': attributeArray
        };

        // Set the mapping type for the model, if it does not exist map it as observable array.
        _.forEach(defaultRelations, function(v, k) {
            relationMapping[k] = {
                create: function(options) {
                    if (typeof Model[v[1]] == 'function' && options.data) {
                        return new Model[v[1]](options.data);
                    } else if (_.isArray(options.data)) {
                        return ko.observableArray(options.data);
                    } else {
                        return ko.observable(options.data);
                    }
                }
            };
        });
        model.attributes(ko.mapping.fromJS(attributes, attributeMapping));
        model.relations(ko.mapping.fromJS(relations, relationMapping));
        setRules(this);
    };

    model.setAttributes = function(updates) {
        var model = this;
        $.each(model.attributes() || [], function(key, val) {
            model.attributes()[key](updates[key] || {});
        });
    };

    model.save = function(validate, attributes) {
        validate = validate || true;
        if (!validate || model.validate(attributes)) {
            $.ajax({
                url: model.saveUrl(),
                data: model.toJSON()
            }).done(function(res) {
                console.log(res);
            }).error(function() {
                console.error('request failed.');
            });
        } else {
            console.error(model.errors());
        }
    };

    model.validate = function(attributes, showMessages) {
        if (_.isArray(attributes)) {
            model.validateFields(attributes);
        }
        model.errors([]);
        setRules(this);
        groupValidator = ko.validation.group(model.attributes);
        groupValidator.showAllMessages(false);
        model.errors(ko.toJS(groupValidator));
        return model.errors().length == 0;
    };

    this.toJSON = function() {
        var copy = ko.mapping.toJS(this);
        return copy.attributes;
    };
};
