/*
 * Copyright (c) Codiad & Andr3as, distributed
 * as-is and without warranty under the MIT License.
 * See http://opensource.org/licenses/MIT for more information. 
 * This information must remain intact.
 */

codiad.LivePreviewHelper = {

    version: "1.1.0",
    status: false,
    extensions: [],

    /**
     * Initialisation
     * 
     * @param {string} path Location of the script
     * @returns {boolean} If init succeeded or not
     */
    init: function(path) {
        if (typeof(path) == 'undefined') {
            return false;
        }
        var _this = this;
        //Add rightbar entry
        if ($('.live-preview').length === 0) {
            $('.sb-right-content hr:first').before('<hr class="live-preview"><a class="live-preview" onclick="codiad.LivePreviewHelper.livePreview(); return false;"><i class="icon-eye"></i> Live Preview</a>');
        }
        $('.live-preview').hide();
        
        this.$onDocumentChange = this.onDocumentChange.bind(this);
        //Focus listener
        amplify.subscribe("active.onOpen", function(path){
            if (codiad.editor.getActive() !== null && _this.testPath(path)) {
                var manager = codiad.editor.getActive().commands;
                manager.addCommand({
                    name: 'OpenLivePreview',
                    bindKey: "Ctrl-Shift-O",
                    exec: function () {
                        _this.livePreview();
                    }
                });
            }
        });
        amplify.subscribe('active.onFocus', function(path){
            if (_this.testPath(path)) {
                $('.live-preview').show();
                codiad.editor.getActive().getSession().addEventListener(_this.$onDocumentChange);
            } else {
                $('.live-preview').hide();
                if (_this.status) {
                    _this.hide();
                }
            }
        });
        amplify.subscribe('active.onClose', function(path){
            if (_this.testPath(path)) {
                $('.live-preview').hide();
                if (_this.status) {
                    _this.hide();
                }
            } 
        });
        //Load style
        $.get(path + 'LivePreviewHelper.css', function(styles){
            _this.domLib = ace.require("ace/lib/dom");
            _this.domLib.importCssString(styles);
        });
        //Set timeout for extension registration
        setTimeout(function(){
            amplify.publish('helper.onLivePreviewInit');
        }, 500);
        return true;
    },

    /**
     * Toggle live preview
     * 
     * @param {string} path Path of file for preview
     */
    livePreview: function(path) {
        path = path || codiad.active.getPath();
        if (this.testPath(path)) {
            if (!this.status) {
                this.show(path);
            } else {
                this.hide(path);
            }
        }
    },
    
    /**
     * Register an extension for live preview
     * 
     * @param {(string|string[])} ext Extension or Array of Extensions
     */
    registerExtension: function(ext) {
        var _this = this;
        if ($.isArray(ext)) {
            $.each(ext, function(i, item){
                _this.extensions.push(item);
            });
        } else {
            _this.extensions.push(ext);
        }
    },

    /**
     * Show preview
     * 
     * @param {string} path Path of file for preview
     */
    show: function(path) {
    	//If the window is divided?
        if ($('.editor').size() > 1) {
            codiad.message.error("Livepreview does not work with splited windows");
            return false;
        }
        $('.editor').width('50%');
        codiad.editor.resize();
        $('.editor').after('<div class="preview"><iframe></iframe></div>');
        //Add change listener
        var session = codiad.editor.getActive().getSession();
        session.addEventListener('change', this.$onDocumentChange);

        amplify.publish('helper.onStartLivePreview', path);

        this.status = true;
    },

    /**
     * Hide preview
     * 
     * @param {string} path Path of file for preview
     */
    hide: function(path) {
        $('.editor').width('100%');
        codiad.editor.resize();
        $('.preview').remove();
        //Remove change listener
        var session = codiad.editor.getActive().getSession();
        session.removeEventListener('change', this.$onDocumentChange);

        amplify.publish('helper.onStopLivePreview', path);

        this.status = false;
    },

    /**
     * Document Change listener
     */
    onDocumentChange: function(e) {
        amplify.publish('helper.onChangeLivePreview', e);
    },

    /**
     * Update content of live preview
     * 
     * @param {string} selector
     * @param {string} content If content is not given, the first argument is taken as content
     */
    updateContent: function(selector, content) {
        if (typeof(content) == 'undefined') {
            //No selector
            content = selector;
            $('.preview iframe').contents().find('html').html(content);
        } else {
            $(selector).html(content);
        }
    },

    /**
     * Test path for specific extension
     * 
     * @param {string} path Path of file
     * @returns {boolean} Whether it matches or not
     */
    testPath: function(path) {
        var ext = "";
        var res = false;
        $.each(this.extensions, function(i, ext){
            if (new RegExp("(."+ext+")$", "").test(path)) {
                res = true;
            }
        });
        return res;
    }
};