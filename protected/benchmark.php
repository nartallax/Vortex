<?php

/* тут - различные функции для замера производительности */

$startTime = 0;
$lastTime = 0;
$peakMem = 0;

function dumpState($prefix){
	global $lastTime;
	global $startTime;
	global $peakMem;
	$newPeakMem = memory_get_peak_usage(true);
	if($newPeakMem > $peakMem) $peakMem = $newPeakMem;
	$currentTime = microtime(true);
	echo(	"\n\tmemory:\t" . (memory_get_usage(true) / 1024) . 'kb'.
			"\t peakmem:\t" . ($peakMem / 1024) . 'kb' . 
			"\ttiming:\t" . ($lastTime === 0? "N/A  ": intval(($currentTime - $lastTime) * 1000) . ' ms') . 
			"\ttotal:\t" . ($startTime === 0? "N/A  ": intval(($currentTime - $startTime) * 1000) . ' ms') . 
			"\t$prefix");
	if($startTime === 0) $startTime = $currentTime;
	$lastTime = $currentTime;
}

