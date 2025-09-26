<?php

namespace App\Observers;

use App\Models\StockFile;
use Illuminate\Support\Facades\Artisan;

class StockFileObserver
{
    /**
     * Handle the StockFile "updated" event.
     */
    public function updated(StockFile $stockFile): void
    {
        \Illuminate\Support\Facades\Artisan::call('cache:clear');
    }

    /**
     * Handle the StockFile "deleted" event.
     */
    public function deleted(StockFile $stockFile): void
    {
        \Illuminate\Support\Facades\Artisan::call('cache:clear');
    }
}


