<x-mail::message>
# Nova Encomenda Recebida

Foi registada uma nova encomenda proveniente de **{{ $order->user->name }}** no valor de {{ $order->total_amount }} Kz

<x-mail::button :url="env('FRONTEND_URL')">
Ver Encomenda
</x-mail::button>

Atenciosamente,
<br>
{{ config('app.name') }}
</x-mail::message>
