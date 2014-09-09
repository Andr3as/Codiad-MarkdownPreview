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
        
        case 'savePreview':
            if (isset($_POST['content']))  {
                if (isset($_GET['file'])) {
                    $title = basename($_GET['file']);
                } else {
                    $title = "Markdown Preview";
                }
                $file   = file_get_contents("previewTemplate.html");
                $file   = str_replace("__title__", $title, $file);
                $file   = str_replace("__content__", $_POST['content'], $file);
                $result = file_put_contents("preview.html", $file);
                if ($result === false) {
                    echo '{"status":"error","message":"Failed to save preview"}';
                } else {
                    echo '{"status":"success","message":"Preview saved!"}';
                }
            } else {
                echo '{"status":"error","message":"Missing parameter!"}';
            }
            break;
            
        case 'saveContent':
            if (isset($_POST['content']) && isset($_GET['path'])) {
                $path   = getWorkspacePath($_GET['path']);
                $ext    = getExtension($path);
                $file   = dirname($path) . "/" . basename($path, "." . $ext) . ".html";
                $inc    = 1;
                while(file_exists($file)) {
                    $file = dirname($path) . "/" . basename($path, "." . $ext) . "($inc).html";
                    $inc++;
                }
                $content    = file_get_contents("template.html");
                $content    = str_replace("__CONTENT__", $_POST['content'], $content);
                $result     = file_put_contents($file, $content);
                if ($result === false) {
                    echo '{"status":"error","message":"Failed to save content"}';
                } else {
                    echo '{"status":"success","message":"Content saved"}';
                }
            } else {
                echo '{"status":"error","message":"Missing parameter!"}';
            }
            break;
            
        default:
            break;
    }
    
    function getExtension($path) {
        $name = basename($path);
        $pos = strrpos($name, '.');
        if ($pos !== false) {
            return substr($name, $pos + 1);
        } else {
            return "";
        }
    }
    
    function getWorkspacePath($path) {
		//Security check
		if (!Common::checkPath($path)) {
			die('{"status":"error","message":"Invalid path"}');
		}
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