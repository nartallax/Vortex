<?php
namespace Narval;

// parser
require_once('striter.php'); 

// patterns
require_once('patterns.php');

// operators and operations
require_once('operations.php');

// terminal expressions
require_once('terminal_expressions.php');
require_once('functions.php');

// helper classes
require_once('binding_cache.php');

// the Main Function of the module

function check($pattern, $data){
	$striter = new Striter($pattern);
	return $striter->nextPattern()->bind(new BindingCache($data))->simplify()->check(null, $data);
}