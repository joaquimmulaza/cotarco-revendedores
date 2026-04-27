<?php
$request = \Illuminate\Http\Request::create('/api/admin/dashboard-stats', 'GET');
$controller = app(\App\Http\Controllers\Admin\AdminController::class);
$response = $controller->getDashboardStats($request);
echo $response->getContent();
