<x-mail::message>
# Pagamento Confirmado

A encomenda #{{ $order->id }} do parceiro **{{ $order->user->name }}** foi paga.

<x-mail::button :url="env('FRONTEND_URL') . '/admin/dashboard'">
Ver Encomenda
</x-mail::button>

Obrigado,
<br>
{{ config('app.name') }}
</x-mail::message>
