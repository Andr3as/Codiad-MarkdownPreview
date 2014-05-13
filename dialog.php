<!--
    Copyright (c) Codiad & Andr3as, distributed
    as-is and without warranty under the MIT License. 
    See http://opensource.org/licenses/MIT for more information. 
    This information must remain intact.
-->
<form id="previewForm">
    <p>Choose method to parse file:</p>
    <input type="checkbox" id="setDefault">Set as deflaut<br>
    <button onclick="codiad.modal.unload(); return false;">Close</button>
    <button id="preview_github">GitHub</button>
    <button onclick="codiad.MarkdownPreview.parse('js'); return false;">Markdown.js</button>
    <?php
        if (!isset($_GET['absolutePath'])) {
            $_GET['absolutePath'] = "false";
        }
        if ($_GET['absolutePath'] == "false") {
            echo '<button onclick="codiad.MarkdownPreview.parse(\'browser\'); return false;">Browser</button>';
        }
    ?>
    <div id="previewSettings">
        <input type="checkbox" id="gfm"> Enable 
        <a href="http://github.github.com/github-flavored-markdown/">GitHub Flavored Markdown</a>
        <input type="text" id="gfm_context" placeholder="Repository context">
        <button onclick="codiad.MarkdownPreview.parse('github'); return false;">Parse</button>
    </div>
    <script>
        $('#previewSettings').hide();
        $('#preview_github').click(function(){
            $('#previewSettings').show();
            return false;
        });
    </script>
</form>