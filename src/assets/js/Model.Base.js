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
Model.Base = function(validationInit) {

    validationInit = validationInit || {};

    /*
     * Check that required libraries are included and initiate them.
     */
    if (typeof ko.validation == 'undefined') {
        throw new Error("ko.validation library is required to use base model.");
    }
    if (typeof ko.mapping == 'undefined') {
        throw new Error("ko.mapping library is required to use base model.");
    }

    var defaults = {
        errorMessageClass: 'help-block',
        insertMessages: false,
        grouping: {
            deep: false,
            observable: true,
            live: false
        }
    };

    ko.validation.init(_.extend(defaults, validationInit));

    /**
     * Create local and reference for child.
     *
     * @type {Model.Base}
     */
    var base = this;

    /**
     * Initiates rules, labels and attributes.
     *
     * @param {Object} data The data from the server.
     * @param {function} beforeValidate The function to run before validation. Useful for setting extra attributes.
     */
    base.init = function(data, beforeValidate) {

        this.errors = ko.observableArray();
        this.rules = ko.observableArray();
        this.attributes = ko.observable();
        this.relations = ko.observable();
        this.validateFields = ko.observableArray();
        this.saveUrl = ko.observable('');
        this.isNewRecord = ko.observable(true);

        data = data || {};
        this.beforeValidate = beforeValidate ? beforeValidate.bind(this) : function(){};
        this.rules(data.rules || []);
        this.attributeLabels = data.attributeLabels || {};
        this.isNewRecord(data.isNewRecord);
        this.class = data.class || '';
        this.jsClass = data.jsClass || '';
        this.primaryKey = data.primaryKey || false;
        this.mapDataToModels(data.attributes || {}, data.relations || {}, data.values || {});

        this.getID = ko.computed(function() {
            var self = this;
            if (!this.primaryKey || this.isNewRecord()) {
                return false;
            }
            try {
                if (_.isArray(this.primaryKey)) {
                    if (this.primaryKey.length > 1) {
                        return _.arrayMap(this.primaryKey, function(composite) {
                            return self.v(composite)();
                        });
                    } else {
                        return this.v(this.primaryKey[0])();
                    }
                } else {
                    return this.v(this.primaryKey)();
                }
            } catch (e) {
                return false;
            }
        }, this);

    };

    /**
     * Stores the ko validation for attributes.
     */
    var groupValidator;
    /**
     * For storing of errors of attributes.
     */
    base.errors = [];
    /**
     * Stores the rules for attributes.
     */
    base.rules = [];
    /**
     * Stores the attributes.
     */
    base.attributes = {};
    /**
     * Stores the relations.
     */
    base.relations = {};
    /**
     * Stores the fields that require validation.
     */
    base.validateFields = [];
    /**
     * The place to save the updated data.
     */
    base.saveUrl = '';
    /**
     * If the model is new or not.
     */
    base.isNewRecord = true;
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
    base.validateField = function(_this, rule, field) {
        var extend = {};
        extend[rule[1]] = rule[2] || {};
        var label = _this.attributeLabels[field] || _.startCase(field);
        $.extend(extend[rule[1]], {attribute: label});

        if (_.isFunction(extend[rule[1]].onlyIf)) {
            extend[rule[1]].params = {attribute: extend[rule[1]].attribute};
            var copy = extend[rule[1]].onlyIf;
            extend[rule[1]].onlyIf = function () {
                return copy() && (_.contains(_this.validateFields(), field));
            }
        } else {
            extend[rule[1]].params = {attribute: extend[rule[1]].attribute};
            extend[rule[1]].onlyIf = function () {
                return (_.contains(_this.validateFields(), field));
            }
        }
        if (ko.isObservable(_this.attributes()[field])) {
            _this.attributes()[field].extend(extend);
        }
    };

    /**
     * Sets the rules fetched from the server.
     *
     * @param {Object} _this The originating class.
     */
    base.setRules = function(_this) {
        ko.utils.arrayForEach(_this.rules(), function(rule) {
            if (_.isArray(rule[0])) {
                ko.utils.arrayForEach(rule[0], function (field) {
                    base.validateField(_this, rule, field);
                });
            } else if (_.isString(rule[0])) {
                base.validateField(_this, rule, rule[0]);
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

        } else if(ko.isObservable(this.attributes()[attribute])) {
            if (this.attributes()[attribute].isModified !== undefined) {
                isModified = this.attributes()[attribute].isModified();
            }
            if (this.attributes()[attribute].isValid !== undefined) {
                isValid = this.attributes()[attribute].isValid();
            }
        } else {
            throw new Error('Attributes must be observables or computed.');
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
        if (typeof this.attributes()[attribute] === 'undefined') {
            throw new Error('attribute ' + attribute + ' is not defined.');
        }
        return this.attributes()[attribute];
    };

    /**
     * Shortcut for retrieving relations.
     *
     * @param {string} relation The name of the relation.
     * @returns {function} The observable for this relation.
     */
    base.r = function(relation) {
        if (typeof this.relations()[relation] === 'undefined') {
            throw new Error('relation ' + relation + ' is not defined.');
        }
        return this.relations()[relation];
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

        var attributeArray = _.keys(defaultAttributes);
        this.validateFields(attributeArray);

        //Ignore relations.
        var attributeMapping = {

        };

        //Ignore attributes.
        var relationMapping = {

        };

        // Set the mapping type for the model, if it does not exist map it as observable array.
        _.forEach(defaultRelations, function(v, k) {

            var modelName = _.capitalize(k); //Set model name to relation by default.
            var r = relations[k];
            if (typeof r === 'object') {
                if (_.isArray(r)) {
                    if (r[0] !== undefined && r[0].jsClass !== undefined && r[0].jsClass.length > 0) {
                        modelName = r[0].jsClass;
                    } else {
                        modelName = modelName.replace(/s$/, '');
                    }
                } else if (r !== undefined && r.jsClass !== undefined && r.jsClass.length > 0) {
                    modelName = r[0].jsClass;
                }
            } else {
                modelName = modelName.replace(/s$/, '');
            }

            relationMapping[k] = {
                create: function (options) {
                    if (typeof Model[modelName] == 'function' && options.data) {
                        return new Model[modelName](options.data);
                    } else {
                        if (ko.isComputed(options.data) || ko.isObservable(options.data)) {
                            return options.data;
                        } else {
                            Model[modelName] = function (data) {
                                var model = this;
                                data = data || {};
                                data.jsClass = modelName;
                                model.init(data);
                                this.toJSON = function () {
                                    this.base.toJSON.bind(this);
                                    return this.base.toJSON();
                                };
                            };
                            ko.utils.extend(Model[modelName].prototype, new Model.Base());
                            return new Model[modelName](options.data);
                        }
                    }
                }
            };
        });

        try {
            this.attributes(ko.mapping.fromJS(attributes, attributeMapping));
            this.relations(ko.mapping.fromJS(relations, relationMapping));
        } catch (e) {
            console.error(e.stack);
        }
        if (typeof this.beforeValidate === 'function') {
            this.beforeValidate();
        }
        this.setRules(this);
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
                throw new Error('saving model failed.');
            });
        } else {
            console.error(this.errors());
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
            this.validateFields(attributes);
        }
        this.errors([]);
        this.setRules(this);
        groupValidator = ko.validation.group(this.attributes);
        groupValidator.showAllMessages(showMessages !== undefined ? showMessages : false);
        this.errors(ko.toJS(groupValidator));
        return this.errors().length == 0;
    };

    /**
     * For ko.toJSON to extract attributes.
     *
     * @returns {object}
     */
    base.toJSON = function() {
        var copy = ko.mapping.toJS(this);
        return copy.attributes;
    };

    base.clone = function() {
        var copy = {};
        copy.attributes = ko.toJS(this.attributes());
        copy.attributeLabels = this.attributeLabels;
        copy.isNewRecord = true;
        copy.class = this.class;
        copy.jsClass = this.jsClass;
        if (this.jsClass) {
            return new (Model[this.jsClass])(copy);
        } else {
            throw new Error('jsClass must be defined in order to clone.');
        }
    };

    base.generateName = function(field, key) {
        if (key !== undefined) {
            return this.class + '[' + key + '][' + field + ']';
        } else {
            return this.class + '[' + field + ']';
        }
    };

    /**
     * Stores this model for Child model to access.
     *
     * @type {Model.Base}
     */
    this.base = base;
};
