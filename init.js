/*
 * Copyright (c) Codiad & Andr3as, distributed
 * as-is and without warranty under the MIT License.
 * See http://opensource.org/licenses/MIT for more information.
 * This information must remain intact.
 */

(function(global, $){
    
    var codiad = global.codiad,
        scripts = document.getElementsByTagName('script'),
        path = scripts[scripts.length-1].src.split('?')[0],
        curpath = path.split('/').slice(0, -1).join('/')+'/',
        self;

    $(function() {
        codiad.MarkdownPreview.init();
    });

    codiad.MarkdownPreview = {
        
        path    : curpath,
        callback: this.showResult,
        default : "",
        defObj  : {},
        file    : "",
        
        init: function() {
            var _this   = this;
            self        = this;
            //Context callbacks
            amplify.subscribe("context-menu.onShow", function(obj){
                var ext = _this.getExtension(obj.path);
                if (ext == "md" || ext == "markdown") {
                    $('#context-menu').append('<hr class="file-only markdown">');
                    if (codiad.project.isAbsPath($('#file-manager a[data-type="root"]').attr('data-path'))) {
                        $('#context-menu').append('<a class="file-only markdown" onclick="codiad.MarkdownPreview.showPreview($(\'#context-menu\').attr(\'data-path\'), true);"><span class="icon-eye"></span>Preview</a>');
                    }
                    $('#context-menu').append('<a class="file-only markdown" onclick="codiad.MarkdownPreview.generate($(\'#context-menu\').attr(\'data-path\'));"><span class="icon-code"></span>Generate html</a>');
                }
            });
            amplify.subscribe("context-menu.onHide", function(){
                $('.markdown').remove();
            });
            //Register preview callbacks
            amplify.subscribe("helper.onPreview", function(path){
                var ext = _this.getExtension(path);
                if (ext == "md" || ext == "markdown") {
                    _this.showPreview(path, false);
                    return false;
                }
            });

            amplify.subscribe('helper.onStartLivePreview', function(path){
                var ext = _this.getExtension(path);
                if (ext == "md" || ext == "markdown") {
                    _this.livePreview();
                    //Weired workaround
                    setTimeout(function(){
                        _this.livePreview();
                    },100);
                    return false;
                }
            });
            amplify.subscribe('helper.onChangeLivePreview', function(event){
                var path    = codiad.active.getPath();
                var ext     = _this.getExtension(path);
                if (ext == "md" || ext == "markdown") {
                    _this.livePreview();
                    return false;
                }
            });
            
            amplify.subscribe('helper.onLivePreviewInit', function(){
                codiad.LivePreviewHelper.registerExtension(["md", "markdown"]);
            });
            //Load helper and libs
            if (typeof(codiad.PreviewHelper) == 'undefined') {
                $.getScript(this.path+"previewHelper.js");
            }
            if (typeof(codiad.LivePreviewHelper) == 'undefined') {
                $.getScript(this.path+"LivePreviewHelper.js", function(){
                    codiad.LivePreviewHelper.init(_this.path);
                });
            }
            $.getScript(this.path+"markdown.js");
            //Load template
            $.get(this.path+'livePreviewTemplate.html', function(template){
                _this.livePreviewTemplate = template;
            });
        },
        
        //////////////////////////////////////////////////////////
        //
        //  Show dialog to choose paser method
        //
        //  Parameter:
        //
        //  path - {String} - File path
        //    isAbsolutePath - {bool} - Has project an absolute path
        //
        //////////////////////////////////////////////////////////
        showPreview: function(path, isAbsolutePath) {
            var ext = this.getExtension(path);
            if (ext == "md" || ext == "markdown") {
                this.file = path;
                if (this.default !== "") {
                    this.parse(this.default, this.showResult, false);
                } else {
                    this.callback = this.showResult;
                    codiad.modal.load(400, this.path+"dialog.php?chooseMethod&absolutePath=" + isAbsolutePath.toString());
                }
            } else {
                codiad.filemanager.openInBrowser(path);
            }
        },
        
        //////////////////////////////////////////////////////////
        //
        //  Parse markdown file
        //
        //  Parameter:
        //
        //  method  - {String} - Method to parse file
        //    callback - {Function} - Callback function
        //  checkDefault - (Optional) - {Boolean} - Check if it should be sets  adefault
        //
        //////////////////////////////////////////////////////////
        parse: function(method, callback, checkDefault) {
            var _this = this;
            if (typeof(callback) != 'function') {
                callback = this.callback;
            }
            if (typeof(checkDefault) == 'undefined') {
                if ($('#setDefault').attr("checked") == "checked") {
                    this.default = method;
                }
            }
            $.get(this.path+"controller.php?action=getContent&path="+this.file, function(content){
                if (method == "github") {
                    if (checkDefault !== false || typeof(checkDefault) == 'undefined') {
                        if ($('#gfm').attr("checked") == "checked") {
                            _this.defObj = {
                                "text": content,
                                "mode": "gfm",
                                "context": $('#gfm_context').val()
                            };
                        } else {
                            _this.defObj = {
                                "text": content
                            };
                        }
                    } else {
                        _this.defObj.text = content;
                    }
                    $.post("https://api.github.com/markdown", JSON.stringify(_this.defObj),function(text){
                        try {
                            var result = $.parseJSON(text);
                            codiad.message.warning(result.message);
                            _this.parse("js", callback);
                        } catch (e) {
                            callback(text);
                        }
                    }).fail(function(){
                        codiad.message.error("Github is unreachable!");
                        _this.parse("js", callback);
                    });
                } else if (method == "js") {
                    var text = markdown.toHTML(content, 'Maruku');
                    callback(text);
                } else {
                    codiad.filemanager.openInBrowser(_this.file);
                }
                codiad.modal.unload();
            });
        },
        
        //////////////////////////////////////////////////////////
        //
        //  Show result in new window
        //
        //  Parameter:
        //
        //  content - {String} - Parsed content of the file
        //
        //////////////////////////////////////////////////////////
        showResult: function(content) {
            $.post(self.path+"controller.php?action=savePreview&file="+self.file, {"content": content}, function(){
                window.open(self.path+"preview.html",'_newtab');
            });
        },
        
        //////////////////////////////////////////////////////////
        //
        //  Generate html of markdown
        //
        //  Parameter:
        //
        //  path - {String} - Path of file
        //
        //////////////////////////////////////////////////////////
        generate: function(path) {
            var ext = this.getExtension(path);
            if (ext == "md" || ext == "markdown") {
                this.file = path;
                if (this.default !== "") {
                    this.parse(this.default, this.saveResult, false);
                } else {
                    this.callback       = this.saveResult;
                    var isAbsolutePath  = codiad.project.isAbsPath($('#file-manager a[data-type="root"]').attr('data-path'));
                    codiad.modal.load(400, this.path+"dialog.php?chooseMethod&absolutePath  =" + isAbsolutePath.toString());
                }
            } else {
                codiad.filemanager.openInBrowser(path);
            }
        },
        
        //////////////////////////////////////////////////////////
        //
        //  Save parsed result
        //
        //  Parameter:
        //
        //  content - {String} - Parsed content of the file
        //
        //////////////////////////////////////////////////////////
        saveResult: function(content) {
            $.post(self.path + "controller.php?action=saveContent&path=" + self.file, {"content": content}, function(result){
                result = JSON.parse(result);
                codiad.message[result.status](result.message);
                if (result.status == "success") {
                    codiad.filemanager.rescan(self.getDirname(self.file));
                }
            });
        },
        
        //////////////////////////////////////////////////////////
        //
        //  Handle live preview
        //
        //////////////////////////////////////////////////////////
        livePreview: function() {
            var content = codiad.editor.getContent();
            content     = markdown.toHTML(content, 'Maruku');
            content     = this.livePreviewTemplate
                                .replace('__content_', content)
                                .replace('__title__', codiad.active.getPath())
                                .replace('__PATH__', this.path);
            codiad.LivePreviewHelper.updateContent(content);
        },
        
        //////////////////////////////////////////////////////////
        //
        //  Get extension of file
        //
        //  Parameter:
        //
        //  path - {String} - File path
        //
        //////////////////////////////////////////////////////////
        getExtension: function(path) {
            return path.substring(path.lastIndexOf(".")+1);
        },
        
        //////////////////////////////////////////////////////////
        //
        //  Get dirname of file
        //
        //  from php.js <phpjs.org>, licensed under the MIT licenses.
        //
        //  Parameter:
        //
        //  path - {String} - File path
        //
        //////////////////////////////////////////////////////////
        getDirname: function(path) {
            return path.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '');
        }
    };
})(this, jQuery);