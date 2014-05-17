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
        curpath = path.split('/').slice(0, -1).join('/')+'/';

    $(function() {
        codiad.MarkdownPreview.init();
    });

    codiad.MarkdownPreview = {
        
        path: curpath,
        file: "",
        default: "",
        defObj: {},
        
        init: function() {
            var _this = this;
            //Context callbacks
            amplify.subscribe("context-menu.onShow", function(obj){
				var ext = _this.getExtension(obj.path);
				if (ext == "md" || ext == "markdown") {
					if (codiad.project.isAbsPath($('#file-manager a[data-type="root"]').attr('data-path'))) {
						$('#context-menu').append('<hr class="file-only markdown">');
						$('#context-menu').append('<a class="file-only markdown" onclick="codiad.MarkdownPreview.showDialog($(\'#context-menu\').attr(\'data-path\'), true);"><span class="icon-eye"></span>Preview</a>');
					}
				}
            });
            amplify.subscribe("context-menu.onHide", function(){
                $('.markdown').remove();
            });
            //Register preview callbacks
            amplify.subscribe("helper.onPreview", function(path){
                var ext = _this.getExtension(path);
                if (ext == "md" || ext == "markdown") {
                    _this.showDialog(path, false);
                    return false;
                }
            });
            //Load helper
            if (typeof(codiad.PreviewHelper) == 'undefined') {
                $.getScript(this.path+"previewHelper.js");
            }
        },
        
        //////////////////////////////////////////////////////////
        //
        //  Show dialog to choose paser method
        //
        //  Parameter:
        //
        //  path - {String} - File path
        //	isAbsolutePath - {bool} - Has project an absolute path
        //
		//////////////////////////////////////////////////////////
        showDialog: function(path, isAbsolutePath) {
            var ext = this.getExtension(path);
            if (ext == "md" || ext == "markdown") {
                this.file = path;
                if (this.default !== "") {
                    this.parse(this.default, false);
                } else {
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
        //  method  - {String} - Method to parsfie le
        //  checkDefault - (Optional) - {Boolean} - Check if it should be sets  adefault
        //
		//////////////////////////////////////////////////////////
        parse: function(method, checkDefault) {
            var _this = this;
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
                            _this.parse("js");
                        } catch (e) {
                            _this.showResult(text);
                        }
                    }).fail(function(){
                        codiad.message.error("Github is unreachable!");
                        _this.parse("js");
                    });
                } else if (method == "js") {
                    $.getScript(_this.path+"markdown.js", function(){
                        var text = markdown.toHTML(content);
                        _this.showResult(text);
                    });
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
        //  text - {String} - Parsed content of the file
        //
		//////////////////////////////////////////////////////////
        showResult: function(text) {
            var _this = this;
            $.post(this.path+"controller.php?action=saveFile&file="+this.file, {"text": text}, function(){
                markdown=window.open(_this.path+"preview.html",'_newtab');
            });
        },
        
        //////////////////////////////////////////////////////////
        //
        //  Get extension of flei
        //
        //  Parameter:
        //
        //  path - {String} - File path
        //
		//////////////////////////////////////////////////////////
        getExtension: function(path) {
            return path.substring(path.lastIndexOf(".")+1);
        }
    };
})(this, jQuery);