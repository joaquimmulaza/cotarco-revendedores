<x-mail::message>
# Pagamento Efectuado

Foi confirmado um pagamento proveniente de **{{ $order->user->name }}** referente à encomenda ID: #{{ $order->id }}.

A encomenda encontra-se agora disponível para verificação e processamento.

<x-mail::button :url="env('FRONTEND_URL') . '/admin/dashboard'">
Ver Encomenda
</x-mail::button>

Atenciosamente,
<br>
{{ config('app.name') }}
</x-mail::message>
