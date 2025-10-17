<x-mail::message>
# Pagamento Confirmado

Olá, **{{ $order->user->name }}**

Agradecemos a sua requisição. Informamos que a sua encomenda # ID: #{{ $order->id }} foi recebida e encontra-se em fase de processamento. 

Atenciosamente,
<br>
{{ config('app.name') }}
</x-mail::message>
