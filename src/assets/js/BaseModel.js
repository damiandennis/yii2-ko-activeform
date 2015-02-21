/**
 * @file The base model.
 *
 * @author Damian Dennis <damiandennis@gmail.com>
 */

var Model = Model || {};

/**
 * The base model. This handles validation and saving of the child model.
 *
 * @constructor
 */
Model.BaseModel = function() {

    /*
     * Check that required libraries are included and initiate them.
     */
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

    /**
     * Create local and reference for child.
     *
     * @type {Model.BaseModel}
     */
    var base = this;

    /**
     * Initiates rules, labels and attributes.
     *
     * @param {Object} data The data from the server.
     * @param {function} beforeValidate The function to run before validation. Useful for setting extra attributes.
     */
    base.init = function(data, beforeValidate) {
        console.log(data);
        data = data || {};
        base.beforeValidate = beforeValidate.bind(this) || function(){};
        this.rules(data.rules || []);
        this.attributeLabels = data.attributeLabels || {};
        this.isNewRecord(data.isNewRecord);
        this.class = data.class || '';
        this.mapDataToModels(data.attributes || {}, data.relations || {}, data.values || {});
    };

    /**
     * Stores the ko validation for attributes.
     */
    var groupValidator;
    /**
     * For storing of errors of attributes.
     */
    base.errors = ko.observableArray();
    /**
     * Stores the rules for attributes.
     */
    base.rules = ko.observableArray();
    /**
     * Stores the attributes.
     */
    base.attributes = ko.observable();
    /**
     * Stores the relations.
     */
    base.relations = ko.observable();
    /**
     * Stores the fields that require validation.
     */
    base.validateFields = ko.observableArray();
    /**
     * The place to save the updated data.
     */
    base.saveUrl = ko.observable('');
    /**
     * If the model is new or not.
     */
    base.isNewRecord = ko.observable(true);
    /**
     * Stores the labels for the attributes.
     */
    base.attributeLabels = {};
    /**
     * Stores the class for the model.
     * @type {string}
     */
    base.class = '';

    /**
     * Adds validators to each field based on rule.
     *
     * @param {Object} _this The originating class.
     * @param rule
     * @param field
     */
    var validateField = function(_this, rule, field) {
        var extend = {};
        extend[rule[1]] = rule[2] || {};
        var label = _this.attributeLabels[field] || _.startCase(field);
        $.extend(extend[rule[1]], {attribute: label});

        if (_.isFunction(extend[rule[1]].onlyIf)) {
            extend[rule[1]].params = {attribute: extend[rule[1]].attribute};
            var copy = extend[rule[1]].onlyIf;
            extend[rule[1]].onlyIf = function () {
                return copy() && (_.contains(base.validateFields(), field));
            }
        } else {
            extend[rule[1]].params = {attribute: extend[rule[1]].attribute};
            extend[rule[1]].onlyIf = function () {
                return (_.contains(base.validateFields(), field));
            }
        }
        if (_this.attributes()[field]) {
            _this.attributes()[field].extend(extend);
        }
    };

    /**
     * Sets the rules fetched from the server.
     *
     * @param {Object} _this The originating class.
     */
    var setRules = function(_this) {
        ko.utils.arrayForEach(_this.rules(), function(rule) {
            if (_.isArray(rule[0])) {
                ko.utils.arrayForEach(rule[0], function (field) {
                    validateField(_this, rule, field);
                });
            } else if (_.isString(rule[0])) {
                validateField(_this, rule, rule[0]);
            }
        });

        var groupValidator = ko.validation.group(_this.attributes);
        groupValidator.showAllMessages(false);
    };

    /**
     * Sets the status class for the row wrapper.
     *
     * @param {string} attribute
     * @returns {string}
     */
    base.statusClass = function(attribute) {
        var isModified = false;
        var isValid = false;
        if (ko.isComputed(this.attributes()[attribute])) {

        }
        else {
            isModified = this.attributes()[attribute].isModified();
            isValid = this.attributes()[attribute].isValid();
        }
        return !isModified ? '' : (isValid ? 'has-success' : 'has-error');
    };

    /**
     * Shortcut for retrieving attribute values.
     *
     * @param {string} attribute The name of the attribute.
     * @returns {function} The observable for this attribute.
     */
    base.v = function(attribute) {
        return this.attributes()[attribute];
    };

    /**
     * Shortcut for retrieving attribute labels.
     *
     * @param {string} attribute The name of the attribute.
     * @returns {function} The observable for this attribute.
     */
    base.l = function(attribute) {
        if (this.attributeLabels[attribute] !== undefined) {
            return this.attributeLabels[attribute];
        } else {
            return _.startCase(attribute);
        }
    };


    /**
     * Maps data to appropriate places.
     *
     * @param {Object} defaultAttributes
     * @param {Object} defaultRelations
     * @param {Object} data
     */
    base.mapDataToModels = function(defaultAttributes, defaultRelations, data) {

        var attributes = _.clone(defaultAttributes);
        attributes = _.extend({}, attributes, data);
        var relations = _.clone(defaultRelations);

        // Clear meta data.
        _.forEach(relations, function(relation, index) { relations[index] = null; });
        relations = _.extend({}, relations, data);

        var attributeArray = _.keys(defaultAttributes);
        base.validateFields(attributeArray);

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
                        if (ko.isComputed(options.data) || ko.isObservable(options.data)) {
                            return options.data;
                        } else {
                            return ko.observable(options.data);
                        }
                    }
                }
            };
        });
        base.attributes(ko.mapping.fromJS(attributes, attributeMapping));
        base.relations(ko.mapping.fromJS(relations, relationMapping));
        base.beforeValidate();
        setRules(this);
    };

    /**
     * Saves the data in attributes.
     * @param {boolean} validate Whether to run validation first.
     * @param {array} attributes attributes to save.
     */
    base.save = function(validate, attributes) {
        validate = validate || true;
        if (!validate || this.validate(attributes)) {
            $.ajax({
                url: base.saveUrl(),
                data: base.toJSON()
            }).done(function(res) {
                console.log(res);
            }).error(function() {
                console.error('request failed.');
            });
        } else {
            console.error(base.errors());
        }
    };

    /**
     * Runs the validation of the attributes.
     *
     * @param {array} attributes a list of attributes
     * @param showMessages whether to show messages.
     * @returns {boolean}
     */
    base.validate = function(attributes, showMessages) {
        if (_.isArray(attributes)) {
            base.validateFields(attributes);
        }
        base.errors([]);
        setRules(this);
        groupValidator = ko.validation.group(base.attributes);
        groupValidator.showAllMessages(false);
        base.errors(ko.toJS(groupValidator));
        return base.errors().length == 0;
    };

    /**
     * For ko.toJSON to extract attributes.
     *
     * @returns {object}
     */
    this.toJSON = function() {
        var copy = ko.mapping.toJS(this);
        return copy.attributes;
    };

    /**
     * Stores this model for Child model to access.
     *
     * @type {Model.BaseModel}
     */
    this.base = base;
};
