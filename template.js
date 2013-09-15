/*
 * Copyright (c) Codiad & Andr3as, distributed
 * as-is and without warranty under the MIT License. 
 * See http://opensource.org/licenses/MIT for more information.
 * This information must remain intact.
 */
$(document).ready(function(){
    var markdown = '<link rel="stylesheet" href="markdown.css">';
    var github  = '<link rel="stylesheet" href="github.css">';
    $('#markdown').click(function(){
        $('link[href="github.css"]').replaceWith(markdown);
    });
    $('#github').click(function(){
        $('link[href="markdown.css"]').replaceWith(github);
    });
});