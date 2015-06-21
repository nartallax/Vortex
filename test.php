<?php
	require_once('./protected/utils.php');
	$files = getFilesRecursive('./protected', '.php');
	foreach($files as $file){
		readfile($file);
		echo("\n");
	}
			