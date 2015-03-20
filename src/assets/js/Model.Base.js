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
 * @param {Object} validationInit The validation parameters.
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

    /**
     * Validation defaults.
     * @type {Object}
     */
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
     * Initiates rules, labels and attributes. Observables and Computed are created here to
     * prevent issues with inheritance and KO. This needs to be called in the child class.
     *
     * @param {Object} data The data from the server.
     * @param {function} beforeValidate The function to run before validation. Useful for setting extra attributes.
     */
    base.init = function(data, beforeValidate) {

        data = data || {};

        /**
         *  To store errors for validation of attributes.
         */
        this.errors = ko.observableArray();

        /**
         * Stores the validation rules, usually pulled from server model.
         */
        this.rules = ko.observableArray(data.rules || []);

        /**
         * Stores the attributes and there values.
         */
        this.attributes = ko.observable();

        /**
         * Stores active relations.
         */
        this.relations = ko.observable();

        /**
         * Stores fields that require validation.
         */
        this.validateFields = ko.observableArray();

        /**
         * Url to save model data to.
         */
        this.saveUrl = ko.observable('');

        /**
         * Has this model already been created in the database.
         */
        this.isNewRecord = ko.observable(data.isNewRecord !== undefined ? data.isNewRecord : true);

        /**
         * Callback to execute code before validating this model.
         * @type {function(this:base)|*}
         */
        this.beforeValidate = beforeValidate ? beforeValidate.bind(this) : function(){};

        /**
         *
         * @type {{}|*|base.attributeLabels|attributeLabels|copy.attributeLabels}
         */
        this.attributeLabels = data.attributeLabels || {};

        /**
         * The name of server model.
         * @type {string}
         */
        this.className = data.className || '';

        /**
         * The name of the client model (usually the same as server).
         * @type {string}
         */
        this.jsClass = data.jsClass || '';

        /**
         * The primary key name for this model or false if no primary key.
         *
         * @type {boolean|string}
         */
        this.primaryKey = data.primaryKey || false;

        /**
         * Set if this object has been deleted on the client side.
         */
        this.deleted = ko.observable(false);

        /**
         * Tracks the parent for removal.
         */
        this.parent = ko.observable();

        /**
         * gets the current primary id for this class.
         */
        this.getID = ko.computed(function() {
            var self = this;
            if (!this.primaryKey || this.isNewRecord()) {
                return false;
            }
            try {
                if (_.isArray(this.primaryKey)) {
                    if (this.primaryKey.length > 1) {
                        return _.arrayMap(this.primaryKey, function(composite) {
                            return self.value(composite)();
                        });
                    } else {
                        return this.value(this.primaryKey[0])();
                    }
                } else {
                    return this.value(this.primaryKey)();
                }
            } catch (e) {
                return false;
            }
        }, this);

        /**
         * Map the attributes, relations and values.
         */
        this.mapDataToModels(data.attributes || {}, data.relations || {}, data.values || {});

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
    base.className = '';

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
    base.value = function(attribute) {
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
    base.relation = function(relation) {
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
    base.label = function(attribute) {
        if (this.attributeLabels[attribute] !== undefined) {
            return this.attributeLabels[attribute];
        } else {
            return _.startCase(attribute);
        }
    };

    /**
     * Checks if relation exists and is populated.
     *
     * @param relation The relation name to check.
     * @returns {boolean} whether the relation exists and is populated.
     */
    base.relationExists = function(relation) {
        return typeof this.relations()[relation] !== 'undefined';
    };

    /**
     *
     * @param relationName
     * @param relation
     */
    base.addRelation = function(relationName, relation) {
        var self = this;
        if (this.relations()[relationName] === undefined) {
            this.relations()[relationName] = _.isArray(relation) ? ko.observableArray(relation) : ko.observable(relation);
        } else {
            if (_.isArray(this.relations()[relationName]())) {
                if (_.isArray(relation)) {
                    _.each(relation, function(r) {
                        self.relations()[relationName].push(r);
                    });
                } else {
                    this.relations()[relationName].push(relation);
                }
            } else {
                this.relations()[relationName](relation);
            }
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
        groupValidator.showAllMessages(showMessages !== undefined ? showMessages : true);
        this.errors(ko.toJS(groupValidator));
        return this.errors().length == 0;
    };

    /**
     * Removes the item if is a new record otherwise flags as deleted.
     * @param model
     * @param event
     * @param parent The parent model to remove item from.
     */
    base.remove = function(model, event, parent) {
        if (this.isNewRecord()) {
            if (parent === undefined) {
                throw new Error('third parameter parent is required for deleting elements.');
            }
            parent.remove(model);
        } else {
            model.deleted(true);
        }
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

    /**
     * Clones the current model.
     */
    base.clone = function() {
        var copy = {};
        copy.attributes = ko.toJS(this.attributes());
        copy.attributeLabels = this.attributeLabels;
        copy.isNewRecord = true;
        copy.className = this.className;
        copy.jsClass = this.jsClass;
        copy.rules = this.rules();
        if (this.jsClass) {
            return new (Model[this.jsClass])(copy);
        } else {
            throw new Error('jsClass must be defined in order to clone.');
        }
    };

    /**
     * Generates name for saving serverside.
     * @param fields
     * @param key
     * @returns {string}
     */
    base.generateName = function(fields, key) {
        fields = _.isArray(fields) ? fields.join('][') : fields;
        if (key !== undefined) {
            return this.className + '[' + key + '][' + fields + ']';
        } else {
            return this.className + '[' + fields + ']';
        }
    };

    /**
     * get the primary key as a string
     * @returns {string}
     */
    base.getPrimaryKeyString = function() {
        if (_.isArray(this.primaryKey)) {
            if (this.primaryKey.length > 1) {
                return this.primaryKey.join(',');
            } else {
                return this.primaryKey[0];
            }
        } else {
            return this.primaryKey;
        }
    };

    /**
     * Stores this model for Child model to access.
     *
     * @type {Model.Base}
     */
    this.base = base;
};
