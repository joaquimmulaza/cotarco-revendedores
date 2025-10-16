<x-mail::message>
# Nova Encomenda Recebida

O distribuidor **{{ $order->user->name }}** fez uma nova encomenda.

**Valor Total:** {{ $order->total_amount }} Kz

<x-mail::button :url="env('FRONTEND_URL') . '/admin/dashboard'">
Ver Encomenda
</x-mail::button>

Obrigado,
<br>
{{ config('app.name') }}
</x-mail::message>
