<?php
/*
 * Copyright (c) Codiad & Andr3as, distributed
 * as-is and without warranty under the MIT License. 
 * See http://opensource.org/licenses/MIT for more information.
 * This information must remain intact.
 */
    error_reporting(0);
    
    require_once('../../common.php');
    checkSession();
    
    switch($_GET['action']) {
        
        case 'getContent':
            if (isset($_GET['path'])) {
                echo file_get_contents(getWorkspacePath($_GET['path']));
            } else {
                echo '{"status":"error","message":"Missing parameter!"}';
            }
            break;
        
        case 'saveFile':
            if (isset($_POST['text']))  {
                if (isset($_GET['title'])) {
                    $title = $_GET['title'];
                } else {
                    $title = "Markdown Preview";
                }
                $file = file_get_contents("template.html");
                $file = str_replace("__title__", $title, $file);
                $file = str_replace("__content__", $_POST['text'], $file);
                file_put_contents("preview.html", $file);
                echo '{"status":"success","message":"Preview saved!"}';
            } else {
                echo '{"status":"error","message":"Missing parameter!"}';
            }
            
        default:
            break;
    }
    
    function getWorkspacePath($path) {
        if (strpos($path, "/") === 0) {
            //Unix absolute path
            return $path;
        }
        if (strpos($path, ":/") !== false) {
            //Windows absolute path
            return $path;
        }
        if (strpos($path, ":\\") !== false) {
            //Windows absolute path
            return $path;
        }
        return "../../workspace/".$path;
    }
?>