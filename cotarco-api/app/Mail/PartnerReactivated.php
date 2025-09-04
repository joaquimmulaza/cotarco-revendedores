<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PartnerReactivated extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $loginUrl;

    public function __construct(User $user, string $loginUrl)
    {
        $this->user = $user;
        $this->loginUrl = $loginUrl;
    }

    public function build()
    {
        return $this->subject('A sua conta foi reativada!')
                    ->markdown('emails.partner-reactivated');
    }
}
