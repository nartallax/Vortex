<?php
namespace Narval;

require_once('../narval/narval.php');

use Exception;
use ErrorException;

$tests = array(
	'1|||isInt()' => true,
	'1|||isInt(me)' => true,
	'1|||isFlt()' => true,
	'1|||isFlt(me)' => true,
	'1|||isInt(me + 1)' => true,
	'1|||me == 1' => true,
	'1|||isInt() && me > 5' => false,
	'1|||isInt() && me > 0' => true,
	'1|||me > 0 && me < 100' => true,
	'[1,3,5]|||[isInt() && me % 2 == 1]' => true,
	'[1,4,5]|||[me % 2 == 1]' => false,
	'{"a":5}|||{a:isInt() && a < 100 && a > 0}' => true,
	'{"intarr":[1,3,5,7,9], "val":5}|||{intarr:[isInt()], val:me -> intarr}' => true,
	'{"intarr":[1,3,5,7,9], "val":4}|||{intarr:[isInt()], val:me -> intarr}' => false,
	'{"intarr":[1,3,5,7.5,9], "val":5}|||{intarr:[isInt()], val:me -> intarr}' => false,
	'{"a":1, "b":2, "c":4}|||{a:isInt(), b:isInt(), c:isInt()}' => true,
	'{"a":1, "b":2, "d":4}|||{a:isInt(), b:isInt()}' => false,
	'{"a":1, "b":2}|||{a:isInt(), b:isInt(), c:isInt()}' => false,
	'{"a":1, "b":2, "d":4}|||{a:isInt(), b:isInt(), c:isInt()}' => false,
	'{"a":1, "b":2, "c":"4"}|||{a:isInt(), b:isInt(), c:isInt()}' => false,
	'{"a":5, "b":12.5}|||{a:isInt(a), b:b == a * 2 + a / 2}' => true,
	'[1,2,3,4,5]|||[key % 2 == ((me + 1) % 2)]' => true,
	'[3,10,3.14]|||[(key == 0 && me == 3) || (key == 1 && me % 5 == 0) || (key == 2 && isFlt())]' => true,
	'{"objarr":[{"intarr":[1,3,5], "num":0}, {"intarr":[2,4,6], "num":1}, {"intarr":[9, 10], "num":0}]}|||{objarr:[{intarr:[isInt()], num:isInt()}]}' => true,
	'{"target":8, "objarr":[{"intarr":[1,3,5], "num":0}, {"intarr":[2,4,6], "num":1}, {"intarr":[9, 10], "num":0}]}|||{objarr:[{intarr:[isInt()], num:isInt()}], target:me -> objarr.intarr}' => false,
	'{"target":6, "objarr":[{"intarr":[1,3,5], "num":0}, {"intarr":[2,4,6], "num":1}, {"intarr":[9, 10], "num":0}]}|||{objarr:[{intarr:[isInt()], num:isInt()}], target:me -> objarr.intarr}' => true,
	'{"target":6, "objarr":[{"intarr":[1,3,5], "num":0}, {"intarr":[2,4,6], "num":1}, {"intarr":[9, 10], "num":0}]}|||{objarr:[{intarr:[isInt() && me <= 10], num:isInt()}], target:me -> objarr.intarr}' => true,
	'{"target":6, "objarr":[{"intarr":[1,3,5], "num":0}, {"intarr":[2,4,6], "num":1}, {"intarr":[9, 10], "num":0}]}|||{objarr:[{intarr:[isInt() && me <= 9], num:isInt()}], target:me -> objarr.intarr}' => false,
	'{"abc":true}|||{abc?:isBln(), bcd?:isBln()}' => true,
	'{}|||{abc?:isBln(), bcd?:isBln()}' => true,
	'{}|||{abc?:isBln(), bcd?:isBln()}:false' => false,
	'{}|||{abc?:isBln(), bcd?:isBln()}:(isBln(abc) || isBln(bcd))' => false,
	'{"abc":true}|||{abc?:isBln(), bcd?:isBln()}:(isBln(abc) || isBln(bcd))' => true,
	'{"bcd":true}|||{abc?:isBln(), bcd?:isBln()}:(isBln(abc) || isBln(bcd))' => true,
	'{"abc":true, "bcd":true}|||{abc?:isBln(), bcd?:isBln()}:(isBln(abc) || isBln(bcd))' => true,
	'{"abc":true, "bcd":true}|||{abc?:isBln(), bcd?:isBln()}:(abc || bcd)' => true,
	'{"abc":true}|||{abc?:isBln(), bcd?:isBln()}:abc || bcd' => true,
	'{"bcd":true}|||{abc?:isBln(), bcd?:isBln()}:abc || bcd' => true,
	'{}|||{abc?:isBln(), bcd?:isBln()}:abc || bcd' => false,
	'{"ab":true,"bc":true,"cd":true}|||{ab?:isBln(), bc?:isBln(), cd?:isBln()}:oneOf(ab, bc, cd)' => false,
	'{"ab":false,"bc":true,"cd":false}|||{ab?:isBln(), bc?:isBln(), cd?:isBln()}:oneOf(ab, bc, cd)' => true,
	'{"bc":true}|||{ab?:isBln(), bc?:isBln(), cd?:isBln()}:oneOf(ab, bc, cd)' => true,
	'{"bc":false}|||{ab?:isBln(), bc?:isBln(), cd?:isBln()}:oneOf(ab, bc, cd)' => false,
	'{}|||{ab?:isBln(), bc?:isBln(), cd?:isBln()}:oneOf(ab, bc, cd)' => false,
);

// set all warnings be errors
set_error_handler(function($errno, $errstr, $errfile, $errline, array $errcontext) {
	// error was suppressed with the @-operator
	if (0 === error_reporting())
		return false;
	throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

// mmmmmaximum verbose
error_reporting(-1);
ini_set('display_errors', 'On');

$disableTests = (array_key_exists('no_tests', $_GET) && $_GET['no_tests'] === 'true');

if(!$disableTests){
	echo('<pre>');
	$failCount = 0;
	$testResults = array();
	foreach($tests as $test => $result){
		$test = explode('|||', $test);
		$testData = json_decode($test[0], true);
		$testPattern = $test[1];
		$parseResult = '';
		$computedResult = null;
		$expression = null;
		try {
			$expression = new Striter($testPattern);
			$expression = $expression->nextPattern();
			if($expression instanceof Pattern){
				$parseResult = $expression->toString();
				$expression = $expression->bind(new BindingCache($testData))->simplify();
				$simplificationResult = $expression->toString();
				$computedResult = $expression->check(null, $testData);
			} else {
				$parseResult = '';
				$simplificationResult = '';
				$computedResult = '';
			}
			
		} catch(Exception $e){
			$computedResult = $e->getMessage() . ' (at line ' . $e->getLine() . ')';
			$simplificationResult = '';
		}
		if(is_float($computedResult) && is_int($result)) $result = floatval($result);
		$passed = $computedResult === $result;
		if(!$passed) $failCount++;
		
		$testResults[] = array($testPattern, $parseResult, $simplificationResult, $result, $computedResult, $passed, $testData);
	}

	echo('</pre>');

	$testCount = count($tests);
	$passedCount = $testCount - $failCount;
	echo("<p>Tests run: $testCount, passed: $passedCount, failed: $failCount</p><a href='tests_pattern.php?no_tests=true'>Run alternative test</a>");

	echo('<style>td,th,tr {border:1px solid #ccc; margin:0px; padding:2px;} table {border-spacing:0px; border-collapse:collapse; width: 100%} a { color:#000000!important; }</style>');
	echo('<table><tr><th>Data</th><th>Raw</th><th>Parsed</th><th>Simplified</th><th>Value</th></tr>');
	foreach($testResults as $result){
		$a = $result[0];
		$b = $result[1];
		$c = $result[2];
		$d = $result[3];
		$e = $result[4];
		$f = json_encode($result[6]);
		$passed = $result[5];
		//$c = is_bool($c)? ($c? 'true': 'false'): (is_null($c)? 'null': $c);
		$e = is_bool($e)? ($e? 'true': 'false'): (is_null($e)? 'null': $e);
		$enc = 'tests_pattern.php?no_tests=true&expr=' . urlencode($f) . urlencode('|||') . urlencode($a);
		echo("<tr><td>$f</td><td><a href='$enc'>$a</a></td><td>$b</td><td>$c</td><td style='background-color:" . (!$passed?'#ffcccc':'#aaffaa') . "'>$e</td></tr>");
	}
	echo('</table>');
} else {
	echo("<a href='tests_pattern.php?no_tests=false'>Run big test list</a>");
	echo('<pre>');
	
	if(!array_key_exists('expr', $_GET)){
		echo("No expression entered! Expected to pass through get-parameter 'expr' (as DATA|||PATTERN).");
		return;
	}
	$expr = explode('|||', $_GET['expr']);
	$testData = $expr[0];
	$testPattern = $expr[1];
	echo("<p>Evaluated expression: '$testPattern' on data '$testData' </p>\n");
	$testData = json_decode($expr[0], true);
	$expression = null;
	try {
		echo('<p style="margin-left:20px; font-weight:bold">');
		try{
			$expression = new Striter($testPattern);
			$expression = $expression->nextPattern()->bind(new BindingCache($testData))->simplify();
			if($expression instanceof Pattern){
				$asString = $expression->toString();
				$calcVal = $expression->check(null, $testData);
			}
		} catch(Exception $e){
			echo('</p>');
			throw $e;
		}
		echo('</p>');
		if($expression instanceof Pattern){
			echo("\nParsed expression as: " . $asString);
			$calcVal = is_bool($calcVal)? ($calcVal? 'true': 'false'): (is_null($calcVal)? 'null': $calcVal);
			echo("\nCalculated expression value: ". $calcVal);
		} else {
			echo("\nFailed to parse the expression. Get '" . $expression . '\'.');
		}
	} catch(Exception $e){
		echo('Something gone wrong: ' . $e->getMessage() . "\n\n" . $e->getTraceAsString());
	}
	echo('</pre>');
}