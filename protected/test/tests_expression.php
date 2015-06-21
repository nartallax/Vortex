<?php
namespace Narval;

require_once('../narval/narval.php');

use Exception;
use ErrorException;

$tests = array(
	'0' => 0,
	'635' => 635,
	'213.54' => 213.54,
	'true' => true,
	'false' => false,
	'null' => null,
	'1+1' => 2,
	'1 + 1' => 2,
	'1 - 1' => 0,
	'2 + 3 -4' => 1,
	'1 + 1 + 1' => 3,
	'2 * 2' => 4,
	'2 * 2 * 3' => 12,
	'(1 + 2) + (6 + 7)' => 16,
	'(1 + 2) * (2 + 3)' => 15,
	'(2 * 2) * (2 * 3)' => 24,
	'(2 * 2) + (2 * 3)' => 10,
	'2 * 2 * 2 * 3' => 24,
	'2 * 2 + 2 * 3' => 10,
	'2 * 2 + 2' => 6,
	'2 + 2 * 2' => 6,
	'- 4' => -4,
	'2 - 4 * 2' => -6,
	'(2-4) * 2' => -4,
	'1 % 2' => 1,
	'2 % 2' => 0,
	'5 % 2' => 1,
	'10 % 2' => 0,
	'14 % 5' => 4,
	'5 == 5' => true,
	'5.0 == 5' => true,
	'5 != 5' => false,
	'5 != 4' => true,
	'5 != 5' => false,
	'5 > 4' => true,
	'4 > 5' => false,
	'5 > 5' => false,
	'5 < 5' => false,
	'5 >= 5' => true,
	'5 <= 5' => true,
	'5 >= 6' => false,
	'5 >= 4' => true,
	'5 <= 6' => true,
	'5 <= 4' => false,
	'5 <= 6 == true' => true,
	'5 >= 6 == false' => true,
	'"test"' => 'test',
	'\'test\'' => 'test',
	'"\\""' => '"',
	"'\\\"'" =>  '\\"',
	'"\\\\"' => 'Unexpected end of string.', // exception expected
	'"\\\\\\""' => '\\\\"',
	'"test" == "test"' => true,
	'"test!" == "test"' => false,
	'"te" + "st"' => "test",
	'"te" + "st" == "t" + "est"' => true,
	'!true' => false,
	'!false' => true,
	'!!false' => false,
	'!!!false' => true,
	'!false == false' => false,
	'!true == false' => true,
	'!false == true' => true,
	'!(false == true)' => true,
	'!!(false == true)' => false,
	'!!!(false == true)' => true,
	'false == !false' => false,
	'true == !false' => true,
	'false == !true' => true,
	'!false != !true' => true,
	'!!false == !true' => true,
	'!true == !!!true' => true,
	'true || false' => true,
	'true && false' => false,
	'false || true' => true,
	'false && true' => false,
	'false || true && true' => true,
	'false || true && false' => false,
	'true && false && true' => false,
	'false || false || true' => true,
	'5 == 5? 3: 4' => 3,
	'5 != 5? 3: 4' => 4,
	'8 < 3 * 4? 7 / 4: 7 * 5' => 1.75,
	'!(5 == 6) == (5 != 6)' => true,
	'(!(5 == 6)) == (5 != 6)' => true,
	'"es" -> "test"' => true,
	'"se" -> "test"' => false,
	'"es" -> "test"? 5 - 4: 4 - 5' => 1,
	'5 - 4 > 0? "se" -> "test": "es" -> "test"' => false,
	'5 > 10? 5 < 3? "a":"b":"c"' => 'c',
	'5 > 4? 5 < 3? "a":"b":"c"' => 'b',
	'5 > 4? 5 < 6? "a":"b":"c"' => 'a',
	'(5 > 6? 5 == 5: 5 < 6) || 5 > 6? "a":"b"' => 'a',
	'id' => 1,
	'value' => 'test',
	'info.value' => '160456',
	'info.is_regexp' => false,
	'info.alt.value' => '123456',
	'info.alt.is_regexp' => true,
	'5 -> info.intlist' => true,
	'5.5 -> info.intlist' => false,
	'6 -> info.intlist' => false,
	'"5" -> info.intlist' => false,
	'5.0 -> info.intlist' => true,
	'15 -> info.objlist.v' => true,
	'16 -> info.objlist.v' => false,
	'2 -> info.objlist.k' => true,
	'4.5 -> info.objlist.k' => false,
	'4 -> info.objlist.key' => true,
	'5 -> info.objlist.key' => false,
	'20 -> info.objlist.value' => true,
	'24 -> info.objlist.value' => false,
	'pow(2,5)' => 32,
	'substr("abcdef", 2)' => 'cdef',
	'substr("abcdef", 2, 3)' => 'cde',
	'isInt(5)' => true,
	'isFlt(5)' => true,
	'isInt(5.5)' => false,
	'isFlt(5.5)' => true,
	'isFlt("test")' => false,
	'isStr("test")' => true,
	'isBln("true")' => false,
	'isBln(true)' => true,
	'isNull(0)' => false,
	'isNull(null)' => true,
	'isStr("test") && isInt(4) && isFlt(5/3) && isNull(null) && false' => false,
	'isInt(3) && 3 % 2 == 1' => true,
	'1 + 2 * 3 + 4 * 5 + 6 * 7 + 8 * 9 + 10' => 151,
	'1 * 2 + 3 * 4 + 5 * 6 + 7 * 8 + 9 * 10' => 190
);

$testData = json_decode('{"id":1,"value":"test","info":{"value":"160456","is_regexp":false, "alt":{"value":"123456", "is_regexp":true}, "intlist":[1,3,5,7,9,11], "objlist":[{"k":1, "v":5}, {"k":2, "v":10}, {"k":3, "v":15}, {"key":4,"value":20}]}}', true);

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
		$parseResult = '';
		$computedResult = null;
		$expression = null;
		try {
			$expression = new Striter($test);
			$expression = $expression->nextExpression();
			if($expression instanceof Expression){
				$parseResult = $expression->toString();
				$expression = $expression->bind(new BindingCache($testData))->simplify();
				$simplificationResult = $expression->toString();
				$computedResult = $expression->value(null, null);
			} else {
				$parseResult = '';
				$simplificationResult = '';
				$computedResult = '';
			}
			
		} catch(Exception $e){
			$parseResult = '';
			$simplificationResult = '';
			$computedResult = $e->getMessage();
		}
		if(is_float($computedResult) && is_int($result)) $result = floatval($result);
		$passed = $computedResult === $result;
		if(!$passed) $failCount++;
		
		$testResults[] = array($test, $parseResult, $simplificationResult, $result, $computedResult, $passed);
	}

	echo('</pre>');

	$testCount = count($tests);
	$passedCount = $testCount - $failCount;
	echo("<p>Tests run: $testCount, passed: $passedCount, failed: $failCount</p><a href='tests_expression.php?no_tests=true'>Run alternative test</a>");

	echo('<style>td,th,tr {border:1px solid #ccc; margin:0px; padding:2px;} table {border-spacing:0px; border-collapse:collapse; width: 100%} a { color:#000000!important; }</style>');
	echo('<table><tr><th>Raw</th><th>Parsed</th><th>Simplified</th><th>Calculated</th></tr>');
	foreach($testResults as $result){
		$a = $result[0];
		$b = $result[1];
		$c = $result[2];
		$d = $result[3];
		$e = $result[4];
		$passed = $result[5];
		//$c = is_bool($c)? ($c? 'true': 'false'): (is_null($c)? 'null': $c);
		$e = is_bool($e)? ($e? 'true': 'false'): (is_null($e)? 'null': $e);
		$enc = 'tests_expression.php?no_tests=true&expr=' . urlencode($a);
		echo("<tr><td><a href='$enc'>$a</a></td><td>$b</td><td>$c</td><td style='background-color:" . (!$passed?'#ffcccc':'#aaffaa') . "'>$e</td></tr>");
	}
	echo('</table>');
} else {
	echo("<a href='tests_expression.php?no_tests=false'>Run big test list</a>");
	echo('<pre>');
	
	if(!array_key_exists('expr', $_GET)){
		echo("No expression entered! Expected to pass through get-parameter 'expr'.");
		return;
	}
	$expr = $_GET['expr'];
	echo("<p>Evaluated expression: '$expr'</p>\n");
	$expression = null;
	try {
		echo('<p style="margin-left:20px; font-weight:bold">');
		try{
			$expression = new Striter($expr);
			$expression = $expression->nextExpression()->bind(new BindingCache($testData));
			if($expression instanceof Expression){
				$asString = $expression->toString();
				$calcVal = $expression->value(null, null);
			}
		} catch(Exception $e){
			echo('</p>');
			throw $e;
		}
		echo('</p>');
		if($expression instanceof Expression){
			echo("\nParsed expression as: " . $asString);
			$calcVal = is_bool($calcVal)? ($calcVal? 'true': 'false'): (is_null($calcVal)? 'null': $calcVal);
			echo("\nCalculated expression value: ". $calcVal);
		} else {
			echo("\nFailed to parse the expression. Get '" . $expression . '\'.');
		}
	} catch(Exception $e){
		echo('Something gone wrong: ' . $e->getMessage() . "\n\n" . $e->getTraceAsString());
		/*
		$trace = $e->getTrace();
		foreach($trace as $key => $data){
			$file = $data['file'];
			$line = $data['line'];
			echo("\n\t\t#$key\t$file : $line");
		}
		*/
	}
	echo('</pre>');
}