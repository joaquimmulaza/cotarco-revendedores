<?php

namespace App\Observers;

use App\Models\StockFile;
use Illuminate\Support\Facades\Cache;

class StockFileObserver
{
    /**
     * Handle the StockFile "updated" event.
     */
    public function updated(StockFile $stockFile): void
    {
        Cache::tags(['products'])->flush();
    }

    /**
     * Handle the StockFile "deleted" event.
     */
    public function deleted(StockFile $stockFile): void
    {
        Cache::tags(['products'])->flush();
    }
}


