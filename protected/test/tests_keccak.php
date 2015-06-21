<?php

require_once('../keccak.php');

$tests = array(
	'abcdef' => '86E0C78AB53DD68C9285DC186E24C5DD59788850C3A07A7F39E5DAC4EC80C3C78DDFBC40FF5EEAE11661D9B1043573E82767E1080055C7747BC0E8FB8AF7A3E1',
	'86E0C78AB53DD68C9285DC186E24C5DD59788850C3A07A7F39E5DAC4EC80C3C78DDFBC40FF5EEAE11661D9B1043573E82767E1080055C7747BC0E8FB8AF7A3E1' => '30C4D12051A3006329F3474EFC04DCCF7D552FD04460BCFBF1343DA1C72E73CC873AEC0A30B8DDCEBA64046FC904F53F69B1FC97F0E0C01B69699F1A730D29BF',
	'30C4D12051A3006329F3474EFC04DCCF7D552FD04460BCFBF1343DA1C72E73CC873AEC0A30B8DDCEBA64046FC904F53F69B1FC97F0E0C01B69699F1A730D29BF' => '008714C935C11EB82090A1B4165523B096956AAD61870D01E7FA763D714EB62B299158D84C7A4932959CE616674FC219EE2973D64C671D5C8A82E51B6F18B79A',
	
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

echo('<style>td,th,tr {border:1px solid #ccc; margin:0px; padding:2px;} td, th {word-break: break-all;} table { border-spacing:0px; border-collapse:collapse; width: 100%} a { color:#000000!important; }</style>');
echo('<table><tr><th>source</th><th>hash</th></tr>');

foreach($tests as $source => $hash){
	$passed = strtolower($hash) === strtolower(Keccak::of($source));
	$color = (!$passed?'#ffcccc':'#aaffaa');
	echo("<tr><td>$source</td><td style='background-color:$color'>$hash</td></tr>");
	
}

echo('</table>');